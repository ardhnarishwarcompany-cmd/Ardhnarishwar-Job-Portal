import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../components_lite/Navbar";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Check, 
  Globe2, 
  MapPin, 
  Zap, 
  Star, 
  Crown, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Search, 
  Coins, 
  ChevronDown, 
  Building2, 
  Users2, 
  PhoneCall, 
  Briefcase,
  Database,
  Flame,
  CalendarCheck,
  UserCheck,
  Bot,
  FileText,
  Mail,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Cpu,
  BadgeCheck,
  ArrowUpRight,
  Shield,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_API_ENDPOINT } from "@/utils/data";

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const existing = document.querySelector('script[data-razorpay-checkout="true"]');
  if (existing) {
    existing.addEventListener("load", () => resolve(true), { once: true });
    existing.addEventListener("error", () => resolve(false), { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  script.dataset.razorpayCheckout = "true";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

// Comprehensive list of world currencies covering all global markets
export const ALL_CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 86.5, country: "India" },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.0, country: "United States" },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, country: "European Union" },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, country: "United Kingdom" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67, country: "United Arab Emirates" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 3.75, country: "Saudi Arabia" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", rate: 1.38, country: "Canada" },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar", rate: 1.53, country: "Australia" },
  { code: "SGD", symbol: "SG$", name: "Singapore Dollar", rate: 1.34, country: "Singapore" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 152.0, country: "Japan" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.24, country: "China" },
  { code: "QAR", symbol: "QR", name: "Qatari Riyal", rate: 3.64, country: "Qatar" },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", rate: 0.31, country: "Kuwait" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", rate: 0.38, country: "Bahrain" },
  { code: "OMR", symbol: "RO", name: "Omani Rial", rate: 0.385, country: "Oman" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.89, country: "Switzerland" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", rate: 1.68, country: "New Zealand" },
  { code: "ZAR", symbol: "R", name: "South African Rand", rate: 18.2, country: "South Africa" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", rate: 4.45, country: "Malaysia" },
  { code: "THB", symbol: "฿", name: "Thai Baht", rate: 34.5, country: "Thailand" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", rate: 15850.0, country: "Indonesia" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", rate: 58.5, country: "Philippines" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", rate: 25400.0, country: "Vietnam" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", rate: 1390.0, country: "South Korea" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", rate: 5.75, country: "Brazil" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso", rate: 20.2, country: "Mexico" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", rate: 10.6, country: "Sweden" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", rate: 11.0, country: "Norway" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", rate: 6.9, country: "Denmark" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", rate: 4.02, country: "Poland" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", rate: 34.8, country: "Turkey" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", rate: 49.2, country: "Egypt" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", rate: 1660.0, country: "Nigeria" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", rate: 278.0, country: "Pakistan" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", rate: 120.0, country: "Bangladesh" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", rate: 294.0, country: "Sri Lanka" },
  { code: "NPR", symbol: "Rs", name: "Nepalese Rupee", rate: 138.5, country: "Nepal" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", rate: 97.0, country: "Russia" },
  { code: "ILS", symbol: "₪", name: "Israeli New Shekel", rate: 3.73, country: "Israel" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", rate: 7.78, country: "Hong Kong" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar", rate: 32.4, country: "Taiwan" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso", rate: 4420.0, country: "Colombia" },
  { code: "CLP", symbol: "CLP$", name: "Chilean Peso", rate: 975.0, country: "Chile" },
  { code: "ARS", symbol: "ARS$", name: "Argentine Peso", rate: 1010.0, country: "Argentina" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 129.0, country: "Kenya" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", rate: 15.5, country: "Ghana" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", rate: 378.0, country: "Hungary" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", rate: 23.6, country: "Czech Republic" },
  { code: "RON", symbol: "lei", name: "Romanian Leu", rate: 4.6, country: "Romania" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham", rate: 9.9, country: "Morocco" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar", rate: 0.71, country: "Jordan" },
  { code: "IQD", symbol: "IQD", name: "Iraqi Dinar", rate: 1310.0, country: "Iraq" }
];

// Vangeance UI / Vanta-inspired 3D Interactive Wave Topology & Particle Constellation
const Vangeance3DBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse tracking with smooth inertia
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 3D Grid Parameters (Wave surface)
    const cols = 28;
    const rows = 18;

    // Floating Celestial particles
    const particleCount = 65;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.25,
        phase: Math.random() * Math.PI * 2,
        colorType: Math.random() > 0.5 ? "indigo" : "pink",
      });
    }

    // Shooting light meteors
    const meteors = [];
    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * width * 1.1 - width * 0.05,
        y: Math.random() * (height * 0.35),
        len: Math.random() * 100 + 60,
        speed: Math.random() * 7 + 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    };
    const meteorInterval = setInterval(() => {
      if (Math.random() > 0.35) spawnMeteor();
    }, 4500);

    let time = 0;

    const render = () => {
      time += 0.018;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const isDark = document.documentElement.classList.contains("dark");

      // 1. Draw subtle ambient gradient aura in light/dark theme
      if (!isDark) {
        // Light Theme: Sophisticated multi-colored ethereal glow
        const g1 = ctx.createRadialGradient(mouseX, mouseY, 10, mouseX, mouseY, 450);
        g1.addColorStop(0, "rgba(224, 231, 255, 0.42)");
        g1.addColorStop(0.5, "rgba(250, 232, 255, 0.22)");
        g1.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Dark Theme: Deep nebula glow
        const g1 = ctx.createRadialGradient(mouseX, mouseY, 10, mouseX, mouseY, 480);
        g1.addColorStop(0, "rgba(99, 102, 241, 0.12)");
        g1.addColorStop(0.6, "rgba(168, 85, 247, 0.06)");
        g1.addColorStop(1, "rgba(8, 13, 26, 0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Compute 3D Mesh Grid Points with Wave Dynamics
      const spacingX = Math.max(50, width / (cols - 2));
      const spacingY = Math.max(45, (height * 0.9) / (rows - 2));
      const grid = [];
      const startX = (width - cols * spacingX) / 2;
      const startY = height * 0.12;

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const baseX = startX + c * spacingX;
          const baseY = startY + r * spacingY;

          // Wave equation: compound spatial sines + mouse proximity ripple
          const distToMouse = Math.hypot(baseX - mouseX, baseY - mouseY);
          const mouseWave = Math.sin(Math.max(0, 320 - distToMouse) * 0.025) * 22;
          
          const waveZ = 
            Math.sin(c * 0.35 + time * 1.2) * 16 +
            Math.cos(r * 0.45 + time * 0.9) * 14 +
            Math.sin((c + r) * 0.25 + time * 1.5) * 10 +
            mouseWave;

          // 3D perspective projection tilt
          const perspective = 600 / (600 + (r * 15) - waveZ);
          const projX = (baseX - width / 2) * perspective + width / 2;
          const projY = (baseY - height * 0.5) * perspective + height * 0.5 + waveZ * 0.8;

          grid[r][c] = { x: projX, y: projY, z: waveZ, intensity: Math.max(0, 1 - distToMouse / 450) };
        }
      }

      // 3. Draw 3D Wave Wireframe Lines (Vangeance Topology)
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];
          if (c === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }

        const depthFade = Math.sin((r / rows) * Math.PI);
        if (isDark) {
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 + depthFade * 0.16})`;
          ctx.lineWidth = 1;
        } else {
          // In Light Theme: Iridescent pastel violet-indigo lines
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 + depthFade * 0.24})`;
          ctx.lineWidth = 1.1;
        }
        ctx.stroke();
      }

      for (let c = 0; c < cols; c += 2) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const pt = grid[r][c];
          if (r === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const depthFade = Math.sin((c / cols) * Math.PI);
        if (isDark) {
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 + depthFade * 0.12})`;
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.09 + depthFade * 0.18})`;
          ctx.lineWidth = 0.9;
        }
        ctx.stroke();
      }

      // 4. Draw Glowing Junction Nodes at Wave Peaks
      for (let r = 1; r < rows - 1; r += 2) {
        for (let c = 1; c < cols - 1; c += 2) {
          const pt = grid[r][c];
          if (pt.z > 8 || pt.intensity > 0.3) {
            const nodeRadius = Math.max(1, (pt.z + 20) * 0.08 + pt.intensity * 2.5);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);

            if (isDark) {
              ctx.fillStyle = pt.intensity > 0.4 ? "rgba(216, 180, 254, 0.9)" : "rgba(167, 139, 250, 0.55)";
              ctx.shadowBlur = nodeRadius * 3;
              ctx.shadowColor = "rgba(168, 85, 247, 0.7)";
            } else {
              // Light theme: Vibrant lavender & violet gem points
              ctx.fillStyle = pt.intensity > 0.4 ? "rgba(99, 102, 241, 0.85)" : "rgba(129, 140, 248, 0.55)";
              ctx.shadowBlur = nodeRadius * 2;
              ctx.shadowColor = "rgba(99, 102, 241, 0.4)";
            }
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // 5. Update & Render Floating Constellation Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.phase += 0.02;
        const pulse = 0.6 + 0.4 * Math.sin(p.phase);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (isDark) {
          ctx.fillStyle = p.colorType === "indigo" 
            ? `rgba(165, 180, 252, ${p.alpha * pulse})` 
            : `rgba(244, 114, 182, ${p.alpha * pulse})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
        } else {
          // In Light Theme: Crisp, visible prismatic jewel dots
          ctx.fillStyle = p.colorType === "indigo" 
            ? `rgba(79, 70, 229, ${p.alpha * pulse * 0.85})` 
            : `rgba(219, 39, 119, ${p.alpha * pulse * 0.85})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(99, 102, 241, 0.35)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Particle connections within mouse radius
        const dMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
        if (dMouse < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          const connectAlpha = (1 - dMouse / 180) * (isDark ? 0.2 : 0.25);
          ctx.strokeStyle = isDark 
            ? `rgba(167, 139, 250, ${connectAlpha})` 
            : `rgba(99, 102, 241, ${connectAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // 6. Shooting Meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.015;

        if (m.opacity <= 0 || m.x > width + 100 || m.y > height + 100) {
          meteors.splice(i, 1);
          continue;
        }

        const tailX = m.x - Math.cos(m.angle) * m.len;
        const tailY = m.y - Math.sin(m.angle) * m.len;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        if (isDark) {
          grad.addColorStop(0, "rgba(168, 85, 247, 0)");
          grad.addColorStop(1, `rgba(255, 255, 255, ${m.opacity * 0.9})`);
        } else {
          // Vibrant in light theme
          grad.addColorStop(0, "rgba(168, 85, 247, 0)");
          grad.addColorStop(1, `rgba(99, 102, 241, ${m.opacity * 0.75})`);
        }

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(meteorInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-1000"
    />
  );
};

// Aceternity UI / Shadcn Style 3D Spotlight Card with Dynamic Cursor Mesh
const AceternityCard = ({ 
  children, 
  className = "", 
  recommended = false, 
  glowColor = "rgba(148, 163, 184, 0.16)", 
  borderColor = "rgba(148, 163, 184, 0.3)"
}) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(springY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-5deg", "5deg"]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
    setMousePos({ x: mouseX, y: mouseY, active: true });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative rounded-3xl transition-all duration-300 transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Typewriter Text Effect Component
const TypewriterText = ({ texts }) => {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    let timeoutId;

    if (!isDeleting && displayText === currentText) {
      timeoutId = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % texts.length);
    } else {
      const speed = isDeleting ? 30 : 60;
      timeoutId = setTimeout(() => {
        setDisplayText((prev) => 
          isDeleting ? prev.slice(0, -1) : currentText.slice(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isDeleting, textIndex, texts]);

  return (
    <span className="inline-block relative">
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="absolute -right-[3px] sm:-right-[6px] top-[10%] bottom-[10%] w-[3px] sm:w-[4px] bg-cyan-400 rounded-full"
      />
      <span className="invisible h-0 block overflow-hidden">
        {texts.reduce((a, b) => a.length > b.length ? a : b)}
      </span>
    </span>
  );
};

const PricingPlans = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  // If a logged-in Candidate accesses this page, redirect them to candidate home
  useEffect(() => {
    if (user && user.role !== "Recruiter" && user.role !== "Admin") {
      toast.info("Pricing plans are only available for employers and recruiters.");
      navigate("/");
    }
  }, [user, navigate]);

  const [region, setRegion] = useState("india");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const dropdownRef = useRef(null);

  // Close currency dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentCurrencyObj = ALL_CURRENCIES.find((c) => c.code === selectedCurrency) || ALL_CURRENCIES[0];

  const handleBuyClick = async (planName, customCycle = "monthly") => {
    if (!user) {
      toast.info("Please login as a recruiter to purchase a plan.");
      navigate("/login");
      return;
    }
    try {
      const loaded = await loadRazorpay();
      if (!loaded) return toast.error("Could not load Razorpay checkout. Please check your internet connection.");
      
      const orderRes = await axios.post(
        `${PAYMENT_API_ENDPOINT}/create-order`,
        { planName, billingCycle: customCycle },
        { withCredentials: true }
      );
      
      if (!orderRes.data?.success) throw new Error(orderRes.data?.message || "Could not create payment order.");
      
      const { keyId, order, plan } = orderRes.data;
      
      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Ardhnarishwar Job Portal",
        description: `${plan.name} Plan`,
        order_id: order.id,
        theme: { color: region === "india" ? "#2563eb" : "#0891b2" },
        handler: async (response) => {
          try {
            const verify = await axios.post(`${PAYMENT_API_ENDPOINT}/verify`, response, { withCredentials: true });
            if (verify.data?.success) toast.success("Payment successful! Your plan is active.");
            else toast.error(verify.data?.message || "Payment verification failed.");
          } catch (err) {
            toast.error(err?.response?.data?.message || "Payment verification failed.");
          }
        },
        modal: { ondismiss: () => toast.info("Payment window closed.") },
      });
      rzp.on("payment.failed", (response) => toast.error(response?.error?.description || "Payment failed."));
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Could not start payment.");
    }
  };

  // Price formatting helper converting any base value to selected currency
  const formatPriceDisplay = (plan) => {
    if (plan.modelType === "custom") {
      return { price: plan.displayFee || "Custom", period: plan.period || "" };
    }
    if (plan.modelType === "contract") {
      return { price: "Contract-based", period: "" };
    }
    if (plan.modelType === "free") {
      return { price: `${currentCurrencyObj.symbol}0`, period: plan.period };
    }
    if (plan.modelType === "inr_fixed") {
      if (currentCurrencyObj.code === "INR") {
        return { 
          price: `₹${Number(plan.inrAmount).toLocaleString("en-IN")}${plan.hasPlus ? "+" : ""}`,
          period: plan.period
        };
      }
      // Convert INR to USD then to target currency
      const inUsd = plan.inrAmount / 86.5;
      const inTarget = inUsd * currentCurrencyObj.rate;
      const rounded = Math.round(inTarget);
      return {
        price: `${currentCurrencyObj.symbol}${rounded.toLocaleString()}${plan.hasPlus ? "+" : ""}`,
        period: plan.period
      };
    }
    if (plan.modelType === "usd_range") {
      if (currentCurrencyObj.code === "USD") {
        return {
          price: `$${plan.minUsd}–$${plan.maxUsd}`,
          period: plan.period
        };
      }
      const minTarget = Math.round(plan.minUsd * currentCurrencyObj.rate);
      const maxTarget = Math.round(plan.maxUsd * currentCurrencyObj.rate);
      return {
        price: `${currentCurrencyObj.symbol}${minTarget.toLocaleString()}–${currentCurrencyObj.symbol}${maxTarget.toLocaleString()}`,
        period: plan.period
      };
    }
    return { price: "Custom", period: plan.period || "" };
  };

  // Section 1: Candidate Database & CV Bank Plans
  const section1Plans = [
    {
      id: "1.1",
      name: "Plan 1.1 — Starter Database Plan",
      shortName: "Starter Database Plan",
      modelType: "inr_fixed",
      inrAmount: 549,
      period: "/ one-time access",
      glowColor: "rgba(99, 102, 241, 0.16)",
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900",
      bestFor: "Individual recruiters, small businesses, and startups.",
      features: [
        "125 candidate database records",
        "125 candidate CVs / resumes",
        "Candidate application data associated with your job postings",
        "2 free job postings",
        "Access to applied-candidate data for the included job postings",
        "Free AI Robotics Interview Platform access for all candidates"
      ],
      desc: "Fast candidate sourcing, complete CV data access, and automated AI interviews."
    },
    {
      id: "1.2",
      name: "Plan 1.2 — Professional Database Plan",
      shortName: "Professional Database Plan",
      modelType: "inr_fixed",
      inrAmount: 2999,
      period: "/ one-time access",
      recommended: true,
      glowColor: "rgba(139, 92, 246, 0.18)",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      bestFor: "Recruitment agencies, HR consultants, and employers with regular hiring requirements.",
      features: [
        "750 candidate database records",
        "750 candidate CVs / resumes",
        "Candidate application data associated with your job postings",
        "5 free job postings",
        "Access to applied-candidate data for the included job postings",
        "Free AI Robotics Interview Platform access for all candidates"
      ],
      desc: "High-volume CV banks, 5 live job postings, and full candidate screening tools."
    }
  ];

  // Section 2: Hot Data, Verified CVs & ROI-Based Candidate Leads
  const section2Plans = [
    {
      id: "2.1",
      name: "Plan 2.1 — Hot Leads Starter",
      shortName: "Hot Leads Starter",
      modelType: "inr_fixed",
      inrAmount: 9999,
      period: "/ 2 months",
      validity: "2 Months",
      glowColor: "rgba(245, 158, 11, 0.25)",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
      bestFor: "Employers with immediate hiring requirements who need additional candidate verification support.",
      features: [
        "100 verified candidate data records with CVs",
        "Up to 100 candidate verification calls conducted by our team",
        "Target interested-candidate ratio: 80%",
        "2 free job postings",
        "Free AI Robotics Interview Platform access for all candidates",
        "Two-month plan validity"
      ],
      desc: "Verified profiles with availability confirmation calls and targeted interest ratio."
    },
    {
      id: "2.2",
      name: "Plan 2.2 — Hot Leads Growth",
      shortName: "Hot Leads Growth",
      modelType: "inr_fixed",
      inrAmount: 25000,
      period: "/ 6 months",
      validity: "6 Months",
      recommended: true,
      glowColor: "rgba(234, 88, 12, 0.28)",
      badgeColor: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
      bestFor: "Recruitment agencies and companies managing multiple vacancies over several months.",
      features: [
        "200 verified candidate data records with CVs",
        "Up to 100 candidate verification calls conducted by our team",
        "Target interested-candidate ratio: 80%",
        "4 free job postings",
        "Free AI Robotics Interview Platform access for all candidates",
        "Six-month plan validity"
      ],
      desc: "Extended 6-month verification support, 4 job postings, and high-volume screened leads."
    }
  ];

  // Section 3: Monthly ROI-Based Recruitment Plan
  const section3Plan = {
    id: "3.1",
    name: "Plan 3.1 — Complete Hiring & HR Support",
    shortName: "Complete Hiring & HR Support",
    modelType: "inr_fixed",
    inrAmount: 2500,
    period: "per candidate / month",
    glowColor: "rgba(16, 185, 129, 0.25)",
    bestFor: "Employers requiring continuous recruitment support and HR technology.",
    desc: "A technology-enabled recruitment solution combining candidate sourcing, HR assistance, and workforce management tools.",
    features: [
      "Monthly recruitment service for each enrolled candidate",
      "Free AI Robotics Interview Platform access",
      "1 free job posting",
      "Verified candidate data and CVs, subject to agreed hiring requirements",
      "1 HR professional assigned by Recruweb Resources Pvt. Ltd.",
      "Free Smart Attendance System access",
      "Replacement support for up to 11 months, subject to contractual terms",
      "11-month service commitment and signed agreement"
    ],
    terms: [
      "Pricing is ₹2,500 per candidate per month.",
      "Candidate salary and statutory employment costs must be clarified separately in the agreement.",
      "The agreement must define HR responsibilities, billing dates, replacement eligibility, and service scope.",
      "Eleven-month replacement support is subject to the agreed conditions and does not override the signed agreement."
    ]
  };

  // Section 4: Complete Recruitment Services — One-Time Recruitment Fee
  const section4Plans = [
    {
      id: "4.1",
      name: "Plan 4.1 — Premium Recruitment Plan",
      shortName: "Premium Recruitment Plan",
      modelType: "custom",
      displayFee: "1 Month Salary",
      period: "of selected candidate's salary",
      glowColor: "rgba(168, 85, 247, 0.28)",
      recommended: true,
      bestFor: "Companies looking for comprehensive recruitment support with an extended replacement period.",
      features: [
        "Recruitment handled by our team",
        "Target vacancy closure timeline: 7–15 days",
        "Free AI Robotics Interview Platform access",
        "Candidate sourcing and CV screening according to the job description",
        "Target of sharing up to 95% relevant candidate profiles from the agreed sourcing pool, subject to candidate availability and screening criteria",
        "3-month replacement support"
      ]
    },
    {
      id: "4.2",
      name: "Plan 4.2 — Standard Recruitment Plan",
      shortName: "Standard Recruitment Plan",
      modelType: "custom",
      displayFee: "20 Days Salary",
      period: "of selected candidate's salary",
      glowColor: "rgba(139, 92, 246, 0.24)",
      bestFor: "Employers looking for a balance between recruitment costs and replacement coverage.",
      features: [
        "Recruitment handled by our team",
        "Target vacancy closure timeline: 7–15 days",
        "Free AI Robotics Interview Platform access",
        "Candidate sourcing and CV screening according to the job description",
        "Target of sharing up to 95% relevant candidate profiles from the agreed sourcing pool, subject to candidate availability and screening criteria",
        "2-month replacement support"
      ]
    },
    {
      id: "4.3",
      name: "Plan 4.3 — Essential Recruitment Plan",
      shortName: "Essential Recruitment Plan",
      modelType: "custom",
      displayFee: "15 Days Salary",
      period: "of selected candidate's salary",
      glowColor: "rgba(99, 102, 241, 0.22)",
      bestFor: "Employers seeking a cost-effective recruitment solution.",
      features: [
        "Recruitment handled by our team",
        "Target vacancy closure timeline: 7–15 days",
        "Free AI Robotics Interview Platform access",
        "Candidate sourcing and CV screening according to the job description",
        "Target of sharing up to 95% relevant candidate profiles from the agreed sourcing pool, subject to candidate availability and screening criteria",
        "1-month replacement support"
      ]
    }
  ];

  // International Employers Services
  const employerOverseas = [
    { 
      name: "International job posting", 
      modelType: "usd_range",
      minUsd: 49,
      maxUsd: 199,
      period: "/job", 
      glowColor: "rgba(59, 130, 246, 0.2)",
      features: [
        "Cross-Border Job Board Distribution", 
        "Targeted Multi-Country Reach", 
        "Candidate Tracking Dashboard", 
        "Standard Global Support"
      ], 
      desc: "Reach qualified international talent across borders." 
    },
    { 
      name: "Featured international job", 
      modelType: "usd_range",
      minUsd: 99,
      maxUsd: 299,
      period: "/job", 
      recommended: true, 
      glowColor: "rgba(6, 182, 212, 0.25)",
      features: [
        "Top Featured Global Placement", 
        "Social Media & Newsletter Spotlight", 
        "3x Higher International Applications", 
        "Priority Screening Pipeline"
      ], 
      desc: "Maximize visibility for critical overseas vacancies." 
    },
    { 
      name: "CV database", 
      modelType: "usd_range",
      minUsd: 199,
      maxUsd: 999,
      period: "/month", 
      cycle: "monthly", 
      glowColor: "rgba(59, 130, 246, 0.2)",
      features: [
        "Direct Access to Global Talent Pool", 
        "Boolean Search & Advanced Skill Filters", 
        "Direct Resume Downloads", 
        "Continuous Database Updates"
      ], 
      desc: "Directly source candidates from our global talent directory." 
    },
    { 
      name: "AI shortlisting", 
      modelType: "usd_range",
      minUsd: 49,
      maxUsd: 299,
      period: "/job", 
      glowColor: "rgba(168, 85, 247, 0.22)",
      features: [
        "Automated AI Candidate Scoring", 
        "Skill & Qualification Gap Analysis", 
        "Fraud Detection & Credential Checks", 
        "Instant Shortlist Reports"
      ], 
      desc: "Screen thousands of global resumes in minutes with AI." 
    },
    { 
      name: "AI interview", 
      modelType: "usd_range",
      minUsd: 5,
      maxUsd: 25,
      period: "/candidate", 
      glowColor: "rgba(6, 182, 212, 0.2)",
      features: [
        "Asynchronous Video Screening", 
        "Automated Behavioral & Technical Evaluation", 
        "Anti-Cheat & Identity Verification", 
        "Comprehensive Evaluation Reports"
      ], 
      desc: "Screen candidates round-the-clock asynchronously." 
    },
    { 
      name: "Recruiter service", 
      modelType: "custom",
      displayFee: "Custom Quote",
      period: "", 
      glowColor: "rgba(168, 85, 247, 0.22)",
      features: [
        "Dedicated International Headhunter", 
        "Pre-Screened & Verified Finalists", 
        "End-to-End Interview Scheduling", 
        "Replacement Guarantee"
      ], 
      desc: "Full-cycle dedicated recruitment for specialized overseas roles." 
    },
    { 
      name: "Bulk recruitment", 
      modelType: "custom",
      displayFee: "Contract Based",
      period: "", 
      glowColor: "rgba(245, 158, 11, 0.22)",
      features: [
        "Mass International Hiring Drives", 
        "Rapid Cross-Border Mobilization", 
        "Customized Assessment Portals", 
        "Dedicated Project Management Team"
      ], 
      desc: "High-volume recruitment campaigns executed with speed." 
    },
    { 
      name: "International staffing", 
      modelType: "contract",
      period: "", 
      glowColor: "rgba(16, 185, 129, 0.22)",
      features: [
        "Employer of Record (EOR) Compliance", 
        "Global Payroll & Tax Administration", 
        "Flexible Short-term & Long-term Contracts", 
        "Cross-Border Legal Protection"
      ], 
      desc: "Hire and deploy international talent with contract flexibility." 
    },
  ];

  const whyChooseUs = [
    {
      title: "Flexible Hiring Plans",
      tag: "MULTI-TIER HIRING",
      stat: "4 Sourcing Models",
      desc: "Database subscriptions, verified candidate leads, monthly HR support, and end-to-end recruitment.",
      icon: Layers,
      gradient: "from-indigo-600 via-indigo-500 to-purple-600",
      accentBorder: "hover:border-indigo-500/80 dark:hover:border-indigo-400/80 hover:shadow-indigo-500/10",
      pillBg: "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80",
      statBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
      features: [
        "Candidate CV banks with advanced Boolean filters",
        "Pay-per-closure or monthly flexible subscription",
        "Scalable for startups, SMEs & large enterprises"
      ]
    },
    {
      title: "AI-Powered Interviews",
      tag: "ROBOTICS AI TECH",
      stat: "24/7 Automation",
      desc: "AI Robotics Interview Platform access for candidates with automated evaluation.",
      icon: Bot,
      gradient: "from-cyan-600 via-blue-600 to-indigo-600",
      accentBorder: "hover:border-cyan-500/80 dark:hover:border-cyan-400/80 hover:shadow-cyan-500/10",
      pillBg: "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/80",
      statBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
      features: [
        "Asynchronous 24/7 video & audio skill evaluation",
        "Automated technical & behavioral scorecard delivery",
        "Anti-cheat identification & identity verification"
      ]
    },
    {
      title: "Verified Candidate Support",
      tag: "TELEPHONIC SCREENING",
      stat: "80% Intent Ratio",
      desc: "Additional candidate verification calls under selected plans to confirm intent and readiness.",
      icon: PhoneCall,
      gradient: "from-amber-500 via-orange-500 to-rose-600",
      accentBorder: "hover:border-amber-500/80 dark:hover:border-amber-400/80 hover:shadow-amber-500/10",
      pillBg: "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80",
      statBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      features: [
        "Direct recruiter telephonic verification calls",
        "Immediate joining availability & salary match confirmed",
        "Pre-qualified shortlist delivery with verified CVs"
      ]
    },
    {
      title: "Technology-Enabled HR",
      tag: "SMART WORKFORCE",
      stat: "Smart Attendance",
      desc: "Smart Attendance System and other modern HR technology services included.",
      icon: CalendarCheck,
      gradient: "from-emerald-600 via-teal-500 to-cyan-600",
      accentBorder: "hover:border-emerald-500/80 dark:hover:border-emerald-400/80 hover:shadow-emerald-500/10",
      pillBg: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
      statBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      features: [
        "Smart Attendance System & geo-fenced logs",
        "Automated shift rosters & leave management",
        "Unified workforce analytics & reporting suite"
      ]
    },
    {
      title: "Recruitment Expertise",
      tag: "HEADHUNTER BACKED",
      stat: "7–15 Days Closure",
      desc: "Candidate sourcing and screening precisely aligned with your unique employer requirements.",
      icon: Briefcase,
      gradient: "from-purple-600 via-violet-600 to-pink-600",
      accentBorder: "hover:border-purple-500/80 dark:hover:border-purple-400/80 hover:shadow-purple-500/10",
      pillBg: "bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80",
      statBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
      features: [
        "Dedicated recruitment specialist assigned to JD",
        "Up to 95% relevant candidate profiles shared",
        "Up to 11-month replacement protection cover"
      ]
    },
    {
      title: "Cost-Effective Solutions",
      tag: "TRANSPARENT ROI",
      stat: "Starting ₹549",
      desc: "Multiple pricing options to suit startups, agencies, and large enterprise hiring budgets.",
      icon: Coins,
      gradient: "from-rose-600 via-pink-600 to-amber-600",
      accentBorder: "hover:border-rose-500/80 dark:hover:border-rose-400/80 hover:shadow-rose-500/10",
      pillBg: "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80",
      statBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
      features: [
        "Transparent pricing with zero hidden commissions",
        "Budget-friendly options for startups & scaleups",
        "Proven ROI and lower cost-per-hire across all roles"
      ]
    }
  ];

  const termsAndConditions = [
    "The vacancy closure timeline starts after receipt of the complete job description, approved salary range, hiring requirements, and necessary approvals.",
    "The 7–15-day timeline depends on candidate availability, market conditions, interview scheduling, and timely client decisions.",
    "If the client delays interview feedback, candidate selection, offer approval, or other required responses, the closure timeline will be extended accordingly.",
    "The client cannot claim a breach of the closure timeline for delays caused by the client's failure to provide timely responses or necessary approvals.",
    "Replacement support is subject to the signed agreement, payment compliance, and the defined replacement policy.",
    "Recruitment fees, GST, payment deadlines, and any advance or token payment must be agreed upon before recruitment begins."
  ];

  const filteredCurrencies = ALL_CURRENCIES.filter((c) => {
    const q = currencySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  });

  const headingPhrases = [
    "end-to-end recruitment.",
    "top verified candidates.",
    "hot data & active CVs.",
    "AI Robotics interviews.",
    "complete HR support."
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:bg-[#080D1A] dark:selection:bg-indigo-900/50 dark:selection:text-indigo-100 transition-colors duration-500 overflow-x-hidden relative">
      <Navbar />

      {/* Vangeance UI 3D Interactive Wave Topology Grid & Celestial Particles Background Canvas */}
      <Vangeance3DBackground />

      {/* Subtle Grid Dot Pattern Background Overlay */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25 dark:opacity-40" />
      </div>
      
      {/* 3D Animated Hero Header Section */}
      <div className="relative w-full overflow-hidden pb-8 sm:pb-12 pt-8 sm:pt-14 lg:pt-20">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 text-center relative z-10">
          

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            
            {/* Animated Pill Eyebrow with Aceternity Conic Border Beam & Shimmer Text */}
            <div className="relative inline-flex items-center gap-2 rounded-full p-[1.5px] mb-2.5 overflow-hidden shadow-sm">
              <motion.span 
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,#6366f1,#d946ef,#06b6d4,#6366f1)] opacity-75"
              />
              <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider relative z-10">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: "5s" }} /> 
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ backgroundSize: "200% auto" }}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent font-black"
                >
                  ARDHNARISHWAR JOB PORTAL
                </motion.span>
              </div>
            </div>

            {/* Animated Small Header Text (Light & Dark Theme Harmonized) */}
            <motion.h1 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ backgroundSize: "200% auto" }}
              className="text-sm sm:text-base md:text-lg font-black tracking-wide bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent"
            >
              Employer Pricing Plans &amp; Recruitment Solutions
            </motion.h1>

            {/* Animated Sub-Brand Tag with Live Shimmer */}
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <span>Powered by</span>
              <motion.span
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ backgroundSize: "200% auto" }}
                className="bg-gradient-to-r from-violet-600 via-pink-600 to-indigo-600 dark:from-violet-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent font-black"
              >
                Ardhnarishwar.
              </motion.span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            {/* Big Animated Main Headline as requested */}
            <h2 className="mt-3 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-tight">
              Scale your workforce with{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                <TypewriterText texts={headingPhrases} />
              </span>
            </h2>

            {/* Intro Paragraph */}
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed px-2">
              Find relevant candidates, access CV databases, connect with verified job seekers, and simplify hiring with our AI Robotics Interview Platform and recruitment services. Choose from flexible plans designed for individual recruiters, recruitment agencies, startups, and businesses of all sizes.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 pb-16 sm:pb-28">
        
        {/* Controls Bar: 3D Region Switcher + Live Multi-Currency Converter */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.15 }}
          className="mb-8 sm:mb-12 flex flex-col items-center gap-3.5 sm:gap-5"
        >
          {/* Main Region Switcher with 3D Depth */}
          <div className="flex w-full max-w-md rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-1.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/80 dark:ring-slate-800">
            <button
              onClick={() => {
                setRegion("india");
                if (selectedCurrency === "USD") setSelectedCurrency("INR");
              }}
              className={`flex flex-1 justify-center items-center gap-1.5 rounded-full px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-black transition-all duration-300 cursor-pointer ${
                region === "india" 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md sm:scale-102" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" /> 
              <span>Domestic &amp; Verified Plans</span>
            </button>
            <button
              onClick={() => {
                setRegion("overseas");
                if (selectedCurrency === "INR") setSelectedCurrency("USD");
              }}
              className={`flex flex-1 justify-center items-center gap-1.5 rounded-full px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-black transition-all duration-300 cursor-pointer ${
                region === "overseas" 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md sm:scale-102" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5 shrink-0" /> 
              <span>International Services</span>
            </button>
          </div>

          {/* Fully Responsive Category Filter Pills (No scroller, responsive wrap) */}
          {region === "india" && (
            <div className="w-full max-w-5xl px-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {[
                  { id: "all", label: "All Pricing Plans", icon: Layers },
                  { id: "1", label: "1. Candidate Database & CV Bank", icon: Database },
                  { id: "2", label: "2. Hot Data & Verified Leads", icon: Flame },
                  { id: "3", label: "3. Monthly ROI Recruitment", icon: CalendarCheck },
                  { id: "4", label: "4. Full Recruitment (One-Time)", icon: Crown }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        if (cat.id !== "all") {
                          const el = document.getElementById(`section-${cat.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-102 ring-2 ring-slate-900 dark:ring-white"
                          : "bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Currency Dropdown Selector */}
          <div className="relative flex items-center justify-center" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="dropdown-chevron-btn flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-md ring-1 ring-slate-200/80 dark:ring-slate-800 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Live Currency:</span>
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 text-[11px] font-black font-mono">
                {currentCurrencyObj.symbol}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                {currentCurrencyObj.code} - {currentCurrencyObj.name}
              </span>
              <ChevronDown 
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isCurrencyDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 z-50 max-h-96 flex flex-col"
                >
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search currency, code or country..."
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCurrencies.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No currency found</div>
                    ) : (
                      filteredCurrencies.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setSelectedCurrency(c.code);
                            setIsCurrencyDropdownOpen(false);
                            setCurrencySearch("");
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors rounded-lg ${
                            selectedCurrency === c.code 
                              ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold" 
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white w-6">{c.symbol}</span>
                            <span>{c.code} - {c.name}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{c.country}</span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* DOMESTIC (INDIA) EMPLOYER PLANS WITH ACETERNITY / SHADCN CARDS */}
        {region === "india" && (
          <div className="space-y-12 sm:space-y-16">
            
            {/* SECTION 1: Candidate Database & CV Bank Plans */}
            {(activeCategory === "all" || activeCategory === "1") && (
              <section id="section-1" className="scroll-mt-24">
                <div className="mb-5 sm:mb-7 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5" /> Category 01
                    </span>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      1. Candidate Database &amp; CV Bank Plans
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
                      Access candidate records, resumes, candidate application data, job postings, and AI-powered interview facilities.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    2 Tier Options Available
                  </span>
                </div>

                <div className="grid gap-5 sm:gap-7 grid-cols-1 md:grid-cols-2">
                  {section1Plans.map((plan) => {
                    const { price, period } = formatPriceDisplay(plan);
                    return (
                      <AceternityCard 
                        key={plan.id}
                        recommended={plan.recommended}
                        glowColor={plan.glowColor}
                        className={`flex flex-col justify-between p-5 sm:p-7 md:p-8 bg-white dark:bg-slate-900 border ${
                          plan.recommended 
                            ? 'border-indigo-600 dark:border-indigo-500 shadow-xl ring-1 ring-indigo-500/20' 
                            : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {plan.recommended && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                            Most Popular Choice
                          </div>
                        )}

                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                                {plan.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal min-h-[32px]">
                                {plan.desc}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 p-2.5 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <Database className="h-5 w-5" />
                            </div>
                          </div>

                          {/* Price Tag with Aceternity Hierarchy */}
                          <div className="mt-4 border-y border-slate-100 dark:border-slate-800 py-3.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Price</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                {price}
                              </span>
                              <span className="text-xs font-bold text-slate-400">{period}</span>
                            </div>
                          </div>

                          {/* Plan Benefits Checklist */}
                          <div className="mt-5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                              Plan Benefits
                            </span>
                            <ul className="space-y-2">
                              {plan.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                  <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/80 p-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <span className="leading-snug">{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Best For Box */}
                          <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200/70 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                              Best For
                            </span>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {plan.bestFor}
                            </p>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-6 pt-1">
                          <button
                            onClick={() => handleBuyClick(plan.name)}
                            className={`w-full rounded-xl px-4 py-3 text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                              plan.recommended
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 active:scale-98"
                                : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-md active:scale-98"
                            }`}
                          >
                            Choose {plan.shortName} <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </AceternityCard>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 2: Hot Data, Verified CVs & ROI-Based Candidate Leads */}
            {(activeCategory === "all" || activeCategory === "2") && (
              <section id="section-2" className="scroll-mt-24">
                <div className="mb-5 sm:mb-7 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 animate-bounce" /> Category 02
                    </span>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      2. Hot Data, Verified CVs & ROI-Based Candidate Leads
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
                      Get candidate profiles and CVs with additional verification support from our team. These plans are designed to help recruiters identify relevant candidates and improve recruitment efficiency.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Verification Calls Included
                  </span>
                </div>

                <div className="grid gap-5 sm:gap-7 grid-cols-1 md:grid-cols-2">
                  {section2Plans.map((plan) => {
                    const { price, period } = formatPriceDisplay(plan);
                    return (
                      <AceternityCard 
                        key={plan.id}
                        recommended={plan.recommended}
                        glowColor={plan.glowColor}
                        className={`flex flex-col justify-between p-5 sm:p-7 md:p-8 bg-white dark:bg-slate-900 border ${
                          plan.recommended 
                            ? 'border-amber-500 dark:border-amber-400 shadow-xl' 
                            : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="absolute top-5 right-5">
                          <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Validity: {plan.validity}
                          </span>
                        </div>

                        <div>
                          <div className="pr-24">
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                              {plan.name}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal min-h-[32px]">
                              {plan.desc}
                            </p>
                          </div>

                          <div className="mt-4 border-y border-slate-100 dark:border-slate-800 py-3.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Price</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                {price}
                              </span>
                              <span className="text-xs font-bold text-slate-400">{period}</span>
                            </div>
                          </div>

                          <div className="mt-5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                              Plan Benefits
                            </span>
                            <ul className="space-y-2">
                              {plan.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                  <div className="rounded-full bg-amber-100 dark:bg-amber-950/80 p-0.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <span className="leading-snug">{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 p-3 border border-amber-200/60 dark:border-amber-800/40">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                              Best For
                            </span>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {plan.bestFor}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 pt-1">
                          <button
                            onClick={() => handleBuyClick(plan.name)}
                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-3 text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
                          >
                            Choose {plan.shortName} <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </AceternityCard>
                    );
                  })}
                </div>

                {/* Footnote callout for verification calls */}
                <div className="mt-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 text-[11px] text-slate-500 dark:text-slate-400 italic">
                  *Verification calls are intended to confirm candidate availability and interest. The 80% interest ratio is a target, not a guarantee, unless a specific service-level commitment is agreed in writing.
                </div>
              </section>
            )}

            {/* SECTION 3: Monthly ROI-Based Recruitment Plan */}
            {(activeCategory === "all" || activeCategory === "3") && (
              <section id="section-3" className="scroll-mt-24">
                <div className="mb-5 sm:mb-7 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5" /> Category 03
                  </span>
                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    3. Monthly ROI-Based Recruitment Plan
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
                    A technology-enabled recruitment solution combining candidate sourcing, HR assistance, and workforce management tools.
                  </p>
                </div>

                <AceternityCard 
                  glowColor={section3Plan.glowColor}
                  className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/70 p-5 sm:p-8 shadow-xl"
                >
                  <div className="grid gap-6 lg:grid-cols-12 items-start">
                    
                    {/* Left details */}
                    <div className="lg:col-span-7">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300 mb-2.5">
                        <Sparkles className="h-3 w-3" /> Complete Sourcing + Dedicated HR Professional
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {section3Plan.name}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        {section3Plan.desc}
                      </p>

                      <div className="mt-5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                          Plan Benefits
                        </span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {section3Plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                              <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 p-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                <Check className="h-3 w-3" />
                              </div>
                              <span className="leading-snug">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-3 border border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                          Best For
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {section3Plan.bestFor}
                        </p>
                      </div>
                    </div>

                    {/* Right side commercial terms & price action */}
                    <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-slate-50 dark:bg-slate-950/80 p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Subscription Rate</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                            {formatPriceDisplay(section3Plan).price}
                          </span>
                          <span className="text-xs font-bold text-slate-500">/ candidate / month</span>
                        </div>

                        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white block mb-2">
                            Commercial Terms
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {section3Plan.terms.map((term, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                <span className="leading-relaxed">{term}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-5 pt-1">
                        <button
                          onClick={() => handleBuyClick(section3Plan.name, "monthly")}
                          className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                        >
                          Enroll in Complete Hiring Plan <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </AceternityCard>
              </section>
            )}

            {/* SECTION 4: Complete Recruitment Services — One-Time Recruitment Fee */}
            {(activeCategory === "all" || activeCategory === "4") && (
              <section id="section-4" className="scroll-mt-24">
                <div className="mb-5 sm:mb-7 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5" /> Category 04
                    </span>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      4. Complete Recruitment Services — One-Time Recruitment Fee
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
                      Let our recruitment team handle candidate sourcing, screening, CV shortlisting, and hiring coordination according to your job description (JD). Choose the recruitment fee structure that suits your hiring budget.
                    </p>
                  </div>
                  <span className="rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-3 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    7–15 Days Closure Timeline
                  </span>
                </div>

                <div className="grid gap-5 sm:gap-7 grid-cols-1 md:grid-cols-3">
                  {section4Plans.map((plan) => (
                    <AceternityCard 
                      key={plan.id}
                      recommended={plan.recommended}
                      glowColor={plan.glowColor}
                      className={`flex flex-col justify-between p-5 sm:p-7 bg-white dark:bg-slate-900 border ${
                        plan.recommended 
                          ? 'border-purple-500 dark:border-purple-400 shadow-xl' 
                          : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                          Comprehensive Coverage
                        </div>
                      )}

                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                          {plan.name}
                        </h3>

                        <div className="mt-3.5 border-y border-slate-100 dark:border-slate-800 py-3">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Recruitment Fee</span>
                          <span className="text-xl sm:text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400 block mt-0.5">
                            {plan.displayFee}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                            {plan.period}
                          </span>
                        </div>

                        <div className="mt-4">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                            Plan Benefits
                          </span>
                          <ul className="space-y-2">
                            {plan.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <div className="rounded-full bg-purple-100 dark:bg-purple-950/80 p-0.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                                  <Check className="h-3 w-3" />
                                </div>
                                <span className="leading-snug">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 p-2.5 border border-purple-200/50 dark:border-purple-800/40">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 block mb-0.5">
                            Best For
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {plan.bestFor}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-1">
                        <button
                          onClick={() => navigate("/more/contact-us")}
                          className={`w-full rounded-xl px-4 py-3 text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                            plan.recommended
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-600/25"
                              : "bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-md"
                          }`}
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Request Consultation / Hire
                        </button>
                      </div>
                    </AceternityCard>
                  ))}
                </div>

                {/* Recruitment Terms & Conditions Accordion Card */}
                <div className="mt-8 rounded-2xl bg-white/90 dark:bg-[#0E1526]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4.5 w-4.5 text-blue-600 dark:text-cyan-400" />
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Recruitment Terms & Conditions
                    </h4>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {termsAndConditions.map((term, idx) => (
                      <li key={idx} className="pl-1">
                        {term}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

          </div>
        )}

        {/* OVERSEAS / INTERNATIONAL EMPLOYER SERVICES */}
        {region === "overseas" && (
          <div>
            <div className="mb-6 sm:mb-10 text-center px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1.5 mb-1.5">
                <Globe2 className="h-3.5 w-3.5" /> Cross-Border & Global Staffing
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                International Employer Services
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                Global recruitment models, cross-border staffing, and AI talent pipelines for overseas employers.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-7 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {employerOverseas.map((plan) => {
                const { price, period } = formatPriceDisplay(plan);
                const isSpecial = plan.modelType === "custom" || plan.modelType === "contract";
                return (
                  <AceternityCard 
                    key={plan.name} 
                    recommended={plan.recommended}
                    glowColor={plan.glowColor}
                    className={`flex flex-col justify-between p-5 sm:p-6 bg-white dark:bg-slate-900 border ${
                      plan.recommended 
                        ? 'border-indigo-600 dark:border-indigo-500 shadow-xl' 
                        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        Recommended
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col">
                      <div className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/60">
                        {isSpecial ? (
                          <Briefcase className="h-5 w-5" />
                        ) : plan.name.includes("interview") ? (
                          <Zap className="h-5 w-5" />
                        ) : plan.name.includes("database") ? (
                          <Users2 className="h-5 w-5" />
                        ) : (
                          <Globe2 className="h-5 w-5" />
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{plan.name}</h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal min-h-[36px]">{plan.desc}</p>
                      
                      <div className="mt-4 flex items-baseline gap-1 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <span className={`font-black tracking-tight text-slate-900 dark:text-white ${isSpecial ? 'text-xl' : 'text-xl sm:text-2xl'}`}>
                          {price}
                        </span>
                        {period && (
                          <span className="text-xs font-bold text-slate-400">{period}</span>
                        )}
                      </div>

                      <ul className="mt-4 space-y-2 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <Check className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 pt-1">
                      {isSpecial ? (
                        <button
                          onClick={() => navigate("/more/contact-us")}
                          className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Request Consultation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyClick(plan.name, plan.cycle || "monthly")}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                            plan.recommended 
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700' 
                              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                          }`}
                        >
                          Get Started <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </AceternityCard>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: Why Choose Ardhnarishwar? With Elevated 3D Bento Grid */}
        <div className="mt-16 sm:mt-24">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 mb-2">
              <Sparkles className="h-3 w-3 text-amber-500" /> Platform Advantages &amp; Core Value
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Why Choose Ardhnarishwar?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Powerful recruitment infrastructure designed to accelerate hiring velocity with guaranteed candidate precision and modern AI tools.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <AceternityCard 
                  key={idx}
                  className={`group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-7 shadow-sm transition-all duration-300 ${item.accentBorder} flex flex-col justify-between`}
                >
                  <div>
                    {/* Top Pill & Stat Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${item.pillBg}`}>
                        <Sparkles className="h-2.5 w-2.5" />
                        {item.tag}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black font-mono tracking-tight ${item.statBg}`}>
                        {item.stat}
                      </span>
                    </div>

                    {/* Illuminated Icon & Title Header */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal mb-4 min-h-[36px]">
                      {item.desc}
                    </p>

                    {/* Key Highlights Checklist */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-2">
                      {item.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0 mt-0.5">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Interactive Indicator */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <span className="text-[11px] font-semibold">Included in Ecosystem</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </AceternityCard>
              );
            })}
          </div>
        </div>

        {/* SECTION 6: Start Hiring with Ardhnarishwar Today Banner */}
        <div className="mt-14 sm:mt-20 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0F172A] to-[#1E1B4B] text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-2xl border border-indigo-500/20">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 text-[10px] font-black text-indigo-300 uppercase tracking-wider mb-3">
              <Sparkles className="h-3 w-3" /> Next Steps
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Start Hiring with Ardhnarishwar Today
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
              Choose your preferred plan and simplify your recruitment process with Recruweb's staffing expertise and recruitment technology.
            </p>

            {/* Official Credentials Grid */}
            <div className="mt-6 grid gap-3.5 sm:grid-cols-3 border-y border-white/10 py-5">
              <div className="flex items-center gap-3">
                <Globe2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Job Portal</p>
                  <p className="text-xs font-bold text-white truncate" title="www.ardhnarishwar-job-portal.recruweb.com">
                    www.ardhnarishwar-job-portal.recruweb.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Email Support</p>
                  <a href="mailto:hr@recruweb.com" className="text-xs font-bold text-white hover:text-indigo-300 underline">
                    hr@recruweb.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Company</p>
                  <p className="text-xs font-bold text-white">
                    Ardhnarishwar.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => navigate("/recruiter/jobs/create")}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black px-5 py-3 text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-98"
              >
                Post a Job Now <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="mailto:hr@recruweb.com"
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-black px-5 py-3 text-xs sm:text-sm transition-all border border-white/20 flex items-center gap-2 active:scale-98"
              >
                <Mail className="h-4 w-4" /> Email Recruitment Team
              </a>
            </div>

            {/* Statutory Terms Footnote */}
            <p className="mt-6 text-[10px] sm:text-[11px] text-slate-400 italic leading-relaxed">
              *All prices are in Indian Rupees (INR). GST, where applicable, is additional. Plan inclusions, data access, validity, and replacement conditions are governed by the selected plan and applicable agreement.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingPlans;
