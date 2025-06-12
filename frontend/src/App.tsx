/*  src/App.tsx  */
import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Link as ChakraLink,
  VStack,
  Container,
  useColorModeValue,
} from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

/* ---------- סקשנים ---------- */
import EventGate from "./components/EventGate";
import RSVPScreen from "./components/RSVPScreen";
import QRDonateScreen from "./components/QRDonateScreen";
import PhotoShareScreen from "./components/PhotoShareScreen";
import SinglesCornerScreen from "./components/SinglesCornerScreen";
import AdminScreen from "./components/AdminScreen";

/* --------------------------------------------------------------
 *  CONSTANTS
 * --------------------------------------------------------------*/
const NAV_HEIGHT = "64px"; // גובה הבר (התאם במידת הצורך)

/* --------------------------------------------------------------
 *  NavBar – תפריט ניווט
 * --------------------------------------------------------------*/
const NavBar: React.FC = () => {
  const navLinks = [
    { label: "הזמנה", href: "#invite" },
    { label: "אישור הגעה", href: "#rsvp" },
    { label: "מתנה", href: "#donate" },
    { label: "תמונות", href: "#photos" },
    { label: "היכרויות", href: "#singles" },
  ];

  const bg = useColorModeValue("bg.canvas", "gray.900");

  return (
    <Box
      as="nav"
      bg={bg}
      h={NAV_HEIGHT}
      boxShadow="sm"
      position="sticky"
      top="0"
      zIndex="1000"
      dir="rtl"
    >
      <Container maxW="7xl" h="full">
        <Flex
          as="ul"
          h="full"
          justify="center"
          align="center"
          wrap="wrap"
          gap={4}
        >
          {navLinks.map((link) => (
            <ChakraLink
              key={link.href}
              href={link.href}
              px={3}
              py={1}
              rounded="md"
              fontWeight="semibold"
              _hover={{ color: "primary" }}
            >
              {link.label}
            </ChakraLink>
          ))}

          <Link to="/admin">
            <Button
              variant="ghost"
              px={3}
              py={1}
              fontWeight="semibold"
              _hover={{ color: "primary" }}
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
 *  Home – כל הסקשנים עם scrollMarginTop
 * --------------------------------------------------------------*/
const Home: React.FC = () => (
  <VStack spacing={24} py={12} align="stretch">
    <Box id="invite"  scrollMarginTop={NAV_HEIGHT}>
      <EventGate />
    </Box>
    <Box id="rsvp"    scrollMarginTop={NAV_HEIGHT}>
      <RSVPScreen />
    </Box>
    <Box id="donate"  scrollMarginTop={NAV_HEIGHT}>
      <QRDonateScreen />
    </Box>
    <Box id="photos"  scrollMarginTop={NAV_HEIGHT}>
      <PhotoShareScreen />
    </Box>
    <Box id="singles" scrollMarginTop={NAV_HEIGHT}>
      <SinglesCornerScreen />
    </Box>
  </VStack>
);

/* --------------------------------------------------------------
 * 404
 * --------------------------------------------------------------*/
const NotFound: React.FC = () => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    h="60vh"
    dir="rtl"
  >
    <Heading size="2xl" mb={4}>
      404 – הדף לא נמצא
    </Heading>
    <Text fontSize="lg">סליחה, לא מצאנו את מה שחיפשת.</Text>
  </Flex>
);

/* --------------------------------------------------------------
 *  App
 * --------------------------------------------------------------*/
const App: React.FC = () => {
  const pageBg = useColorModeValue("bg.subtle", "gray.800");
  const textClr = useColorModeValue("text.primary", "text.primary");

  return (
    <Router>
      <Flex
        direction="column"
        minH="100vh"
        bg={pageBg}
        color={textClr}
        dir="rtl"
      >
        <NavBar />

        <Box as="main" flex="1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>

        <Box as="footer" bg="bg.canvas" py={4} textAlign="center">
          <Text fontSize="sm" color="text.secondary">
            © 2025 טובת &nbsp;&amp;&nbsp; ירדן
          </Text>
        </Box>
      </Flex>
    </Router>
  );
};

export default App;