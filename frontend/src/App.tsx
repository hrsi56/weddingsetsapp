/* src/App.tsx  –  Mobile-only Floating Menu Button, No Mobile Top Bar
 * (שאר הקוד – זהה לגרסה האחרונה; שינויים רק ב־NavBar)
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
  ModalContent,
  Modal,
  ModalBody, ModalFooter, ModalHeader, ModalCloseButton, ModalOverlay,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate, useLocation,
} from "react-router-dom";
import { motion } from "framer-motion";

/* ---------- סקשנים ---------- */
// These would be your actual component imports
const EventGate = () => <Box p={8} bg="blue.100" borderRadius="md" my={4}><Heading>Event Gate</Heading></Box>;
const RSVPScreen = () => <Box p={8} bg="green.100" borderRadius="md" my={4}><Heading>RSVP Screen</Heading></Box>;
const QRDonateScreen = () => <Box p={8} bg="purple.100" borderRadius="md" my={4}><Heading>QR Donate Screen</Heading></Box>;
const PhotoShareScreen = () => <Box p={8} bg="orange.100" borderRadius="md" my={4}><Heading>Photo Share Screen</Heading></Box>;
const SinglesCornerScreen = () => <Box p={8} bg="pink.100" borderRadius="md" my={4}><Heading>Singles Corner Screen</Heading></Box>;
const AdminScreen = () => <Box p={8} bg="gray.200" borderRadius="md" my={4}><Heading>Admin Screen</Heading></Box>;


/* ------------------------------------------------------------------
 * CONSTANTS
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
 * NAVBAR
 * • Desktop ≥ md : פס ניווט רגיל
 * • Mobile < md  : כפתור עגול צף ( Drawer menu )
 * ------------------------------------------------------------------ */
const NavBar: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";

  const drawer = useDisclosure();
  const adminModal = useDisclosure();
  const [phoneInput, setPhoneInput] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const adminSet = useMemo<Set<string>>(
    () => new Set<string>(ADMIN_PHONES),
    []
  );

  const bg = useColorModeValue("whiteAlpha.800", "gray.900");
  const hoverBg = useColorModeValue("brand.100", "accent.700");

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

  if (isAdminPage) {
    return (
      <Box
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
          <Flex
            as="nav"
            h="full"
            align="center"
            justify="center"
            gap={4}
          >
            <Button
              colorScheme="red"
              variant="ghost"
              onClick={() => navigate("/")}
            >
              התנתק
            </Button>
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <>
      {/* -------- Desktop Bar -------- */}
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
                _hover={{ bg: hoverBg, textDecoration: 'none' }}
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

      {/* -------- Mobile Floating Buttons -------- */}
      <VStack
        spacing={3}
        position="fixed"
        bottom="24px"
        right="24px"
        zIndex="1050"
        display={{ base: "flex", md: "none" }}
        alignItems="flex-end"
      >
        {/* Menu Floating Button (Top) */}
        <IconButton
          aria-label="פתיחת תפריט"
          icon={<HamburgerIcon boxSize={6} />}
          colorScheme="brand"
          borderRadius="full"
          boxSize="56px"
          shadow="lg"
          onClick={drawer.onOpen}
        />

        {/* RSVP Floating Button (Bottom) */}
        <Button
          as={ChakraLink}
          href="#rsvp"
          _hover={{ textDecoration: 'none', transform: 'scale(1.05)' }}
          h="56px"
          borderRadius="full"
          px={6}
          colorScheme="teal"
          shadow="lg"
          variant="solid"
        >
          אישור הגעה
        </Button>
      </VStack>

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
                _hover={{ bg: hoverBg, textDecoration: 'none' }}
                onClick={drawer.onClose}
              >
                {l.label}
              </ChakraLink>
            ))}

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

      {/* -------- Modal אימות אדמין -------- */}
      <Modal isOpen={adminModal.isOpen} onClose={adminModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>כניסת אדמין</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="טלפון 10 ספרות"
              dir="ltr"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              focusBorderColor="primary"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={handleAdminLogin}>
              כניסה
            </Button>
            <Button variant="ghost" onClick={adminModal.onClose}>
              ביטול
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
/* ------------------------------------------------------------------
 * Section wrapper – Fade-in
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
  <VStack spacing={2} py={1} align="stretch" as={Container} maxW="3xl">
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
 * App
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
 * App  – עם שכבת רקע קבועה
 * ------------------------------------------------------------------ */
const App: React.FC = () => {
  /* גרדיינט “חוף” בלייט/דארק */
  const gradient = useColorModeValue(
    "linear(to-b, #E0F7FA 0%, #FFFDE7 100%)",
    "linear(to-b, #1A202C 0%, #2D3748 100%)"
  );
  const textClr = useColorModeValue("gray.700", "gray.200");

  return (
    <Router>
      {/* ---------- שכבת רקע קבועה ---------- */}
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100vw"
        h="100vh"
        bgGradient={gradient}
        zIndex={-1}              /* מתחת לכל השכבות */
        pointerEvents="none"     /* שלא ילכוד לחיצות */
      />

      {/* ---------- תוכן האפליקציה ---------- */}
      <Flex direction="column" minH="100vh" color={textClr} dir="rtl">
        <NavBar />

        <Box as="main" flex="1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>

        <Box as="footer" bg="whiteAlpha.600" py={4} textAlign="center">
          <Text fontSize="sm" color="gray.500">
            © 2025 טובת &nbsp;&amp;&nbsp; ירדן
          </Text>
        </Box>
      </Flex>
    </Router>
  );
};

export default App;
