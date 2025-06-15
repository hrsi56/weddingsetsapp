// src/main.tsx
import React from "react";
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
 * Color mode manager ללא אחסון: תמיד שואב ממערכת ההפעלה בלבד
 */
const noStorageManager: ColorModeManager = {
  type: "cookie", // חובה לפי הממשק, לא באמת בשימוש
  get: (): ColorMode => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light"; // ברירת מחדל לסביבת SSR או טעינה מוקדמת
  },
  set: () => {
    // לא שומר שום דבר — קריאה בלבד
  },
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing <div id='root'> in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme} colorModeManager={noStorageManager}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);