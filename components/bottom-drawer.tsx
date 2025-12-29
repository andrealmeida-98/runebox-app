import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: string;
  headerRight?: ReactNode;
}

export function BottomDrawer({
  visible,
  onClose,
  title,
  children,
  maxHeight = "75%",
  headerRight,
}: BottomDrawerProps) {
  // Independent animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const drawerTranslateY = useRef(new Animated.Value(1000)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Drag gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drags > 5px
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          drawerTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 150px, close drawer
        if (gestureState.dy > 150) {
          onClose();
        } else {
          // Spring back to original position
          Animated.spring(drawerTranslateY, {
            toValue: 0,
            damping: 20,
            stiffness: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset drawer position before animating in
      drawerTranslateY.setValue(1000);
      backdropOpacity.setValue(0);

      // Parallel: backdrop fades in while drawer slides up
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(drawerTranslateY, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Quick fade out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(drawerTranslateY, {
          toValue: 1000,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Fixed backdrop - ONLY fades */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable style={styles.backdropPress} onPress={onClose} />
        </Animated.View>

        {/* Drawer - ONLY slides + keyboard adjustment */}
        <Animated.View
          style={[
            styles.drawer,
            { maxHeight: maxHeight as any },
            {
              transform: [{ translateY: drawerTranslateY }],
              marginBottom: Platform.OS === "android" ? keyboardHeight : 0, // Push drawer up only on Android
            },
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            {/* Drag handle area - draggable */}
            <View
              style={styles.dragHandleContainer}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragIndicator} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {headerRight && (
                <View style={styles.headerRight}>{headerRight}</View>
              )}
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropPress: {
    flex: 1,
  },
  drawer: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "50%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(148, 163, 184, 0.4)",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f1f5f9",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  content: {
    flex: 1,
  },
});
