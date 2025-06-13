/*  src/App.tsx  */
/* ------------------------------------------------------------------
 *  Wedding SPA – React + Chakra UI + Framer-Motion + React-Router
 *  גרסה מלאה, נקייה משגיאות TypeScript (--strict)
 * ------------------------------------------------------------------*/

import React, { useState, type ReactNode } from "react";
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
  useToast,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  chakra,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons"; //  npm i @chakra-ui/icons
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
const ADMIN_PHONES = ["0547957141", "0505933883"] as const;

const navLinks = [
  { label: "הזמנה", href: "#invite" },
  { label: "אישור הגעה", href: "#rsvp" },
  { label: "מתנה", href: "#donate" },
  { label: "תמונות", href: "#photos" },
  { label: "היכרויות", href: "#singles" },
];

/* --------------------------------------------------------------
 *  NavBar – רספונסיבי + אימות טלפון
 * --------------------------------------------------------------*/
const NavBar: React.FC = () => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const modal = useDisclosure();
  const [phoneInput, setPhoneInput] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue("bg.canvas", "gray.900");
  const hoverBg = useColorModeValue("brand.100", "accent.700");

  const MotionBox = motion(Box);

  /* helper –  Set טיפוסי של מחרוזות */
  const adminSet = React.useMemo<Set<string>>(
    () => new Set<string>(ADMIN_PHONES),
    []
  );

  const handleAdminLogin = () => {
    const phone = phoneInput.trim(); // מנקה רווחים

    if (adminSet.has(phone)) {
      setPhoneInput("");
      modal.onClose();
      navigate("/admin");            // ✅ כניסה מוצלחת
      return;
    }

    toast({                          // ❌ כניסה נדחית
      title: "מספר לא מורשה",
      status: "error",
      duration: 2500,
      isClosable: true,
    });
  };

  return (
    <>
      <Box
        as="header"
        bg={bg}
        position="sticky"
        top="0"
        zIndex="1000"
        boxShadow="sm"
        dir="rtl"
      >
        <Container maxW="7xl" py={{ base: 2, md: 0 }}>
          {/* Top bar */}
          <Flex
            h={NAV_HEIGHT}
            align="center"
            justify={{ base: "space-between", md: "center" }}
          >
            {/* mobile toggle */}
            <IconButton
              display={{ base: "flex", md: "none" }}
              onClick={onToggle}
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              aria-label="פתח תפריט"
              variant="ghost"
              fontSize="xl"
            />

            {/* desktop nav */}
            <HStack
              spacing={4}
              display={{ base: "none", md: "flex" }}
              as="nav"
              aria-label="Primary"
            >
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
              <Button variant="ghost" onClick={modal.onOpen}>
                אדמין
              </Button>
            </HStack>
          </Flex>

          {/* mobile menu */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <MotionBox
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                overflow="hidden"
              >
                <VStack
                  as="nav"
                  w="full"
                  py={4}
                  spacing={3}
                  bg={bg}
                  borderBottomWidth="1px"
                  borderColor="border.subtle"
                >
                  {navLinks.map((l) => (
                    <ChakraLink
                      key={l.href}
                      href={l.href}
                      px={3}
                      py={2}
                      rounded="md"
                      fontWeight="semibold"
                      w="full"
                      textAlign="center"
                      _hover={{ bg: hoverBg }}
                      onClick={onClose}
                    >
                      {l.label}
                    </ChakraLink>
                  ))}
                  <Button
                    w="full"
                    colorScheme="brand"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      modal.onOpen();
                    }}
                  >
                    אדמין
                  </Button>
                </VStack>
              </MotionBox>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>כניסת אדמין</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="טלפון 10 ספרות"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              dir="ltr"
              focusBorderColor="primary"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={handleAdminLogin}>
              כניסה
            </Button>
            <Button variant="ghost" onClick={modal.onClose}>
              ביטול
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

/* --------------------------------------------------------------
 *  Section wrapper (Fade-in)
 * --------------------------------------------------------------*/
interface SectionProps {
  id: string;
  children: ReactNode;
}
const MotionDiv = motion(chakra.div);

const Section: React.FC<SectionProps> = ({ id, children }) => (
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

/* -------------------------------------------------------------- */
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
      <Flex direction="column" minH="100vh" bg={pageBg} color={textClr} dir="rtl">
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
            © 2025 טובת & ירדן
          </Text>
        </Box>
      </Flex>
    </Router>
  );
};

export default App;