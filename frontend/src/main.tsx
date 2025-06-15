// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";
import { GlobalStyles } from "./GlobalStyles"; // אופציונלי – אם אתה צריך

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. ודא שיש <div id=\"root\"> ב-index.html.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      {/* ColorModeScript קובע את מצב הצבע לפי מערכת ההפעלה */}
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <GlobalStyles />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);