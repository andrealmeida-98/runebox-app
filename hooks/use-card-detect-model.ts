import { useEffect, useState } from "react";
import type { TensorflowModel } from "react-native-fast-tflite";
import { loadTensorflowModel } from "react-native-fast-tflite";

const modelPath = require("../assets/models/card_detector.tflite");

export function useCardDetector() {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        const loadedModel = await loadTensorflowModel(modelPath);
        if (isMounted) {
          setModel(loadedModel);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  return { model, loading, error };
}
