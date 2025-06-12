/* src/theme.ts – “Beach Vibes” */
import { extendTheme, type ThemeConfig, type StyleFunctionProps, type ComponentStyleConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

/* ------------------------------------------------------------------
 *  Palette  –  Sand (brand)  &  Sea (accent)
 * ------------------------------------------------------------------*/
const colors = {
  brand: {
    50:  "#FFF9EF",
    100: "#FDECCF",
    200: "#FADFAA",
    300: "#F6D184",
    400: "#F2C45E",
    500: "#F5C26B",   // Golden sand – “Sunrise Gold”
    600: "#D1A456",
    700: "#AE8741",
    800: "#8B6A2D",
    900: "#664C1A",
  },
  accent: {
    50:  "#E6FFFB",
    100: "#B5F2E9",
    200: "#84E6D6",
    300: "#52DAC3",
    400: "#21CEB0",
    500: "#11B39A",   // Turquoise sea
    600: "#0D8F7A",
    700: "#0A6B5B",
    800: "#06473B",
    900: "#03241C",
  },
};

/* ------------------------------------------------------------------
 *  Global config
 * ------------------------------------------------------------------*/
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

/* ------------------------------------------------------------------
 *  Semantic tokens – “חוף-ים” 24/7
 * ------------------------------------------------------------------*/
const semanticTokens = {
  colors: {
    primary: { default: "brand.500", _dark: "brand.300" },   // כותרות / CTA
    secondary: { default: "accent.500", _dark: "accent.300" }, // נגיעות ים
    bg: {
      canvas: {                                             // רקע הדף
        default: "brand.50",                                // חוף-חול בהיר
        _dark: "accent.900",                                // ים עמוק בלילה
      },
      gradient: {                                           // גרדיאנט כללי
        default: "linear(to-b, brand.50 0%, accent.50 100%)",
        _dark:   "linear(to-b, accent.800 0%, brand.700 100%)",
      },
      card: {
        default: "white",
        _dark: "gray.800",
      },
    },
    border: { subtle: { default: "brand.200", _dark: "accent.700" } },
    text: {
      primary:  { default: "brand.800", _dark: "accent.100" },
      muted:    { default: "brand.700", _dark: "accent.200" },
    },
  },
};

/* ------------------------------------------------------------------
 *  Layer & text styles
 * ------------------------------------------------------------------*/
const layerStyles = {
  card: {
    bg: "bg.card",
    borderRadius: "xl",
    boxShadow: "md",
    p: 6,
  },
};

const textStyles = {
  h1: { fontFamily: "heading", fontSize: ["3xl", "4xl"], fontWeight: "bold", color: "primary" },
  h2: { fontFamily: "heading", fontSize: ["2xl", "3xl"], fontWeight: "bold", color: "primary" },
};

/* ------------------------------------------------------------------
 *  Component overrides
 * ------------------------------------------------------------------*/
const Button: ComponentStyleConfig = {
  baseStyle: {
    fontWeight: "semibold",
    borderRadius: "full",
  },
  variants: {
    solid: (p) => ({
      bg: mode("brand.500", "accent.500")(p),
      color: "white",
      _hover: { bg: mode("brand.600", "accent.600")(p) },
      _active: { bg: mode("brand.700", "accent.700")(p) },
    }),
    outline: (p) => ({
      borderColor: mode("brand.500", "accent.300")(p),
      color: mode("brand.600", "accent.200")(p),
      _hover: { bg: mode("brand.50", "accent.700")(p), color: "white" },
    }),
    ghost: (p) => ({
      color: mode("brand.600", "accent.200")(p),
      _hover: { bg: mode("brand.100", "accent.700")(p) },
    }),
  },
  defaultProps: { variant: "solid" },
};

const HeadingStyles: ComponentStyleConfig = {
  baseStyle: { fontFamily: "heading", color: "primary" },
};

const InputLike = {
  defaultProps: { focusBorderColor: "secondary" },
};

/* ------------------------------------------------------------------
 *  Global styles – גרדיאנט גוף
 * ------------------------------------------------------------------*/
const styles = {
  global: (p: StyleFunctionProps) => ({
    "html, body": {
      /* צבע טקסט ורקע בסיסי */
      backgroundColor: mode("brand.50", "accent.900")(p),
      color: mode("brand.900", "accent.50")(p),

      /* גרדיאנט חוף-ים */
      backgroundImage: mode(
        "linear(to-b, brand.50 0%, accent.50 100%)",
        "linear(to-b, accent.900 0%, brand.700 100%)"
      )(p),

      /* שומר על הגרדיאנט רציף בגלילה */
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",

      /* גובה מינימום — מסך מלא */
      minHeight: "100vh",
    },
  }),
};

/* ------------------------------------------------------------------
 *  Theme
 * ------------------------------------------------------------------*/
export default extendTheme({
  config,
  colors,
  semanticTokens,
  fonts: {
    heading: `"Merriweather", serif`,
    body: `"Inter", sans-serif`,
  },
  radii: { xl: "1rem", "2xl": "1.5rem" },
  layerStyles,
  textStyles,
  shadows: { md: "0 6px 18px rgba(0,0,0,0.08)" },
  styles,
  components: {
    Button,
    Heading: HeadingStyles,
    Input: InputLike,
    Select: InputLike,
    Textarea: InputLike,
  },
});