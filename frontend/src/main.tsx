// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";      // שימו לב: מייבאים מ־"./theme.ts"
import "./index.css";             // אם רוצים עדיין להכליל חלקי CSS גלובליים (למשל לינקים לפונטים)

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        {/*
      ColorModeScript מוודא שבטעינה הראשונה של הדף,
      Chakra ישתמש במוד העל או התחתון לפי initialColorMode מ־theme.
    */}
        <ColorModeScript initialColorMode={theme.config?.initialColorMode} />

        {/*
      ChakraProvider עוטף את כל האפליקציה,
      ומעביר את ה־theme שהגדרנו.
    */}
        <ChakraProvider theme={theme}>
            <App />
        </ChakraProvider>
    </React.StrictMode>
);