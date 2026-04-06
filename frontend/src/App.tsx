import React, { useState, type ReactNode, useEffect } from "react";
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
  chakra,
  ModalContent,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalCloseButton,
  ModalOverlay,
  Icon,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useScroll, useTransform } from "framer-motion";

/* ---------- סקשנים ---------- */
import EventGate from "./components/EventGate";
import QRDonateScreen from "./components/QRDonateScreen";
import PhotoShareScreen from "./components/PhotoShareScreen";
import SinglesCornerScreen from "./components/SinglesCornerScreen";
import AdminScreen from "./components/AdminScreen";
import RSVPScreen from "./components/RSVPScreen";

/* ------------------------------------------------------------------
 * TOKEN HELPERS
 * sessionStorage נקי בסגירת הטאב – מתאים לסשן אדמין זמני.
 * ------------------------------------------------------------------ */
const TOKEN_KEY = "admin_token";

export const getAdminToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY);

const saveAdminToken = (token: string): void =>
  sessionStorage.setItem(TOKEN_KEY, token);

const clearAdminToken = (): void =>
  sessionStorage.removeItem(TOKEN_KEY);

/**
 * בודק אם יש טוקן שמור מסשן קודם (רענון דף).
 * אנחנו לא יכולים לאמת את ה-HMAC בצד הלקוח (אין לנו את ה-secret),
 * אבל אנחנו בודקים שה-timestamp לא עבר 12 שעות.
 * הבדיקה האמיתית תמיד תיעשה בשרת כשה-API ייקרא.
 */
