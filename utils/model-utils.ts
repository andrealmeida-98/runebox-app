import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import type { TensorflowModel } from "react-native-fast-tflite";

const MODEL_INPUT_SIZE = 416;
const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Interface para o resultado da detecção
 */
export interface CardDetection {
  confidence: number;
  x: number; // Normalized 0-1, top-left corner
  y: number; // Normalized 0-1, top-left corner
  width: number; // Normalized 0-1
  height: number; // Normalized 0-1
}

/**
 * Interface para o resultado da classificação
 */
export interface CardClassification {
  cardId: string;
  confidence: number;
}

/**
 * Interface para detecção + classificação combinadas
 */
export interface DetectedCard extends CardDetection {
  classification?: CardClassification;
}

/**
 * Optimized detection for camera frames (already 416x416 RGB from resize plugin)
 * This is the MAIN function used in the frame processor
 *
 * @param model - TensorFlow Lite model
 * @param rgbData - RGB data at 416x416 from resize plugin (Uint8Array)
 * @returns Array of detections with confidence >= 0.75
 */
export async function detectCardsFromCameraFrame(
  model: TensorflowModel,
  rgbData: Uint8Array
): Promise<CardDetection[]> {
  // Normalize pixels from [0, 255] to [0, 1]
  const normalizedData = new Float32Array(rgbData.length);
  for (let i = 0; i < rgbData.length; i++) {
    normalizedData[i] = rgbData[i] / 255.0;
  }

  // Run inference
  const outputs = await model.run([normalizedData]);

  // Process results
  return parseModelOutput(outputs, CONFIDENCE_THRESHOLD);
}

/**
 * Pré-processa uma imagem para o modelo de detecção
 * Redimensiona para 416x416 e normaliza os valores dos pixels para [0, 1]
 */
export function preprocessImageForDetection(
  imageData: Uint8Array,
  width: number,
  height: number
): Float32Array {
  // Redimensionar se necessário
  const resizedData =
    width === MODEL_INPUT_SIZE && height === MODEL_INPUT_SIZE
      ? imageData
      : resizeImage(
          imageData,
          width,
          height,
          MODEL_INPUT_SIZE,
          MODEL_INPUT_SIZE
        );

  // Normalizar pixels de [0, 255] para [0, 1]
  const normalizedData = new Float32Array(resizedData.length);
  for (let i = 0; i < resizedData.length; i++) {
    normalizedData[i] = resizedData[i] / 255.0;
  }

  return normalizedData;
}

/**
 * Redimensiona uma imagem usando nearest neighbor
 */
function resizeImage(
  data: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Uint8Array {
  const resized = new Uint8Array(dstWidth * dstHeight * 3);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * srcWidth + srcX) * 3;
      const dstIdx = (y * dstWidth + x) * 3;

      resized[dstIdx] = data[srcIdx]; // R
      resized[dstIdx + 1] = data[srcIdx + 1]; // G
      resized[dstIdx + 2] = data[srcIdx + 2]; // B
    }
  }

  return resized;
}

/**
 * Parse model output into CardDetection array
 * Model output format: [[confidence, x, y, width, height], ...]
 *
 * @param outputs - Raw model output
 * @param threshold - Minimum confidence threshold (0-1)
 * @returns Array of valid detections
 */
function parseModelOutput(outputs: any[], threshold: number): CardDetection[] {
  const detections: CardDetection[] = [];

  if (!outputs || outputs.length === 0) {
    return detections;
  }

  const output = outputs[0];

  // Handle nested array format: [[conf, x, y, w, h], ...]
  if (Array.isArray(output)) {
    for (const detection of output as any[]) {
      if (Array.isArray(detection) && detection.length >= 5) {
        const confidence = detection[0];

        if (confidence >= threshold) {
          detections.push({
            confidence: Number(detection[0]),
            x: Number(detection[1]),
            y: Number(detection[2]),
            width: Number(detection[3]),
            height: Number(detection[4]),
          });
        }
      }
    }
  }
  // Handle flat array format: [conf, x, y, w, h, conf, x, y, w, h, ...]
  else {
    const numDetections = output.length / 5;

    for (let i = 0; i < numDetections; i++) {
      const offset = i * 5;
      const confidence = output[offset];

      if (confidence >= threshold) {
        detections.push({
          confidence: Number(output[offset]),
          x: Number(output[offset + 1]),
          y: Number(output[offset + 2]),
          width: Number(output[offset + 3]),
          height: Number(output[offset + 4]),
        });
      }
    }
  }

  return detections;
}

/**
 * Executa a detecção de cartas numa imagem estática
 * @param model - Modelo TensorFlow Lite carregado
 * @param imageData - Dados da imagem em RGB (Uint8Array)
 * @param width - Largura da imagem original
 * @param height - Altura da imagem original
 * @returns Array de detecções
 */
