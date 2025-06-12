import { Global } from "@emotion/react";

export const GlobalStyles = () => (
  <Global
    styles={`
      /* בחירת־טקסט */
      ::selection {
        background: var(--chakra-colors-brand-400);
        color: var(--chakra-colors-white);
      }

      /* מעבר חלק בגלילה */
      html {
        scroll-behavior: smooth;
      }

      /* ניקוי margins default של body + גובה מלא */
      html, body, #root {
        height: 100%;
        margin: 0;
      }

      /* Scroll-bar דקיק */
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background-color: var(--chakra-colors-gray-400);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
    `}
  />
);