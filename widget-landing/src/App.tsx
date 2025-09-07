import { useRef, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ================== Rendimiento: detectar equipos modestos ================== */
const isAndroid = /Android/i.test(navigator.userAgent);
const lowPower =
  isAndroid || (navigator.hardwareConcurrency || 8) <= 4 || window.devicePixelRatio >= 3;

/* ================== Colores de marca ================== */
const PURPLE = "#550096"; // morado
const GREEN = "#04d9b5"; // turquesa

/* ================== Tema: dark/light auto (+ override por query) ================== */
function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const qp = new URLSearchParams(window.location.search).get("theme");
    if (qp === "dark" || qp === "light") return qp;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const qp = new URLSearchParams(window.location.search).get("theme");
    if (qp === "dark" || qp === "light") {
      setTheme(qp);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return theme;
}

/* ================== Filtro SVG de textura (humo) ================== */
function SmokeFilterDefs() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden>
      <defs>
        <filter id="smoke-texture" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

/* ================== NAV (aparece tras el hero) ================== */
function Nav({ active, visible }: { active: string; visible: boolean }) {
  const items = [
    { id: "inicio", label: "Inicio" },
    { id: "quienes-somos", label: "Quiénes somos" },
    { id: "planes", label: "Planes" },
    { id: "contacto", label: "Contacto" },
  ];
  return (
    <motion.nav
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
      transition={{ duration: 0.25 }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-white/10 bg-black/55 ${
        lowPower ? "" : "backdrop-blur"
      } px-2 py-2 ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <ul className="flex items-center gap-1">
        {items.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`px-3 py-1.5 rounded-xl text-sm transition ${
                  isActive
                    ? "bg-[#04d9b5] text-black"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

/* ================== CONFIGURADOR DE PRECIOS ================== */
const MODULES = [
  { key: "core", name: "Lu Core", price: 2000, promoEligible: true, desc: "Burbuja web + IA 24/7" },
  { key: "meta", name: "Módulo Meta", price: 1000, promoEligible: true, desc: "Facebook, Messenger, Instagram (comentarios y DM)" },
  { key: "ecom", name: "Módulo e-Commerce", price: 1500, promoEligible: true, desc: "Catálogo, búsqueda, checkout" },
  { key: "interact", name: "Módulos Interactivos", price: 1000, promoEligible: true, desc: "Pedidos con pago, notificaciones WhatsApp" },
  { key: "wa", name: "Add-on WhatsApp", price: 500, promoEligible: false, desc: "Habilitación + mantenimiento (no entra a promo)" },
];

function PricingConfigurator() {
  const [selected, setSelected] = useState<string[]>(["core"]);
  const toggle = (k: string) =>
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const selectedModules = MODULES.filter((m) => selected.includes(m.key));
  const eligible = selectedModules.filter((m) => m.promoEligible);
  const promo = eligible.length >= 2 ? 0.5 : 0;

  const total = selectedModules.reduce((acc, m) => {
    const discounted =
      m.promoEligible && promo > 0 ? Math.round(m.price * (1 - promo)) : m.price;
    return acc + discounted;
  }, 0);

  return (
    <div className="mt-10 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
        {MODULES.map((m) => {
          const on = selected.includes(m.key);
          const eligibles = selected.filter(
            (k) => MODULES.find((x) => x.key === k)?.promoEligible
          ).length;
          const discounted = m.promoEligible && eligibles >= 2;
          const final = discounted ? Math.round(m.price * 0.5) : m.price;
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`text-left rounded-2xl border p-4 transition ${
                on
                  ? "border-[#04d9b5]/70 bg-[#04d9b5]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-sm text-white/60">{m.desc}</div>
                </div>
                <div className="text-right">
                  {discounted ? (
                    <div className="text-sm text-[#04d9b5]">
                      MXN {final.toLocaleString()}
                      <div className="text-[11px] text-white/50 line-through">
                        MXN {m.price.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div>MXN {m.price.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 h-fit sticky top-24">
        <h4 className="text-lg font-semibold mb-3">Resumen</h4>
        <ul className="text-sm text-white/70 space-y-1 mb-4">
          {selectedModules.map((m) => (
            <li key={m.key}>• {m.name}</li>
          ))}
        </ul>
        {eligible.length >= 2 ? (
          <div className="text-[#04d9b5] text-sm mb-2">
            Founder’s Plan aplicado: −50% en módulos elegibles
          </div>
        ) : (
          <div className="text-white/50 text-sm mb-2">
            Agrega 2+ módulos elegibles para −50%
          </div>
        )}
        <div className="text-xl font-bold">Total: MXN {total.toLocaleString()}</div>
        <div className="text-xs text-white/50 mt-1">* Precios sin IVA</div>
      </div>
    </div>
  );
}

/* ================== APP ================== */
export default function App() {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme(); // "dark" | "light"

  // Blend fijo en "screen" para ambos temas
  const blendMode: "screen" = "screen";
  const animLow = lowPower;

  // Scroll anim del hero
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 20, mass: 0.3 });

  // Tamaño / blur (capado en lowPower)
  const scale = useTransform(smooth, [0, 0.5, 1], animLow ? [1, 2.2, 2.4] : [1, 3, 3.2]);
  const maxBlur = animLow ? 0 : 26;
  const blurVal = useTransform(smooth, [0, 0.6, 1], [0, 18, maxBlur]);
  const blurCss = useTransform(blurVal, (v) => (v <= 0 ? "none" : `blur(${Math.round(v)}px)`));

  // Cross-fade morado/verde que reacciona al tema
  const { purpleOpacity, greenOpacity } = useMemo(() => {
    const purple = useTransform(
      smooth,
      [0, 0.6, 1],
      theme === "dark" ? [1, 0.55, 0] : [0, 0.45, 1]
    );
    const green = useTransform(
      smooth,
      [0, 0.6, 1],
      theme === "dark" ? [0, 0.45, 1] : [1, 0.55, 0]
    );
    return { purpleOpacity: purple, greenOpacity: green };
  }, [smooth, theme]);

  // Desvanecer esfera al contenido
  const smokeOpacity = useTransform(smooth, [0, 0.45, 0.6], [1, 0.5, 0]);

  // Navbar visible cuando pasas ~10% del hero
  const navOpacity = useTransform(smooth, [0.08, 0.12], [0, 1]);
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    const unsub = navOpacity.on("change", (v) => setNavVisible(v > 0.5));
    return () => unsub();
  }, [navOpacity]);

  // Parallax desktop (off en touch)
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const touchQ = window.matchMedia("(pointer: coarse)");
    const tabQ = window.matchMedia("(max-width: 1024px)");
    const update = () => {
      setIsTouch(touchQ.matches);
      setIsTablet(tabQ.matches);
    };
    update();
    const onMouse = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      setCoords({
        x: (e.clientX - innerWidth / 2) / (innerWidth / 2),
        y: (e.clientY - innerHeight / 2) / (innerHeight / 2),
      });
    };
    if (!touchQ.matches) window.addEventListener("mousemove", onMouse);
    touchQ.addEventListener("change", update);
    tabQ.addEventListener("change", update);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      touchQ.removeEventListener("change", update);
      tabQ.removeEventListener("change", update);
    };
  }, []);
  const strength = isTouch ? 0 : isTablet ? (animLow ? 6 : 16) : (animLow ? 10 : 32);
  const offsetX = coords.x * strength;
  const offsetY = coords.y * strength;

  // Scroll-spy robusto
  const [active, setActive] = useState("inicio");
  useEffect(() => {
    const ids = ["inicio", "quienes-somos", "planes", "contacto"];
    const handler = () => {
      const targetLine = window.innerHeight * 0.45;
      let best = { id: "inicio", dist: Infinity };
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - targetLine);
        if (dist < best.dist) best = { id, dist };
      }
      setActive(best.id);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  // Fondo base según tema
  const pageBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const mutedText = theme === "dark" ? "text-white/80" : "text-black/70";
  const dimText = theme === "dark" ? "text-white/50" : "text-black/50";
  const cardBg = theme === "dark" ? "bg-white/5" : "bg-black/5";
  const borderCol = theme === "dark" ? "border-white/10" : "border-black/10";

  return (
    <div ref={ref} className={`relative min-h-[260vh] ${pageBg}`}>
      {!animLow && <SmokeFilterDefs />}
      <Nav active={active} visible={navVisible} />

      {/* ====== INICIO / HERO ====== */}
      <section id="inicio" className="relative h-[140vh] z-0">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* textura sutil solo en dark y equipos potentes */}
          {!animLow && theme === "dark" && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(closest-side, rgba(255,255,255,0.06), transparent 70%), radial-gradient(closest-side, rgba(255,255,255,0.05), transparent 70%)",
                backgroundSize: "120px 120px, 240px 240px",
                backgroundPosition: "-20px -20px, 80px 60px",
              }}
            />
          )}

          {/* Esfera (capas morada y verde). En lowPower sin filtros caros */}
          <motion.div
            style={{
              scale,
              opacity: smokeOpacity,
              x: animLow ? 0 : offsetX,
              y: animLow ? 0 : offsetY,
            }}
            className="absolute inset-0 m-auto aspect-square w-[60vmin] rounded-full pointer-events-none will-change-transform"
          >
            {/* Fondo tenue solo en light para que no se pierda sobre blanco */}
            {theme === "light" && <div className="absolute inset-0 rounded-full bg-black/20" />}

            {/* Capa MORADA */}
            <motion.div
              style={{
                opacity: purpleOpacity,
                filter: animLow ? "none" : "blur(22px)",
                mixBlendMode: blendMode,
              }}
              className="absolute inset-0 rounded-full"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 55%, ${PURPLE} 0%, rgba(85,0,150,${
                    theme === "dark" ? 0.7 : 0.85
                  }) 36%, rgba(85,0,150,${
                    theme === "dark" ? 0.25 : 0.4
                  }) 62%, transparent 72%)`,
                }}
              />
            </motion.div>

            {/* Capa VERDE */}
            <motion.div
              style={{
                opacity: greenOpacity,
                filter: animLow ? "none" : blurCss,
                mixBlendMode: blendMode,
              }}
              className="absolute inset-0 rounded-full"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 55%, ${GREEN} 0%, rgba(4,217,181,${
                    theme === "dark" ? 0.65 : 0.9
                  }) 36%, rgba(4,217,181,${
                    theme === "dark" ? 0.25 : 0.4
                  }) 62%, transparent 72%)`,
                }}
              />
            </motion.div>
          </motion.div>

          <div
            className={`absolute inset-x-0 bottom-10 text-center text-xs tracking-widest uppercase ${
              theme === "dark" ? "opacity-60 text-white/90" : "opacity-70 text-black/70"
            }`}
          >
            Desliza para revelar
          </div>
        </div>
      </section>

      {/* ====== QUIÉNES SOMOS ====== */}
      <Section id="quienes-somos" title="¿Quiénes somos?" theme={theme}>
        <p className={`text-lg ${mutedText} leading-relaxed text-center max-w-3xl mx-auto`}>
          Somos una empresa mexicana de soluciones de{" "}
          <span className="text-[#04d9b5]">inteligencia artificial</span>,{" "}
          <span className="text-[#04d9b5]">automatización</span> y{" "}
          <span className="text-[#04d9b5]">ciencia de datos</span>. Nuestro objetivo:
          poner tecnología de clase mundial al alcance de negocios reales para que
          tomen mejores decisiones y escalen sin drama.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
          <ValueCard title="Innovación" theme={theme}>
            Experimentamos, prototipamos y lanzamos soluciones que mueven la aguja.
          </ValueCard>
          <ValueCard title="Oportunidad al talento nuevo" theme={theme}>
            Nos oponemos a las puertas cerradas. Apostamos por mentes frescas con hambre de crecer.
          </ValueCard>
          <ValueCard title="Transparencia" theme={theme}>
            Nada de letras chiquitas. Arquitecturas, precios y alcances claros para avanzar parejo.
          </ValueCard>
        </div>
      </Section>

      {/* ====== PLANES ====== */}
      <Section id="planes" title="Nuestros planes y precios" theme={theme}>
        <p className={`text-lg text-center ${mutedText} max-w-3xl mx-auto`}>
          Planes <span className="text-[#04d9b5]">modulares</span> que se adaptan a tu operación.
          Estamos en <span className="font-semibold text-[#04d9b5]">Founder’s Plan</span>:
          50% de descuento comprando 2 o más módulos.
          <br />
          <span className={`text-sm ${dimText}`}>
            * El add-on de WhatsApp (integración y mantenimiento) no entra en la promo.
          </span>
        </p>

        <PricingConfigurator />

        <h3 className="mt-16 text-2xl font-semibold text-center">Paquetes recomendados</h3>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PriceCard title="Social Boost" price="3,000" theme={theme}>
            Lu Core + Módulo Meta
          </PriceCard>
          <PriceCard title="e-Commerce" price="3,000" theme={theme}>
            Lu Core + Módulo e-Commerce
          </PriceCard>
          <PriceCard title="Full Commerce" price="4,500" theme={theme}>
            Lu Core + e-Commerce + Meta
          </PriceCard>
          <PriceCard title="Omnin" price="5,500" theme={theme}>
            Todos los módulos
          </PriceCard>
        </div>

        <p className={`text-sm ${dimText} mt-8 text-center`}>* Precios en MXN. No incluyen IVA.</p>

        <h3 className="mt-16 text-2xl font-semibold text-center">Páginas Web + IA</h3>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <PriceCard title="Web + Lu Core" price="5,000 inicial / 1,500 mensual" theme={theme}>
            Dominio gratis por 1 año (sujeto a disponibilidad). 1 correo gratis o Gmail a mitad de precio (hasta 5 cuentas).
          </PriceCard>
          <PriceCard title="Web + e-Commerce" price="6,000 inicial / 2,000 mensual" theme={theme}>
            Incluye apps de e-Commerce. Mismos beneficios de dominio y correo.
          </PriceCard>
        </div>

        <NoteWhatsApp theme={theme} />
      </Section>

      {/* ====== CONTACTO ====== */}
      <Section id="contacto" title="Contacto" theme={theme}>
        <p className={`text-lg ${mutedText} mb-10 text-center`}>
          Hablemos. Podemos mostrarte una demo, resolver dudas y armar un plan a tu medida.
          Si lo prefieres, déjanos tus datos y te escribimos en menos de 24 horas.
        </p>
        <form className="grid gap-4 max-w-xl mx-auto text-left">
          <input
            type="text"
            placeholder="Tu nombre"
            className={`px-4 py-3 rounded-xl ${cardBg} border ${borderCol} focus:outline-none focus:ring-2 focus:ring-[#04d9b5]`}
          />
          <input
            type="email"
            placeholder="Tu correo"
            className={`px-4 py-3 rounded-xl ${cardBg} border ${borderCol} focus:outline-none focus:ring-2 focus:ring-[#04d9b5]`}
          />
          <textarea
            rows={4}
            placeholder="Cuéntanos de tu proyecto"
            className={`px-4 py-3 rounded-xl ${cardBg} border ${borderCol} focus:outline-none focus:ring-2 focus:ring-[#04d9b5]`}
          />
          <button
            type="submit"
            className="rounded-xl bg-[#04d9b5] text-black px-6 py-3 font-medium shadow hover:brightness-110 transition"
          >
            Enviar
          </button>
        </form>
      </Section>
    </div>
  );
}