export async function detectCards(
  model: TensorflowModel,
  imageData: Uint8Array,
  width: number,
  height: number
): Promise<CardDetection[]> {
  // Pré-processar a imagem
  const inputTensor = preprocessImageForDetection(imageData, width, height);

  // Executar inferência
  const outputs = await model.run([inputTensor]);

  // Processar resultados (lower threshold for static images)
  return parseModelOutput(outputs, 0.5);
}

/**
 * Carrega e processa uma imagem local para detecção
 * @param imageSource - Source da imagem (require ou URI)
 * @returns Dados da imagem processados e dimensões
 */
export async function loadImageForDetection(
  imageSource: number | string
): Promise<{
  data: Uint8Array;
  width: number;
  height: number;
}> {
  let uri: string;

  // Se for um require(), usar Asset para obter o URI
  if (typeof imageSource === "number") {
    const asset = Asset.fromModule(imageSource);
    await asset.downloadAsync();
    uri = asset.localUri || asset.uri;
  } else {
    uri = imageSource;
  }

  // Redimensionar para 416x416 e obter base64
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
    { base64: true, format: ImageManipulator.SaveFormat.PNG }
  );

  if (!manipResult.base64) {
    throw new Error("Failed to get base64 from image");
  }

  // Converter base64 para Uint8Array RGB
  const imageData = await base64ToRGB(manipResult.base64);

  return {
    data: imageData,
    width: MODEL_INPUT_SIZE,
    height: MODEL_INPUT_SIZE,
  };
}

/**
 * Converte uma string base64 PNG para array RGB usando File API
 */
async function base64ToRGB(base64: string): Promise<Uint8Array> {
  // Remover o prefixo data:image se existir
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  // Criar um ficheiro temporário
  const tempFile = new File(Paths.cache, `temp_image_${Date.now()}.png`);

  try {
    // Escrever a imagem como base64
    tempFile.write(cleanBase64, { encoding: "base64" });

    // Usar ImageManipulator para garantir que temos uma imagem válida de 416x416
    const manipResult = await ImageManipulator.manipulateAsync(
      tempFile.uri,
      [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
      { format: ImageManipulator.SaveFormat.PNG }
    );

    // Ler os bytes do PNG resultante
    const manipFile = new File(manipResult.uri);
    const pngBase64 = await manipFile.base64();

    // Converter para Uint8Array
    const binaryString = atob(pngBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Limpar ficheiros temporários
    tempFile.delete();
    manipFile.delete();

    return bytes;
  } catch (error) {
    console.error("Error in base64ToRGB:", error);
    try {
      tempFile.delete();
    } catch {
      // Ignorar erros de limpeza
    }
    throw error;
  }
}

/**
 * Processa uma imagem capturada da câmera (base64) para detecção
 * Usa ImageManipulator para garantir o formato correto
 */
export async function processCameraFrameForDetection(base64: string): Promise<{
  data: Uint8Array;
  width: number;
  height: number;
}> {
  // Adicionar prefixo data URI se não existir
  const dataUri = base64.startsWith("data:")
    ? base64
    : `data:image/png;base64,${base64}`;

  // Redimensionar para 416x416 e obter base64 limpo
  const manipResult = await ImageManipulator.manipulateAsync(
    dataUri,
    [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
    { base64: true, format: ImageManipulator.SaveFormat.PNG }
  );

  if (!manipResult.base64) {
    throw new Error("Failed to get base64 from camera frame");
  }

  // Converter base64 para Uint8Array RGB
  const imageData = await base64ToRGB(manipResult.base64);

  return {
    data: imageData,
    width: MODEL_INPUT_SIZE,
    height: MODEL_INPUT_SIZE,
  };
}

/**
 * Crops a region from RGB image data
 * @param rgbData - Full image RGB data (Uint8Array)
 * @param width - Full image width
 * @param height - Full image height
 * @param x - Normalized x coordinate (0-1)
 * @param y - Normalized y coordinate (0-1)
 * @param w - Normalized width (0-1)
 * @param h - Normalized height (0-1)
 * @returns Cropped RGB data at 416x416
 */
export function cropAndResizeRegion(
  rgbData: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number
): Uint8Array {
  "worklet";

  // Convert normalized coordinates to pixel coordinates
  const startX = Math.floor(x * width);
  const startY = Math.floor(y * height);
  const cropWidth = Math.floor(w * width);
  const cropHeight = Math.floor(h * height);

  // Clamp to image bounds
  const clampedStartX = Math.max(0, Math.min(startX, width - 1));
  const clampedStartY = Math.max(0, Math.min(startY, height - 1));
  const clampedEndX = Math.max(0, Math.min(startX + cropWidth, width));
  const clampedEndY = Math.max(0, Math.min(startY + cropHeight, height));
  const clampedWidth = clampedEndX - clampedStartX;
  const clampedHeight = clampedEndY - clampedStartY;

  // Extract the cropped region
  const croppedData = new Uint8Array(clampedWidth * clampedHeight * 3);
  for (let row = 0; row < clampedHeight; row++) {
    for (let col = 0; col < clampedWidth; col++) {
      const srcIdx =
        ((clampedStartY + row) * width + (clampedStartX + col)) * 3;
      const dstIdx = (row * clampedWidth + col) * 3;
      croppedData[dstIdx] = rgbData[srcIdx]; // R
      croppedData[dstIdx + 1] = rgbData[srcIdx + 1]; // G
      croppedData[dstIdx + 2] = rgbData[srcIdx + 2]; // B
    }
  }

  // Resize cropped region to 416x416 using nearest neighbor
  const dstWidth = MODEL_INPUT_SIZE;
  const dstHeight = MODEL_INPUT_SIZE;
  const resized = new Uint8Array(dstWidth * dstHeight * 3);
  const xRatio = clampedWidth / dstWidth;
  const yRatio = clampedHeight / dstHeight;

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * clampedWidth + srcX) * 3;
      const dstIdx = (y * dstWidth + x) * 3;

      resized[dstIdx] = croppedData[srcIdx]; // R
      resized[dstIdx + 1] = croppedData[srcIdx + 1]; // G
      resized[dstIdx + 2] = croppedData[srcIdx + 2]; // B
    }
  }

  return resized;
}

