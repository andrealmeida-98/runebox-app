import { NotificationSeverity } from "@/components/notification";
import React, { createContext, useCallback, useContext, useState } from "react";

interface NotificationState {
  visible: boolean;
  message: string;
  severity: NotificationSeverity;
}

interface NotificationContextType {
  notification: NotificationState;
  showNotification: (message: string, severity: NotificationSeverity) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    message: "",
    severity: "info",
  });

  const showNotification = useCallback(
    (message: string, severity: NotificationSeverity) => {
      setNotification({
        visible: true,
        message,
        severity,
      });
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notification, showNotification, hideNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}

// Convenience hooks for specific severity levels
export function useShowSuccess() {
  const { showNotification } = useNotification();
  return useCallback(
    (message: string) => showNotification(message, "success"),
    [showNotification]
  );
}

export function useShowError() {
  const { showNotification } = useNotification();
  return useCallback(
    (message: string) => showNotification(message, "error"),
    [showNotification]
  );
}

export function useShowWarning() {
  const { showNotification } = useNotification();
  return useCallback(
    (message: string) => showNotification(message, "warning"),
    [showNotification]
  );
}

export function useShowInfo() {
  const { showNotification } = useNotification();
  return useCallback(
    (message: string) => showNotification(message, "info"),
    [showNotification]
  );
}
