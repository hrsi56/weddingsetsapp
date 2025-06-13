/*  src/App.tsx  */
import React, { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Link as ChakraLink,
  VStack,
  Container,
  Input,
  HStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

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
const NAV_HEIGHT = "64px";
const ADMIN_PHONES = ["0547957141", "0505933883"];

/* --------------------------------------------------------------
 *  NavBar – תפריט ניווט עם אימות טלפון לאדמין
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
  const [showAdminField, setShowAdminField] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const tryOpenAdmin = () => {
    if (ADMIN_PHONES.includes(phoneInput.trim())) {
      setPhoneInput("");
      setShowAdminField(false);
      navigate("/admin");
    } else {
      toast({
        title: "מספר לא מורשה",
        status: "error",
        duration: 2500,
        isClosable: true,
      });
    }
  };

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

          {!showAdminField ? (
            <Button
              variant="ghost"
              px={3}
              py={1}
              fontWeight="semibold"
              _hover={{ color: "primary" }}
              onClick={() => setShowAdminField(true)}
            >
              אדמין
            </Button>
          ) : (
            <HStack>
              <Input
                size="sm"
                w="150px"
                placeholder="הכנס טלפון"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                focusBorderColor="primary"
                dir="ltr"
              />
              <Button size="sm" colorScheme="brand" onClick={tryOpenAdmin}>
                אישור
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAdminField(false);
                  setPhoneInput("");
                }}
              >
                ביטול
              </Button>
            </HStack>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

/* --------------------------------------------------------------
 *  Home – סקשנים
 * --------------------------------------------------------------*/
const Home: React.FC = () => (
  <VStack spacing={24} py={12} align="stretch">
    <Box id="invite" scrollMarginTop={NAV_HEIGHT}>
      <EventGate />
    </Box>
    <Box id="rsvp" scrollMarginTop={NAV_HEIGHT}>
      <RSVPScreen />
    </Box>
    <Box id="donate" scrollMarginTop={NAV_HEIGHT}>
      <QRDonateScreen />
    </Box>
    <Box id="photos" scrollMarginTop={NAV_HEIGHT}>
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
  <Flex direction="column" align="center" justify="center" h="60vh" dir="rtl">
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