/**
 * Classifies a card from RGB image data
 * @param model - TensorFlow Lite classification model
 * @param rgbData - RGB data at 416x416 (Uint8Array)
 * @returns Card classification result (highest confidence ID)
 */
export async function classifyCard(
  model: TensorflowModel,
  rgbData: Uint8Array
): Promise<CardClassification | null> {
  // Normalize pixels from [0, 255] to [0, 1]
  const normalizedData = new Float32Array(rgbData.length);
  for (let i = 0; i < rgbData.length; i++) {
    normalizedData[i] = rgbData[i] / 255.0;
  }

  // Run inference
  const outputs = await model.run([normalizedData]);

  // Parse output: outputs[0] is an array/object with all IDs and confidences
  if (!outputs || outputs.length === 0) {
    return null;
  }

  const output = outputs[0];

  let maxConfidence = -Infinity;
  let maxCardId = null;

  // Handle object format: {"0": conf, "1": conf, ...}
  if (typeof output === "object" && !Array.isArray(output)) {
    for (const key in output) {
      const confidence = Number(output[key]);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxCardId = key;
      }
    }
  }
  // Handle array format: [conf0, conf1, conf2, ...] where index is the ID
  else if (Array.isArray(output)) {
    for (let i = 0; i < output.length; i++) {
      const confidence = Number(output[i]);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxCardId = String(i);
      }
    }
  }

  if (maxCardId === null) {
    return null;
  }

  return {
    cardId: maxCardId,
    confidence: maxConfidence,
  };
}

/**
 * Classifies a card synchronously (for use in worklets)
 * @param model - TensorFlow Lite classification model
 * @param rgbData - RGB data at 416x416 (Uint8Array)
 * @returns Card classification result (highest confidence ID)
 */
export function classifyCardSync(
  model: TensorflowModel,
  rgbData: Uint8Array
): CardClassification | null {
  "worklet";

  // Normalize pixels from [0, 255] to [0, 1]
  const normalizedData = new Float32Array(rgbData.length);
  for (let i = 0; i < rgbData.length; i++) {
    normalizedData[i] = rgbData[i] / 255.0;
  }

  // Run inference synchronously
  const outputs = model.runSync([normalizedData]);

  // Parse output: outputs[0] is an array/object with all IDs and confidences
  // e.g., {"0": 0.001, "1": 0.95, "2": 0.02, ...}
  // or [0.001, 0.95, 0.02, ...] where index is the ID
  if (!outputs || outputs.length === 0) {
    return null;
  }

  const output = outputs[0];

  let maxConfidence = -Infinity;
  let maxCardId = null;

  // Handle object format: {"0": conf, "1": conf, ...}
  if (typeof output === "object" && !Array.isArray(output)) {
    for (const key in output) {
      const confidence = Number(output[key]);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxCardId = key;
      }
    }
  }
  // Handle array format: [conf0, conf1, conf2, ...] where index is the ID
  else if (Array.isArray(output)) {
    for (let i = 0; i < output.length; i++) {
      const confidence = Number(output[i]);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxCardId = String(i);
      }
    }
  }

  if (maxCardId === null) {
    return null;
  }

  return {
    cardId: maxCardId,
    confidence: maxConfidence,
  };
}

/**
 * Debug helper: Compare preprocessing outputs
 * Use this to verify that camera frames and static images are processed identically
 */
export function debugPreprocessing(
  imageData: Uint8Array,
  width: number,
  height: number
): {
  dimensions: string;
  dataSize: number;
  pixelStats: {
    min: number;
    max: number;
    mean: number;
    first10: number[];
  };
} {
  const preprocessed = preprocessImageForDetection(imageData, width, height);

  // Calculate statistics
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < preprocessed.length; i++) {
    const val = preprocessed[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
  }

  return {
    dimensions: `${width}x${height}`,
    dataSize: preprocessed.length,
    pixelStats: {
      min,
      max,
      mean: sum / preprocessed.length,
      first10: Array.from(preprocessed.slice(0, 10)),
    },
  };
}
