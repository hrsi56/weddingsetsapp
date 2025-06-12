// src/App.tsx
import React from "react";
import {
    ChakraProvider,
    Box,
    Flex,
    Heading,
    Text,
    Button,
    Link as ChakraLink,
    VStack,
    Container,
} from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import customTheme from "./theme"; // וודאו שהקובץ theme.js נמצא בספריית src

// רכיבים קיימים
import EventGate from "./components/EventGate";
import RSVPScreen from "./components/RSVPScreen";
import QRDonateScreen from "./components/QRDonateScreen";
import PhotoShareScreen from "./components/PhotoShareScreen";
import SinglesCornerScreen from "./components/SinglesCornerScreen";
import AdminScreen from "./components/AdminScreen";

/* --------------------------------------------------------------
 * NavBar – תפריט ניווט עליון פשוט עם גלילה פנימית
 * --------------------------------------------------------------*/
const NavBar: React.FC = () => {
    // השתמשנו ב־Chakra Link בתוך React Router Link
    const navLinks = [
        { label: "הזמנה", href: "#invite" },
        { label: "אישור הגעה", href: "#rsvp" },
        { label: "מתנה", href: "#donate" },
        { label: "תמונות", href: "#photos" },
        { label: "היכרויות", href: "#singles" },
    ];

    return (
        <Box
            as="nav"
            bg="white"
            boxShadow="lg"
            position="sticky"
            top="0"
            zIndex="1000"
            dir="rtl"
        >
            <Container maxW="7xl">
                <Flex
                    as="ul"
                    justify="center"
                    align="center"
                    py={4}
                    wrap="wrap"
                    gap={4}
                >
                    {navLinks.map((link) => (
                        <ChakraLink
                            key={link.href}
                            href={link.href}
                            fontFamily="body"
                            fontWeight="semibold"
                            fontSize="sm"
                            px={3}
                            py={1}
                            rounded="md"
                            _hover={{ color: "brand.gold" }}
                        >
                            {link.label}
                        </ChakraLink>
                    ))}

                    {/* קישור נפרד למסך אדמין */}
                    <Link to="/admin">
                        <Button
                            variant="ghost"
                            fontFamily="body"
                            fontWeight="semibold"
                            fontSize="sm"
                            px={3}
                            py={1}
                            rounded="md"
                            _hover={{ color: "brand.gold" }}
                        >
                            אדמין
                        </Button>
                    </Link>
                </Flex>
            </Container>
        </Box>
    );
};

/* --------------------------------------------------------------
 * Home – עוטף את כל הקומפוננטות בגלילה אנכית
 * --------------------------------------------------------------*/
const Home: React.FC = () => {
    // כל סקשן מוקף ב־Container ו־Box עם תמיכה ב־chakra סטיילינג
    return (
        <VStack spacing={20} py={12} align="stretch">
                <EventGate />
                <RSVPScreen />
                <QRDonateScreen />
                <PhotoShareScreen />
                <SinglesCornerScreen />
        </VStack>
    );
};

/* --------------------------------------------------------------
 * 404 – דף לא נמצא
 * --------------------------------------------------------------*/
const NotFound: React.FC = () => (
    <Flex
        direction="column"
        align="center"
        justify="center"
        height="60vh"
        dir="rtl"
    >
        <Heading as="h1" size="2xl" mb={4} fontFamily="heading">
            404 – הדף לא נמצא
        </Heading>
        <Text fontFamily="body" fontSize="lg">
            סליחה, לא מצאנו את מה שחיפשת.
        </Text>
    </Flex>
);

/* --------------------------------------------------------------
 * App – רכיב ראשי
 * --------------------------------------------------------------*/
const App: React.FC = () => {
    return (
        <ChakraProvider theme={customTheme}>
            <Router>
                <Flex
                    direction="column"
                    minH="100vh"
                    bg="brand.skyBlue"
                    color="brand.text"
                    dir="rtl"
                >
                    <NavBar />

                    <Box as="main" flex="1">
                        <Routes>
                            {/* ברירת מחדל – הבית עם גלילת כל הקומפוננטות */}
                            <Route path="/" element={<Home />} />

                            {/* מסך אדמין נפרד */}
                            <Route path="/admin" element={<AdminScreen />} />

                            {/* 404 לכל שאר הנתיבים */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Box>

                    <Box as="footer" bg="white" py={4} textAlign="center">
                        <Text fontFamily="body" fontSize="sm" color="gray.600">
                            © 2025 טובת & ירדן
                        </Text>
                    </Box>
                </Flex>
            </Router>
        </ChakraProvider>
    );
};

export default App;