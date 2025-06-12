import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";
import { GlobalStyles } from "./GlobalStyles";

/*  ניתן להסיר את index.css אם אין לך חוקים נוספים,
    או להשאיר כדי לייבא גופנים וכדומה. */
// import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* ColorModeScript שומר על מצב-צבע בין רענונים */}
    <ColorModeScript
      initialColorMode={theme.config.initialColorMode}
      // optional: storageKey="my-custom-color-mode"  // אם תרצה מפתח LocalStorage מותאם
    />

    <ChakraProvider theme={theme}>
      <GlobalStyles />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);