const isTokenLikelyValid = (): boolean => {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const [tsStr] = token.split(".");
    const elapsed = Math.floor(Date.now() / 1000) - parseInt(tsStr, 10);
    return elapsed < 12 * 60 * 60; // 12 שעות
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------
 * CONSTANTS
 * ------------------------------------------------------------------ */
const MotionButton = motion(Button);
const NAV_HEIGHT = "64px";

const navLinks = [
  { label: "הזמנה",    href: "#invite"  },
  { label: "אישור הגעה", href: "#rsvp"    },
  { label: "מתנה",     href: "#donate"  },
  { label: "תמונות",   href: "#photos"  },
  { label: "היכרויות", href: "#singles" },
];

/* ------------------------------------------------------------------
 * NavBar
 * ------------------------------------------------------------------ */
interface NavBarProps {
  setIsAdminLoggedIn: (val: boolean) => void;
}

const NavBar: React.FC<NavBarProps> = ({ setIsAdminLoggedIn }) => {
  const location    = useLocation();
  const isAdminPage = location.pathname === "/admin";

  const drawer     = useDisclosure();
  const adminModal = useDisclosure();
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoading,  setIsLoading]  = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();

  const bg               = useColorModeValue("bg.canvas", "gray.900");
  const hoverBg          = useColorModeValue("brand.100", "accent.700");
  const primaryTextColor = useColorModeValue("brand.600", "brand.200");

  const glassmorphismStyle = {
    bg: useColorModeValue("rgba(255, 255, 255, 0.25)", "rgba(23, 25, 35, 0.3)"),
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderColor: useColorModeValue("rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.1)"),
  };

  const handleAdminLogin = async () => {
    const phone = phoneInput.trim();
    if (!phone) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/users/admin-login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone }),
      });

      if (res.ok) {
        const { token } = await res.json();
        saveAdminToken(token);            // שמירה ב-sessionStorage
        setIsAdminLoggedIn(true);
        setPhoneInput("");
        adminModal.onClose();
        drawer.onClose();
        navigate("/admin");
      } else {
        toast({ title: "מספר לא מורשה", status: "error", duration: 2500 });
      }
    } catch {
      toast({ title: "שגיאת תקשורת", status: "error", duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAdminLoggedIn(false);
    navigate("/");
  };

  /* ── Admin page: only show logout ─────────────────────────── */
  if (isAdminPage) {
    return (
      <Box as="header" bg={bg} position="sticky" top="0" zIndex="1000" boxShadow="sm" h={NAV_HEIGHT} dir="rtl">
        <Container maxW="7xl" h="full">
          <Flex as="nav" h="full" align="center" justify="center" gap={4}>
            <Button colorScheme="red" variant="ghost" onClick={handleLogout}>
              התנתק
            </Button>
          </Flex>
        </Container>
      </Box>
    );
  }

  /* ── Phone input inline (used in both drawer & modal) ──────── */
  const phoneInputField = (
    <VStack w="full" spacing={3}>
      <Input
        w="full"
        placeholder="מספר טלפון (10 ספרות)"
        dir="ltr"
        type="tel"
        value={phoneInput}
        onChange={(e) => setPhoneInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
        focusBorderColor={primaryTextColor}
        sx={{ bg: "rgba(255,255,255,0.1)" }}
      />
      <HStack w="full">
        <Button
          w="50%"
          sx={glassmorphismStyle}
          isLoading={isLoading}
          onClick={handleAdminLogin}
        >
          כניסה
        </Button>
        <Button
          w="50%"
          variant="ghost"
          onClick={() => { setPhoneInput(""); adminModal.onClose(); }}
        >
          ביטול
        </Button>
      </HStack>
    </VStack>
  );

  return (
    <>
      {/* ── Desktop Bar ──────────────────────────────────────── */}
      <Box
        display={{ base: "none", md: "block" }}
        as="header" bg={bg} position="sticky" top="0"
        zIndex="1000" boxShadow="sm" h={NAV_HEIGHT} dir="rtl"
      >
        <Container maxW="7xl" h="full">
          <Flex as="nav" h="full" align="center" justify="center" gap={4}>
            {navLinks.map((l) => (
              <ChakraLink
                key={l.href} href={l.href} px={3} py={2}
                rounded="md" fontWeight="semibold" _hover={{ bg: hoverBg }}
              >
                {l.label}
              </ChakraLink>
            ))}
            <Button variant="ghost" onClick={adminModal.onOpen}>אדמין</Button>
          </Flex>
        </Container>
      </Box>

      {/* ── Mobile Floating Buttons ───────────────────────────── */}
      <VStack
        spacing={3} position="fixed" bottom="24px" right="24px"
        zIndex="1050" display={{ base: "flex", md: "none" }} alignItems="flex-start"
      >
        <IconButton
          aria-label="פתיחת תפריט"
          icon={<HamburgerIcon boxSize={6} color={primaryTextColor} />}
          borderRadius="full" boxSize="56px" shadow="lg"
          onClick={drawer.onOpen} sx={glassmorphismStyle}
        />
        <MotionButton
          as={ChakraLink} href="#rsvp"
          _hover={{ textDecoration: "none", transform: "scale(1.05)" }}
          h="56px" borderRadius="full" px={6} color={primaryTextColor}
          shadow="lg" sx={glassmorphismStyle}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          נבוא?
        </MotionButton>
      </VStack>

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose} size="xs">
        <DrawerOverlay bg="transparent" />
        <DrawerContent dir="rtl" sx={glassmorphismStyle} color={primaryTextColor}>
          <DrawerHeader borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.2)">
            <Button
              variant="ghost" leftIcon={<CloseIcon />} color="currentcolor"
              _hover={{ bg: "rgba(255,255,255,0.1)" }}
              onClick={drawer.onClose}
            >
              סגור
            </Button>
          </DrawerHeader>

          <Box as="nav" pt={6} px={4}>
            <VStack spacing={4}>
              {navLinks.map((l) => (
                <ChakraLink
                  key={l.href} href={l.href} w="full" textAlign="center"
                  py={3} rounded="md" fontWeight="semibold" color={primaryTextColor}
                  _hover={{ bg: "rgba(255,255,255,0.1)" }}
                  onClick={drawer.onClose}
                >
                  {l.label}
                </ChakraLink>
              ))}

              {/* כניסת אדמין בתוך ה-Drawer */}
              {adminModal.isOpen ? (
                phoneInputField
              ) : (
                <Button
                  variant="outline" borderColor={primaryTextColor} w="full"
                  color="currentcolor" _hover={{ bg: "rgba(255,255,255,0.1)" }}
                  onClick={adminModal.onOpen}
                >
                  אדמין
                </Button>
              )}
            </VStack>
          </Box>
        </DrawerContent>
      </Drawer>

      {/* ── Desktop Admin Modal ───────────────────────────────── */}
      <Modal isOpen={adminModal.isOpen} onClose={adminModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>כניסת אדמין</ModalHeader>
          <ModalCloseButton left={3} right="auto" />
          <ModalBody>
            <Input
              placeholder="מספר טלפון (10 ספרות)"
              dir="ltr"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            />
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              colorScheme="brand"
              isLoading={isLoading}
              onClick={handleAdminLogin}
            >
              כניסה
            </Button>
            <Button variant="ghost" onClick={adminModal.onClose}>ביטול</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

/* ------------------------------------------------------------------
 * Section & Home
 * ------------------------------------------------------------------ */
const MotionDiv = motion(chakra.div);

const Section: React.FC<{ id: string; children: ReactNode; [key: string]: any }> = ({
  id, children, ...rest
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

const HandDrawnArrow = (props: any) => (
  <Icon
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3v18" />
    <path d="M19 14l-7 7-7-7" />
  </Icon>
);

const ScrollDownIndicator = () => {
  const color = useColorModeValue("gray.600", "brand.200");
  const { scrollY } = useScroll();
  const scrollOpacity  = useTransform(scrollY, [0, 200],   [1, 0]);
  const singlesOpacity = useTransform(scrollY, [200, 350], [0, 1]);

  return (
    <>
      <MotionDiv
        style={{ opacity: scrollOpacity }}
        position="fixed" bottom="20px" left="15%"
        transform="translateX(-50%)" zIndex={900}
        color={color} pointerEvents="none"
      >
        <MotionDiv animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <VStack spacing={0}>
            <Text fontSize="s" fontWeight="bold" mb={1} fontFamily="heading">גללו</Text>
            <HandDrawnArrow w={8} h={10} />
          </VStack>
        </MotionDiv>
      </MotionDiv>

      <MotionDiv
        as="a" href="#singles"
        style={{ opacity: singlesOpacity }}
        position="fixed" bottom="20px" left="15%"
        transform="translateX(-50%)" zIndex={900}
        color={color} cursor="pointer"
        _hover={{ transform: "translateX(-50%) scale(1.1)" }}
        transition="transform 0.2s"
      >
        <MotionDiv animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <VStack spacing={0}>
            <Text fontSize="s" fontWeight="bold" mb={1} fontFamily="heading" textAlign="center">
              רווקים/ות?
            </Text>
            <HandDrawnArrow w={8} h={10} />
          </VStack>
        </MotionDiv>
      </MotionDiv>
    </>
  );
};

const Home: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(location.hash.replace("#", ""));
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <Container maxW="container.xl" py={{ base: 6, md: 10 }} position="relative">
      <ScrollDownIndicator />
      <Text color="brand.900" fontSize="xs" position="absolute" top={2} right={12}>
        בסייעתא דשמיא!
      </Text>
      <VStack spacing={{ base: 8, md: 16 }} align="stretch">
        <Section id="invite"><EventGate /></Section>
        <Section id="photos"><PhotoShareScreen /></Section>
        <Section id="donate"><QRDonateScreen /></Section>
        <Section id="rsvp">
          <Text textAlign="center" color="gray.400" fontSize="xs" mb={2}>
            זז למטה כי לא פעיל
          </Text>
          <RSVPScreen />
        </Section>
        <Section id="singles"><SinglesCornerScreen /></Section>
      </VStack>
    </Container>
  );
};

/* ------------------------------------------------------------------
 * NotFound
 * ------------------------------------------------------------------ */
const NotFound: React.FC = () => (
  <Flex direction="column" align="center" justify="center" h="60vh" dir="rtl">
    <Heading size="2xl" mb={4}>404 – הדף לא נמצא</Heading>
    <Text fontSize="lg">סליחה, לא מצאנו את מה שחיפשת.</Text>
  </Flex>
);

/* ------------------------------------------------------------------
 * AdminLoginView  (מסך /admin כשאין טוקן תקף)
 * ------------------------------------------------------------------ */
const AdminLoginView: React.FC<{ setIsAdminLoggedIn: (v: boolean) => void }> = ({
  setIsAdminLoggedIn,
}) => {
  const [phone,     setPhone]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/users/admin-login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: trimmed }),
      });

      if (res.ok) {
        const { token } = await res.json();
        saveAdminToken(token);
        setIsAdminLoggedIn(true);
      } else {
        toast({ title: "מספר לא מורשה", status: "error", duration: 2500 });
      }
    } catch {
      toast({ title: "שגיאת תקשורת", status: "error", duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" align="center" justify="center" h="60vh" dir="rtl">
      <VStack
        spacing={4}
        bg={useColorModeValue("white", "gray.800")}
        p={8} rounded="xl" shadow="md" w="full" maxW="sm"
      >
        <Heading size="md">התחברות למערכת הניהול</Heading>
        <Input
          placeholder="מספר טלפון (10 ספרות)"
          dir="ltr"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <Button
          colorScheme="brand"
          w="full"
          isLoading={isLoading}
          onClick={handleLogin}
        >
          כניסה
        </Button>
      </VStack>
    </Flex>
  );
};

/* ------------------------------------------------------------------
 * App
 * ------------------------------------------------------------------ */
const App: React.FC = () => {
  // מאתחל מה-sessionStorage כדי לשרוד רענון דף
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(
    isTokenLikelyValid
  );

  const gradient  = useColorModeValue(
    "linear(to-b, brand.50 0%, accent.50 100%)",
    "linear(to-b, #1AAFB7 0%, #FDB98F 60%, #E8A041 100%)"
  );
  const textClr = useColorModeValue("text.primary", "text.primary");

  return (
    <Router>
      <Box
        position="fixed" top={0} left={0}
        w="100vw" h="100vh"
        bgGradient={gradient}
        zIndex={-1} pointerEvents="none"
      />
      <Flex direction="column" minH="100vh" color={textClr} dir="rtl">
        <NavBar setIsAdminLoggedIn={setIsAdminLoggedIn} />
        <Box as="main" flex="1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/admin"
              element={
                isAdminLoggedIn
                  ? <AdminScreen />
                  : <AdminLoginView setIsAdminLoggedIn={setIsAdminLoggedIn} />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
        <Box as="footer" id="end" bg="bg.canvas" py={4} textAlign="center">
          <Text fontSize="sm" color="text.secondary">
            © 2025 טובת &nbsp;&amp;&nbsp; ירדן
          </Text>
        </Box>
      </Flex>
    </Router>
  );
};

export default App;
