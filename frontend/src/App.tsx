import React, { useState, type ReactNode, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Flex, // <--- נוסף
  HStack,
  VStack,
  IconButton,
  Button,
  Link as ChakraLink,
  Heading,
  Text,
  Container, // <--- נוסף
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
import { motion, AnimatePresence } from "framer-motion";

/* ---------- סקשנים (ללא שינוי) ---------- */
import EventGate from "./components/EventGate";
import RSVPScreen from "./components/RSVPScreen";
import QRDonateScreen from "./components/QRDonateScreen";
import PhotoShareScreen from "./components/PhotoShareScreen";
import SinglesCornerScreen from "./components/SinglesCornerScreen";
import AdminScreen from "./components/AdminScreen";

/* ------------------------------------------------------------------
 * CONSTANTS (ללא שינוי)
 * ------------------------------------------------------------------ */
const MotionButton = motion(Button);
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
 * NavBar (ללא שינוי)
 * ------------------------------------------------------------------ */
const NavBar: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";

  const drawer = useDisclosure();
  const adminModal = useDisclosure();
  const [phoneInput, setPhoneInput] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const [showButton, setShowButton] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      setShowButton(true);
      scrollTimeoutRef.current = setTimeout(() => {
        setShowButton(false);
      }, 1500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const adminSet = useMemo<Set<string>>(
    () => new Set<string>(ADMIN_PHONES),
    []
  );

  const bg = useColorModeValue("bg.canvas", "gray.900");
  const hoverBg = useColorModeValue("brand.100", "accent.700");
  const primaryTextColor = useColorModeValue("brand.600", "brand.200");

  const glassmorphismStyle = {
    bg: useColorModeValue("rgba(255, 255, 255, 0.25)", "rgba(23, 25, 35, 0.3)"),
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderColor: useColorModeValue("rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.1)"),
  };

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
        <Box as="header" bg={bg} position="sticky" top="0" zIndex="1000" boxShadow="sm" h={NAV_HEIGHT} dir="rtl">
            <Container maxW="7xl" h="full">
                <Flex as="nav" h="full" align="center" justify="center" gap={4}>
                    <Button colorScheme="red" variant="ghost" onClick={() => navigate("/")}>התנתק</Button>
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
              <ChakraLink key={l.href} href={l.href} px={3} py={2} rounded="md" fontWeight="semibold" _hover={{ bg: hoverBg }}>
                {l.label}
              </ChakraLink>
            ))}
            <Button variant="ghost" onClick={adminModal.onOpen}>אדמין</Button>
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
        alignItems="flex-start"
      >
        <IconButton
          aria-label="פתיחת תפריט"
          icon={<HamburgerIcon boxSize={6} color={primaryTextColor} />}
          borderRadius="full"
          boxSize="56px"
          shadow="lg"
          onClick={drawer.onOpen}
          sx={glassmorphismStyle}
        />

        <AnimatePresence>
          {showButton && (
            <MotionButton
              as={ChakraLink}
              href="#rsvp"
              _hover={{ textDecoration: 'none', transform: 'scale(1.05)' }}
              h="56px"
              borderRadius="full"
              px={6}
              color={primaryTextColor}
              shadow="lg"
              sx={glassmorphismStyle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              נבוא?
            </MotionButton>
          )}
        </AnimatePresence>
      </VStack>

      {/* -------- Drawer תפריט מובייל -------- */}
      <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose} size="xs">
        <DrawerOverlay bg="transparent" />
        <DrawerContent dir="rtl" sx={glassmorphismStyle} color={primaryTextColor}>
          <DrawerHeader borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.2)">
            <Button
              variant="ghost"
              onClick={drawer.onClose}
              leftIcon={<CloseIcon />}
              color="currentcolor"
              _hover={{ bg: 'rgba(255,255,255,0.1)' }}
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
                color={primaryTextColor}
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                onClick={drawer.onClose}
              >
                {l.label}
              </ChakraLink>
            ))}

            {!adminModal.isOpen ? (
              <Button
                variant="outline"
                borderColor={primaryTextColor}
                w="full"
                onClick={adminModal.onOpen}
                color="currentcolor"
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
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
                  focusBorderColor={primaryTextColor}
                  sx={{
                    '::placeholder': { color: useColorModeValue('gray.500', 'gray.400')},
                     bg: 'rgba(255,255,255,0.1)'
                  }}
                />
                <HStack w="full">
                  <Button w="50%" sx={glassmorphismStyle} onClick={handleAdminLogin}>
                    כניסה
                  </Button>
                  <Button w="50%" variant="ghost" onClick={() => { setPhoneInput(""); adminModal.onClose(); }}>
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
            <Button colorScheme="brand" mr={3} onClick={handleAdminLogin}>כניסה</Button>
            <Button variant="ghost" onClick={adminModal.onClose}>ביטול</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};



/* ------------------------------------------------------------------
 * Section & Home (קוד מעודכן כאן)
 * ------------------------------------------------------------------ */
const MotionDiv = motion(chakra.div);
const Section: React.FC<{ id: string; children: ReactNode; [key: string]: any }> = ({
  id,
  children,
  ...rest // מאפשר העברת props נוספים כמו flex
}) => (
  <Box id={id} scrollMarginTop={NAV_HEIGHT} {...rest}>
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
    // עוטפים את כל התוכן ב-Container כדי לשמור על רוחב מקסימלי וריווח
    <Container maxW="container.xl" py={{ base: 6, md: 10 }}>
        <VStack spacing={{ base: 8, md: 16 }} align="stretch">
            {/* קונטיינר Flex שמכיל את שני הסקשנים הראשונים.
              - `direction`: במובייל (base) הכיוון הוא עמודה, במסכים גדולים (lg) הוא שורה.
              - `gap`: מוסיף רווח בין האלמנטים.
            */}
            <Flex
                direction={{ base: "column", lg: "row" }}
                align="flex-start" // מיישר את הקומפוננטות להתחלה למעלה
            >
                {/* כל אחד מהסקשנים מקבל flex=1 כדי שיתחלקו שווה ברוחב הזמין במסכים גדולים.
                */}
                <Section id="invite" flex={1} w="full">
                    <EventGate />
                </Section>
                <Section id="rsvp" flex={1} w="full">
                    <RSVPScreen />
                </Section>
            </Flex>
            <Flex
                direction={{ base: "column", lg: "row" }}
                gap={{ base: 8, md: 5 }}
                align="flex-start" // מיישר את הקומפוננטות להתחלה למעלה
            >
            {/* שאר הסקשנים ממשיכים להיות אחד מתחת לשני */}
                <Section id="donate" flex={1} w="full">
                    <QRDonateScreen />
                </Section>
                <Section id="photos" flex={1} w="full">
                    <PhotoShareScreen />
                </Section>
            </Flex>

            <Section id="singles">
                <SinglesCornerScreen />
            </Section>
        </VStack>
    </Container>
);

/* ------------------------------------------------------------------
* NotFound (ללא שינוי)
* ------------------------------------------------------------------ */
const NotFound: React.FC = () => (
    <Flex direction="column" align="center" justify="center" h="60vh" dir="rtl">
        <Heading size="2xl" mb={4}>404 – הדף לא נמצא</Heading>
        <Text fontSize="lg">סליחה, לא מצאנו את מה שחיפשת.</Text>
    </Flex>
);

/* ------------------------------------------------------------------
 * App (ללא שינוי)
 * ------------------------------------------------------------------ */
const App: React.FC = () => {
  const gradient = useColorModeValue(
    "linear(to-b, brand.50 0%, accent.50 100%)",
    "linear(to-b, #1AAFB7 0%, #FDB98F 60%, #E8A041 100%)"
  );
  const textClr = useColorModeValue("text.primary", "text.primary");

  return (
    <Router>
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100vw"
        h="100vh"
        bgGradient={gradient}
        zIndex={-1}
        pointerEvents="none"
      />
      <Flex direction="column" minH="100vh" color={textClr} dir="rtl">
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