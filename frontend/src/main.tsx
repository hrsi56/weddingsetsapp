import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";
import "./index.css";

// איתור אלמנט השורש באפליקציה
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element. Make sure there is a div with id='root' in your index.html.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/*
      ה-ColorModeScript חייב להופיע לפני ה-ChakraProvider.
      הוא מוסיף סקריפט קטן שרץ עוד לפני ריאקט ומונע "הבהוב" (flicker)
      של ערכת נושא שגויה בזמן טעינת העמוד.
    */}
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />

    {/*
      ה-ChakraProvider "עוטף" את כל האפליקציה ומספק לה את
      הגדרות העיצוב המותאמות אישית שלנו מהקובץ theme.ts.
    */}
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
