/*  src/App.tsx  –  Mobile-only Floating Menu Button, No Mobile Top Bar
 *  (שאר הקוד – זהה לגרסה האחרונה; שינויים רק ב־NavBar)
 * ------------------------------------------------------------------ */

import React, { useState, type ReactNode, useMemo } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  IconButton,
  Button,
  Link as ChakraLink,
  Heading,
  Text,
  Container,
  Input,
  useDisclosure,
  useToast,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  chakra,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";

/* ---------- סקשנים ---------- */
import EventGate from "./components/EventGate";
import RSVPScreen from "./components/RSVPScreen";
import QRDonateScreen from "./components/QRDonateScreen";
import PhotoShareScreen from "./components/PhotoShareScreen";
import SinglesCornerScreen from "./components/SinglesCornerScreen";
import AdminScreen from "./components/AdminScreen";

/* ------------------------------------------------------------------
 *  CONSTANTS
 * ------------------------------------------------------------------ */
const NAV_HEIGHT = "64px";
const ADMIN_PHONES = ["0547957141", "0505933883"] as const;

const navLinks = [
  { label: "הזמנה", href: "#invite" },
  { label: "אישור הגעה", href: "#rsvp" },
  { label: "מתנה", href: "#donate" },
  { label: "תמונות", href: "#photos" },
  { label: "היכרויות", href: "#singles" },
];

/* ------------------------------------------------------------------
 *  NAVBAR
 *    • Desktop ≥ md : פס ניווט רגיל
 *    • Mobile < md  : כפתור עגול צף ( Drawer menu )
 * ------------------------------------------------------------------ */
const NavBar: React.FC = () => {
  /* Mobile-drawer */
  const drawer = useDisclosure();
  /* Admin-modal (בתוך Drawer) */
  const adminModal = useDisclosure();
  const [phoneInput, setPhoneInput] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const adminSet = useMemo<Set<string>>(
    () => new Set<string>(ADMIN_PHONES),
    []
  );

  const bg       = useColorModeValue("bg.canvas", "gray.900");
  const hoverBg  = useColorModeValue("brand.100", "accent.700");

  const handleAdminLogin = () => {
    const phone = phoneInput.trim();
    if (adminSet.has(phone)) {
      setPhoneInput("");
      adminModal.onClose();
      drawer.onClose();
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

  /* ---------------- Desktop Bar ---------------- */
  const DesktopBar = (
    <Box
      display={{ base: "none", md: "block" }}
      as="header"
      bg={bg}
      position="sticky"
      top="0"
      zIndex="1000"
      boxShadow="sm"
      h={NAV_HEIGHT}
      dir="rtl"
    >
      <Container maxW="7xl" h="full">
        <Flex as="nav" h="full" align="center" justify="center" gap={4}>
          {navLinks.map((l) => (
            <ChakraLink
              key={l.href}
              href={l.href}
              px={3}
              py={2}
              rounded="md"
              fontWeight="semibold"
              _hover={{ bg: hoverBg }}
            >
              {l.label}
            </ChakraLink>
          ))}
          <Button variant="ghost" onClick={adminModal.onOpen}>
            אדמין
          </Button>
        </Flex>
      </Container>
    </Box>
  );

  /* ---------------- Mobile Floating Button ---------------- */
  const MobileButton = (
    <IconButton
      aria-label="פתיחת תפריט"
      icon={<HamburgerIcon boxSize={6} />}
      colorScheme="brand"
      borderRadius="full"
      boxSize="56px"
      position="fixed"
      bottom="24px"
      right="24px"
      zIndex="1050"
      shadow="lg"
      display={{ base: "flex", md: "none" }}
      onClick={drawer.onOpen}
    />
  );

  return (
    <>
      {DesktopBar}
      {MobileButton}

      {/* -------- Drawer תפריט מובייל -------- */}
      <Drawer
        isOpen={drawer.isOpen}
        placement="right"
        onClose={drawer.onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent dir="rtl" bg={bg}>
          <DrawerHeader borderBottomWidth="1px">
            <Button
              variant="ghost"
              onClick={drawer.onClose}
              leftIcon={<CloseIcon />}
            >
              סגור
            </Button>
          </DrawerHeader>

          <DrawerBody as={VStack} spacing={4} pt={6}>
            {navLinks.map((l) => (
              <ChakraLink
                key={l.href}
                href={l.href}
                w="full"
                textAlign="center"
                py={3}
                rounded="md"
                fontWeight="semibold"
                _hover={{ bg: hoverBg }}
                onClick={drawer.onClose}
              >
                {l.label}
              </ChakraLink>
            ))}

            {/* קטע אימות אדמין */}
            {!adminModal.isOpen ? (
              <Button
                variant="outline"
                colorScheme="brand"
                w="full"
                onClick={adminModal.onOpen}
              >
                אדמין
              </Button>
            ) : (
              <VStack w="full" spacing={3}>
                <Input
                  w="full"
                  placeholder="טלפון 10 ספרות"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  focusBorderColor="primary"
                />
                <HStack w="full">
                  <Button w="50%" colorScheme="brand" onClick={handleAdminLogin}>
                    כניסה
                  </Button>
                  <Button
                    w="50%"
                    variant="ghost"
                    onClick={() => {
                      setPhoneInput("");
                      adminModal.onClose();
                    }}
                  >
                    ביטול
                  </Button>
                </HStack>
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter />
        </DrawerContent>
      </Drawer>
    </>
  );
};

/* ------------------------------------------------------------------
 *  Section wrapper – Fade-in
 * ------------------------------------------------------------------ */
const MotionDiv = motion(chakra.div);
const Section: React.FC<{ id: string; children: ReactNode }> = ({
  id,
  children,
}) => (
  <Box id={id} scrollMarginTop={NAV_HEIGHT}>
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </MotionDiv>
  </Box>
);

const Home: React.FC = () => (
  <VStack spacing={24} py={12} align="stretch">
    <Section id="invite">
      <EventGate />
    </Section>
    <Section id="rsvp">
      <RSVPScreen />
    </Section>
    <Section id="donate">
      <QRDonateScreen />
    </Section>
    <Section id="photos">
      <PhotoShareScreen />
    </Section>
    <Section id="singles">
      <SinglesCornerScreen />
    </Section>
  </VStack>
);

/* ------------------------------------------------------------------ */
const NotFound: React.FC = () => (
  <Flex direction="column" align="center" justify="center" h="60vh" dir="rtl">
    <Heading size="2xl" mb={4}>
      404 – הדף לא נמצא
    </Heading>
    <Text fontSize="lg">סליחה, לא מצאנו את מה שחיפשת.</Text>
  </Flex>
);

/* ------------------------------------------------------------------
 *  App
 * ------------------------------------------------------------------ */
const App: React.FC = () => {
  const gradient = useColorModeValue(
    "linear(to-b, brand.50 0%, accent.50 100%)",
    "linear(to-b, accent.900 0%, brand.700 100%)"
  );
  const textClr = useColorModeValue("text.primary", "text.primary");

  return (
    <Router>
      <Flex
        direction="column"
        minH="100vh"
        bgGradient={gradient}
        backgroundAttachment="fixed"
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