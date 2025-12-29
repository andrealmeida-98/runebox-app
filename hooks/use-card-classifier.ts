import { useEffect, useState } from "react";
import type { TensorflowModel } from "react-native-fast-tflite";
import { loadTensorflowModel } from "react-native-fast-tflite";

/**
 * Hook to load the card classifier model
 * Place your card_classifier.tflite in assets/models/
 */
const modelPath = require("../assets/models/card_classifier.tflite");

export function useCardClassifier() {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        console.log("Loading Card Classifier Model...");

        // Load the TFLite model
        const loadedModel = await loadTensorflowModel(modelPath);

        if (isMounted) {
          setModel(loadedModel);
          setLoading(false);
          console.log("✅ Card Classifier Model loaded successfully");
        }
      } catch (err) {
        console.error("Failed to load classifier model:", err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  return { model, loading, error };
}
