import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  ChakraProvider,
  ColorModeScript,
  type ColorMode,
  type ColorModeManager,
} from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";

/**
 * יוצר colorModeManager שלא שומר כלום, רק לפי prefers-color-scheme
 */
const createNoStorageManager = (): ColorModeManager => ({
  type: "cookie",
  get: (): ColorMode =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  set: () => {}, // לא שומר
});

/**
 * עטיפה שנטענת רק כשהדפדפן מוכן — מונעת שימוש ב-window בצד שרת
 */
const ClientOnlyChakraProvider = () => {
  const [manager, setManager] = useState<ColorModeManager | null>(null);

  useEffect(() => {
    // פועל רק בדפדפן
    const noStorageManager = createNoStorageManager();
    setManager(noStorageManager);
  }, []);

  if (!manager) return null; // מחכה לטעינה בדפדפן

  return (
    <ChakraProvider theme={theme} colorModeManager={manager}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </ChakraProvider>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing <div id='root'> in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ClientOnlyChakraProvider />
  </React.StrictMode>
);