// src/theme.ts
import { extendTheme } from "@chakra-ui/react";

/**
 *  קונפיגורציה בסיסית (plain object)
 */
const config = {
    initialColorMode: "light",
    useSystemColorMode: false,
};

/**
 *  פלטת צבעים בסגנון “זריחה על החוף”:
 */
const colors = {
    brand: {
        sunriseGold: "#F5C26B",
        seaTurquoise: "#40E0D0",
        skyBlue: "#A0E9FD",
        pureWhite: "#FFFFFF",
        lightGray: "#E5E5E5",
        text: "#4A3B31",
    },
};

/**
 *  טיפוגרפיה:
 */
const fonts = {
    heading: `"Merriweather", serif`,
    body: `"Inter", sans-serif`,
};

/**
 *  מעגלים (radii) וצללים:
 */
const radii = {
    xlRounded: "1rem",
};

const shadows = {
    "soft-lg": "0 5px 15px rgba(0, 0, 0, 0.1)",
};

/**
 *  התאמות גלובליות של קומפוננטות Chakra:
 */
const components = {
    Button: {
        baseStyle: {
            borderRadius: "xlRounded",
            fontWeight: "semibold",
        },
        variants: {
            solid: (props: any) => ({
                bg:
                    props.colorMode === "light"
                        ? "brand.sunriseGold"
                        : "brand.seaTurquoise",
                color: "brand.pureWhite",
                _hover: {
                    bg:
                        props.colorMode === "light"
                            ? "yellow.400"
                            : "teal.400",
                },
            }),
        },
    },
    Heading: {
        baseStyle: {
            fontFamily: "heading",
            color: "brand.text",
        },
    },
    Text: {
        baseStyle: {
            fontFamily: "body",
            color: "gray.700",
        },
    },
    Input: {
        defaultProps: {
            focusBorderColor: "brand.sunriseGold",
        },
    },
    Select: {
        defaultProps: {
            focusBorderColor: "brand.sunriseGold",
        },
    },
    Textarea: {
        defaultProps: {
            focusBorderColor: "brand.sunriseGold",
        },
    },
    FormLabel: {
        baseStyle: {
            color: "gray.800",
            fontWeight: "medium",
            mb: 1,
        },
    },
};

const theme = extendTheme({
    config,
    colors,
    fonts,
    radii,
    shadows,
    components,
});

export default theme;