import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type CurrencyType = "USD" | "EUR";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

const CURRENCY_STORAGE_KEY = "@app_currency_preference";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load currency preference on mount
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (savedCurrency === "USD" || savedCurrency === "EUR") {
        setCurrencyState(savedCurrency);
      }
    } catch (error) {
      console.error("Error loading currency preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrency = async (newCurrency: CurrencyType) => {
    try {
      setCurrencyState(newCurrency);
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch (error) {
      console.error("Error saving currency preference:", error);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
