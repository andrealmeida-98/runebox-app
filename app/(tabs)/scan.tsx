import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Button,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useResizePlugin } from "vision-camera-resize-plugin";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCardClassifier } from "@/hooks/use-card-classifier";
import { useCardDetector } from "@/hooks/use-card-detect-model";
import { DetectedCard, classifyCardSync } from "@/utils/model-utils";

// Process every N frames (30 = ~1x per second at 30fps)
const FRAME_SKIP = 100;
const CONFIDENCE_THRESHOLD = 0.75;

export default function ScanScreen() {
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const {
    model: detectorModel,
    loading: detectorLoading,
    error: detectorError,
  } = useCardDetector();
  const {
    model: classifierModel,
    loading: classifierLoading,
    error: classifierError,
  } = useCardClassifier();
  const { resize } = useResizePlugin();
  const [detections, setDetections] = useState<DetectedCard[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [performanceInfo, setPerformanceInfo] = useState({
    inferenceTime: 0,
    classificationTime: 0,
    lastProcessed: 0,
  });
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState<
    {
      id: string;
      cardName: string;
      cardSet: string;
      price: string;
      quantity: number;
      timestamp: Date;
    }[]
  >([]);

  const lastDetectedCardRef = useRef<string | null>(null);

  const drawerTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          drawerTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down threshold - close drawer
          Animated.timing(drawerTranslateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowHistory(false);
            drawerTranslateY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(drawerTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const device = useCameraDevice("back");

  // Select an optimal format
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  // Frame counter for skipping
  const frameCountRef = useRef(0);

  // Update detections on JS thread
  const updateDetections = useCallback(
    (
      detections: DetectedCard[],
      inferenceTime: number,
      classificationTime: number
    ) => {
      setDetections(detections);
      setPerformanceInfo({
        inferenceTime: Math.round(inferenceTime),
        classificationTime: Math.round(classificationTime),
        lastProcessed: Date.now(),
      });

      // Add to scan history when a new card is detected and classified
      if (detections.length > 0 && detections[0].classification) {
        const cardId = detections[0].classification.cardId;
        if (cardId !== lastDetectedCardRef.current) {
          lastDetectedCardRef.current = cardId;

          setScanHistory((prev) => {
            // Check if card already exists in history
            const existingIndex = prev.findIndex(
              (item) => item.cardName === cardId
            );

            if (existingIndex >= 0) {
              // Increment quantity if card already exists
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: updated[existingIndex].quantity + 1,
                timestamp: new Date(),
              };
              return updated;
            } else {
              // Add new card to history
              return [
                {
                  id: Date.now().toString(),
                  cardName: cardId,
                  cardSet: "Unknown Set • #000",
                  price: "$0.00",
                  quantity: 1,
                  timestamp: new Date(),
                },
                ...prev,
              ];
            }
          });
        }
      } else {
        // Reset when no card detected
        lastDetectedCardRef.current = null;
      }
    },
    []
  );

  const updateDetectionsJS = useMemo(
    () => Worklets.createRunOnJS(updateDetections),
    [updateDetections]
  );

  // Frame processor - runs SYNCHRONOUSLY on worklet thread
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";

      // Skip if scanning is paused
      if (!isScanning) return;

      // Skip if models not loaded
      if (!detectorModel) return;

      // Frame skipping: only process every Nth frame
      frameCountRef.current++;
      if (frameCountRef.current % FRAME_SKIP !== 0) return;

      try {
        const startTime = performance.now();

        // 1. Resize frame to 416x416 RGB for DETECTION (fast native operation)
        const rgbData = resize(frame, {
          scale: {
            width: 416,
            height: 416,
          },
          pixelFormat: "rgb",
          dataType: "uint8",
        });

        // 2. Normalize pixels from [0, 255] to [0, 1] (in worklet)
        const normalizedData = new Float32Array(rgbData.length);
        for (let i = 0; i < rgbData.length; i++) {
          normalizedData[i] = rgbData[i] / 255.0;
        }

        // 3. Run DETECTION inference
        const outputs = detectorModel.runSync([normalizedData]);

        const detectionTime = performance.now() - startTime;

        // 4. Parse detection results
        const detections: DetectedCard[] = [];

        if (outputs && outputs.length > 0) {
          console.log(`[DETECTION RAW] Full outputs:`, outputs);
          console.log(`[DETECTION RAW] outputs.length:`, outputs.length);

          const output = outputs[0];
          console.log(`[DETECTION RAW] outputs[0]:`, output);

          // Check if there are multiple outputs
          if (outputs.length >= 2) {
            const confidenceDict = outputs[0];
            const bboxDict = outputs[1];

            console.log(`[DETECTION PARSE] Confidence dict:`, confidenceDict);
            console.log(`[DETECTION PARSE] BBox dict:`, bboxDict);

            // Extract confidence from first output
            const confidence = confidenceDict["0"];

            // Extract bbox coordinates from second output
            const x = bboxDict["0"];
            const y = bboxDict["1"];
            const w = bboxDict["2"];
            const h = bboxDict["3"];

            console.log(`[DETECTION PARSE] Parsed:`, {
              confidence,
              x,
              y,
              width: w,
              height: h,
            });

            if (
              confidence !== undefined &&
              confidence >= CONFIDENCE_THRESHOLD
            ) {
              detections.push({
                confidence: Number(confidence),
                x: Number(x),
                y: Number(y),
                width: Number(w),
                height: Number(h),
              });
            }
          } else {
            console.log(
              `[DETECTION ERROR] Only ${outputs.length} output(s), expected 2 (confidence + bbox)`
            );
          }
        }

        let classificationTime = 0;

        // 5. CLASSIFY each detected card (if classifier model is loaded)
        if (classifierModel && detections.length > 0) {
          const classifyStart = performance.now();

          for (const detection of detections) {
            // Inline crop and resize logic (must be in worklet)
            // Detection coordinates are normalized (0-1) relative to 416x416
            const startX = Math.floor(detection.x * 416);
            const startY = Math.floor(detection.y * 416);
            const cropWidth = Math.floor(detection.width * 416);
            const cropHeight = Math.floor(detection.height * 416);

            // Clamp to bounds
            const clampedStartX = Math.max(0, Math.min(startX, 415));
            const clampedStartY = Math.max(0, Math.min(startY, 415));
            const clampedEndX = Math.max(0, Math.min(startX + cropWidth, 416));
            const clampedEndY = Math.max(0, Math.min(startY + cropHeight, 416));
            const clampedWidth = clampedEndX - clampedStartX;
            const clampedHeight = clampedEndY - clampedStartY;

            // Extract cropped region from 416x416 image
            const croppedData = new Uint8Array(
              clampedWidth * clampedHeight * 3
            );
            for (let row = 0; row < clampedHeight; row++) {
              for (let col = 0; col < clampedWidth; col++) {
                const srcIdx =
                  ((clampedStartY + row) * 416 + (clampedStartX + col)) * 3;
                const dstIdx = (row * clampedWidth + col) * 3;
                croppedData[dstIdx] = rgbData[srcIdx];
                croppedData[dstIdx + 1] = rgbData[srcIdx + 1];
                croppedData[dstIdx + 2] = rgbData[srcIdx + 2];
              }
            }

            // Resize cropped region to 320x320 for CLASSIFICATION
            const resizedCrop = new Uint8Array(320 * 320 * 3);
            const xRatio = clampedWidth / 320;
            const yRatio = clampedHeight / 320;

            for (let y = 0; y < 320; y++) {
              for (let x = 0; x < 320; x++) {
                const srcX = Math.floor(x * xRatio);
                const srcY = Math.floor(y * yRatio);
                const srcIdx = (srcY * clampedWidth + srcX) * 3;
                const dstIdx = (y * 320 + x) * 3;
                resizedCrop[dstIdx] = croppedData[srcIdx];
                resizedCrop[dstIdx + 1] = croppedData[srcIdx + 1];
                resizedCrop[dstIdx + 2] = croppedData[srcIdx + 2];
              }
            }

            // Classify the cropped 320x320 card
            const classification = classifyCardSync(
              classifierModel,
              resizedCrop
            );
            detection.classification = classification || undefined;
          }

          classificationTime = performance.now() - classifyStart;
        }

        const totalTime = performance.now() - startTime;

        // 6. Update UI on JS thread (non-blocking)
        updateDetectionsJS(detections, detectionTime, classificationTime);

        console.log(
          `[PERF] Detection: ${detectionTime.toFixed(
            0
          )}ms | Classification: ${classificationTime.toFixed(
            0
          )}ms | Total: ${totalTime.toFixed(0)}ms`
        );
      } catch (err) {
        console.error("[FRAME] Error:", err);
      }
    },
    [detectorModel, classifierModel, resize, updateDetectionsJS]
  );

  const toggleScanning = useCallback(() => {
    setIsScanning((prev) => !prev);
    frameCountRef.current = 0;
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setScanHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Permission check
  if (!hasPermission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          We need your permission to use the camera
        </ThemedText>
        <Button onPress={requestPermission} title="Grant Permission" />
      </ThemedView>
    );
  }

  // Loading state
  if (detectorLoading || classifierLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText>
          Loading models...
          {detectorLoading && "\n• Detector"}
          {classifierLoading && "\n• Classifier"}
        </ThemedText>
      </ThemedView>
    );
  }

  // Error state
  if (detectorError || classifierError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Error loading models:
          {detectorError && `\n• Detector: ${detectorError.message}`}
          {classifierError && `\n• Classifier: ${classifierError.message}`}
        </ThemedText>
      </ThemedView>
    );
  }

  // No device
  if (!device) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No camera device found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        format={format}
        isActive={isScanning && isFocused}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
      />

      <View style={styles.overlay}>
        {/* Draw bounding boxes for detections */}
        {detections.map((detection, index) => {
          // Model outputs normalized coordinates (0-1) relative to 416x416 input
          // Simple 1:1 mapping to camera view size
          const boxLeft = detection.x * cameraLayout.width;
          const boxTop = detection.y * cameraLayout.height;
          const boxWidth = detection.width * cameraLayout.width;
          const boxHeight = detection.height * cameraLayout.height;

          console.log(`[BOX ${index}] Detection coords:`, {
            normalized: {
              x: detection.x,
              y: detection.y,
              w: detection.width,
              h: detection.height,
            },
            cameraLayout: cameraLayout,
            screen: {
              left: boxLeft,
              top: boxTop,
              width: boxWidth,
              height: boxHeight,
            },
          });

          return (
            <View
              key={index}
              style={[
                styles.boundingBox,
                {
                  left: boxLeft,
                  top: boxTop,
                  width: boxWidth,
                  height: boxHeight,
                },
              ]}
            >
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {(detection.confidence * 100).toFixed(0)}%
                  {detection.classification &&
                    ` • ${detection.classification.cardId}`}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Detection Info Overlay */}
        <ThemedView style={styles.detectionInfo}>
          <ThemedText style={styles.statusText}>
            {isScanning ? "🔍 Scanning..." : "⏸️ Paused"}
          </ThemedText>

          {detections.length > 0 ? (
            <View style={styles.detectionsContainer}>
              <ThemedText style={styles.successText}>
                ✅ {detections.length} card{detections.length > 1 ? "s" : ""}{" "}
                detected
              </ThemedText>
              {detections.map((detection, index) => (
                <View key={index} style={styles.detectionCard}>
                  {detection.classification && (
                    <Text style={styles.cardIdText}>
                      🎴 {detection.classification.cardId}
                    </Text>
                  )}
                  <Text style={styles.detectionText}>
                    Detection: {(detection.confidence * 100).toFixed(1)}%
                    {detection.classification && (
                      <>
                        {"\n"}
                        Classification:{" "}
                        {(detection.classification.confidence * 100).toFixed(1)}
                        %
                      </>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.noDetectionText}>
              ❌ No cards detected
            </ThemedText>
          )}
        </ThemedView>

        {/* Controls */}
        <View style={styles.controls}>
          <Button
            title={isScanning ? "⏸️ Pause" : "▶️ Resume"}
            onPress={toggleScanning}
          />
        </View>

        {/* Floating Action Buttons */}
        <Pressable
          style={styles.fabTopLeft}
          onPress={() => setShowSettings(true)}
        >
          <FontAwesome name="cog" size={16} color="white" />
        </Pressable>
        <View style={styles.fabTopRight}>
          <Pressable
            style={styles.fabButton}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.fabIcon}>
              <Entypo name="list" size={16} color="white" />
            </Text>
          </Pressable>
          {scanHistory.length > 0 && (
            <Badge style={styles.badge} size={18}>
              {scanHistory.length}
            </Badge>
          )}
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSettings(false)}
        >
          <Pressable
            style={styles.settingsCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.settingsTitle}>Scanner Settings</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingIcon}>🔊</Text>
                <Text style={styles.settingLabel}>Sound</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: "#3e3e3e", true: "#22c55e" }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingIcon}>📳</Text>
                <Text style={styles.settingLabel}>Haptics</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: "#3e3e3e", true: "#22c55e" }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingIcon}>💾</Text>
                <Text style={styles.settingLabel}>Auto-Save</Text>
              </View>
              <Switch
                value={autoSaveEnabled}
                onValueChange={setAutoSaveEnabled}
                trackColor={{ false: "#3e3e3e", true: "#22c55e" }}
                thumbColor="#ffffff"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* History Drawer */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.drawerContainer}>
          <Pressable
            style={styles.drawerBackdrop}
            onPress={() => setShowHistory(false)}
          />
          <Animated.View
            style={[
              styles.historyDrawer,
              {
                transform: [{ translateY: drawerTranslateY }],
              },
            ]}
          >
            <SafeAreaView edges={["bottom"]} style={styles.safeAreaDrawer}>
              <View
                style={styles.drawerHandleContainer}
                {...panResponder.panHandlers}
              >
                <View style={styles.drawerHandle} />
              </View>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Scan History</Text>
                <Text style={styles.historyTotal}>
                  Total: €
                  {scanHistory
                    .reduce(
                      (sum, item) =>
                        sum +
                        parseFloat(item.price.replace("$", "")) * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </Text>
              </View>
              <ScrollView style={styles.historyList}>
                {scanHistory.length === 0 ? (
                  <Text style={styles.emptyText}>No scans yet</Text>
                ) : (
                  scanHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Image
                        source={require("@/assets/images/riftbound-card-example.png")}
                        style={styles.historyCardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.historyCardInfo}>
                        <Text style={styles.historyCardName}>
                          {item.cardName}
                        </Text>
                        <Text style={styles.historyCardSet}>
                          {item.cardSet}
                        </Text>
                        <View style={styles.historyCardFooter}>
                          <Text style={styles.historyCardPrice}>
                            {item.price}
                          </Text>
                          <Text style={styles.historyCardQuantity}>
                            Qty: {item.quantity}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeFromHistory(item.id)}
                        style={styles.deleteButton}
                      >
                        <FontAwesome name="trash" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#22c55e",
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  confidenceBadge: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  performanceInfo: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  perfText: {
    color: "#fbbf24",
    fontSize: 11,
    fontFamily: "monospace",
  },
  detectionInfo: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  successText: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  noDetectionText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
  detectionsContainer: {
    marginTop: 4,
  },
  detectionCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34, 197, 94, 0.2)",
  },
  cardIdText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 6,
  },
  detectionText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  controls: {
    marginTop: 140,
    alignItems: "center",
  },
  fabTopLeft: {
    position: "absolute",
    top: 60,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: "rgba(100, 116, 139, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabTopRight: {
    position: "absolute",
    top: 60,
    right: 10,
    width: 36,
    height: 36,
  },
  fabButton: {
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: "rgba(100, 116, 139, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
  },
  fabIcon: {
    fontSize: 28,
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: "#ffffff",
  },
  drawerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  historyDrawer: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    minHeight: "30%",
    paddingTop: 12,
  },
  safeAreaDrawer: {
    flexShrink: 1,
  },
  drawerHandleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#64748b",
    borderRadius: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e39401ff",
  },
  historyList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  historyItem: {
    flexDirection: "row",
    backgroundColor: "#2d2d44",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  historyCardImage: {
    width: 40,
    height: 56,
    borderRadius: 4,
  },
  historyCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyCardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  historyCardSet: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  historyCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyCardPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#22c55e",
  },
  historyCardQuantity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  deleteButton: {
    padding: 8,
  },
});