/* ================== UI REUSABLE ================== */
function Section({
  id,
  title,
  children,
  theme,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  theme: "dark" | "light";
}) {
  return (
    <section id={id} className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2
          className={`text-4xl md:text-5xl font-bold mb-6 text-center ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          {title}
        </h2>
        <div>{children}</div>
      </div>
    </section>
  );
}

function ValueCard({
  title,
  children,
  theme,
}: {
  title: string;
  children: ReactNode;
  theme: "dark" | "light";
}) {
  const cardBg = theme === "dark" ? "bg-white/5" : "bg-black/5";
  const borderCol = theme === "dark" ? "border-white/10" : "border-black/10";
  const accentTitle = "text-[#183df2]";
  const textMuted = theme === "dark" ? "text-white/70" : "text-black/70";
  return (
    <div className={`p-6 ${cardBg} rounded-2xl border ${borderCol}`}>
      <h3 className={`text-xl font-semibold mb-2 ${accentTitle}`}>{title}</h3>
      <p className={textMuted}>{children}</p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  children,
  theme,
}: {
  title: string;
  price?: string;
  children: ReactNode;
  theme: "dark" | "light";
}) {
  const cardBg = theme === "dark" ? "bg-white/5" : "bg-black/5";
  const borderCol = theme === "dark" ? "border-white/10" : "border-black/10";
  const titleCol = theme === "dark" ? "text-white/90" : "text-black/90";
  const textCol = theme === "dark" ? "text-white/70" : "text-black/70";
  return (
    <div
      className={`rounded-2xl p-6 ${cardBg} border ${borderCol} ${
        lowPower ? "" : "backdrop-blur"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h4 className={`text-xl font-semibold ${titleCol}`}>{title}</h4>
        {price && <div className="text-[#04d9b5] font-semibold">MXN {price}</div>}
      </div>
      <div className={`mt-3 ${textCol}`}>{children}</div>
    </div>
  );
}

function NoteWhatsApp({ theme }: { theme: "dark" | "light" }) {
  const dimText = theme === "dark" ? "text-white/60" : "text-black/60";
  const strong = theme === "dark" ? "text-white/80" : "text-black/80";
  return (
    <div className={`mt-8 text-sm ${dimText} text-center`}>
      <span className={`font-semibold ${strong}`}>Nota:</span> integración de WhatsApp Business disponible como add-on.
      Incluye habilitación y mantenimiento mensual. Ideal para notificaciones, pedidos y atención directa.
    </div>
  );
}
