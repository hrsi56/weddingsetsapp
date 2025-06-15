import React from "react";
import ReactDOM from "react-dom/client";
import {
  ChakraProvider,
  ColorModeScript,
  ColorModeManager,
  ColorMode,
} from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";

/**
 * מנהל צבע שמבוסס רק על prefers-color-scheme של מערכת ההפעלה
 * בלי כתיבה ל-localStorage או cookies
 */
const noStorageManager: ColorModeManager = {
  type: "cookie", // עדיין חובה לפי הממשק, אבל לא באמת שומר
  get: () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ("dark" as ColorMode)
      : ("light" as ColorMode),
  set: () => {
    // לא שומר כלום — התנהגות קריאה בלבד
  },
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing <div id=\"root\"> in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme} colorModeManager={noStorageManager}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);