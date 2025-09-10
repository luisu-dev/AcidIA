import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import type { MotionValue } from "framer-motion";

/* ========= Rendimiento (bajar costos en Android/equipos modestos) ========= */
const isAndroid = /Android/i.test(navigator.userAgent);
const lowPower =
  isAndroid || (navigator.hardwareConcurrency || 8) <= 4 || window.devicePixelRatio >= 3;

/* ========= Colores ========= */
const PURPLE = "#550096";
const PINK = "#ff4fd8";
const GREEN = "#04d9b5";
const ORANGE = "#ff8a00"; // opcional

/* ========= NAV ========= */
function Nav({ active, visible, isDark }: { active: string; visible: boolean; isDark: boolean }) {
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
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border ${
        isDark ? "border-white/10 bg-black/60" : "border-black/10 bg-white/80"
      } ${lowPower ? "" : "backdrop-blur"} px-2 py-2 ${visible ? "pointer-events-auto" : "pointer-events-none"}
      max-w-[92vw] overflow-x-auto`}
      style={{ scrollbarWidth: "none" as any }}
    >
      <ul className="flex items-center gap-2">
        {items.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap text-sm md:text-[15px] ${
                  isActive
                    ? "bg-[#04d9b5] text-black"
                    : isDark
                    ? "text-white/85 hover:bg-white/10"
                    : "text-black/85 hover:bg-black/10"
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

/* ========= UI Reutilizable ========= */
function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">{title}</h2>
        <div>{children}</div>
      </div>
    </section>
  );
}
function ValueCard({ title, children, isDark }: { title: string; children: ReactNode; isDark: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
      <h3 className="text-xl font-semibold mb-2 text-[#183df2]">{title}</h3>
      <p className={isDark ? "text-white/70" : "text-black/70"}>{children}</p>
    </div>
  );
}
function PriceCard({ title, price, children, isDark }: { title: string; price?: string; children: ReactNode; isDark: boolean }) {
  return (
    <div className={`rounded-2xl p-6 ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border ${lowPower ? "" : "backdrop-blur"}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h4 className={`text-xl font-semibold ${isDark ? "text-white/90" : "text-black/90"}`}>{title}</h4>
        {price && <div className="text-[#04d9b5] font-semibold">MXN {price}</div>}
      </div>
      <div className={`mt-3 ${isDark ? "text-white/70" : "text-black/70"}`}>{children}</div>
    </div>
  );
}

/* ========= Configurador modular ========= */
const MODULES = [
  { key: "core", name: "Lu Core", price: 2000, promoEligible: true, desc: "Burbuja web + IA 24/7" },
  { key: "meta", name: "Módulo Meta", price: 1000, promoEligible: true, desc: "Facebook, Messenger, Instagram (comentarios y DM)" },
  { key: "ecom", name: "Módulo e-Commerce", price: 1500, promoEligible: true, desc: "Catálogo, búsqueda, checkout" },
  { key: "interact", name: "Módulos Interactivos", price: 1000, promoEligible: true, desc: "Pedidos con pago, notificaciones WhatsApp" },
  { key: "wa", name: "Add-on WhatsApp", price: 500, promoEligible: false, desc: "Habilitación + mantenimiento (no entra promo)" },
];
function PricingConfigurator({ isDark }: { isDark: boolean }) {
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
          const eligibles = selected.filter((k) => MODULES.find((x) => x.key === k)?.promoEligible).length;
          const discounted = m.promoEligible && eligibles >= 2;
          const final = discounted ? Math.round(m.price * 0.5) : m.price;
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`text-left rounded-2xl border p-4 transition ${
                on
                  ? "border-[#04d9b5]/70 bg-[#04d9b5]/10"
                  : isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-black/10 bg-black/5 hover:bg-black/10"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{m.desc}</div>
                </div>
                <div className="text-right">
                  {discounted ? (
                    <div className="text-sm text-[#04d9b5]">
                      MXN {final.toLocaleString()}
                      <div className={`text-[11px] ${isDark ? "text-white/50" : "text-black/50"} line-through`}>MXN {m.price.toLocaleString()}</div>
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

      <div className={`rounded-2xl border p-6 h-fit sticky top-24 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
        <h4 className="text-lg font-semibold mb-3">Resumen</h4>
        <ul className={`text-sm space-y-1 mb-4 ${isDark ? "text-white/70" : "text-black/70"}`}>
          {selectedModules.map((m) => (
            <li key={m.key}>• {m.name}</li>
          ))}
        </ul>
        {eligible.length >= 2 ? (
          <div className="text-[#04d9b5] text-sm mb-2">Founder’s Plan: −50% en módulos elegibles</div>
        ) : (
          <div className={`${isDark ? "text-white/50" : "text-black/50"} text-sm mb-2`}>Agrega 2+ módulos elegibles para −50%</div>
        )}
        <div className="text-xl font-bold">Total: MXN {total.toLocaleString()}</div>
        <div className={`text-xs mt-1 ${isDark ? "text-white/50" : "text-black/50"}`}>* Precios sin IVA</div>
      </div>
    </div>
  );
}

/* ========= APP (oscuro) ========= */
export default function App() {
  const ref = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  // Scroll driver (global) — ya no usado directamente
  // Eliminado para evitar warning TS6133 (noUnusedLocals)
  // Progreso del HERO únicamente
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroSmooth = useSpring(heroProgress, { stiffness: 70, damping: 20, mass: 0.3 });

  // Escala + blur (smoke). Más blur en equipos capaces.
  const scale = useTransform(
    heroSmooth,
    [0, 0.6, 1],
    lowPower ? [1, 2.4, 3.2] : [1, 3.8, 5.0]
  );
  const blurVal = useTransform(
    heroSmooth,
    [0, 0.7, 1],
    lowPower ? [14, 22, 30] : [26, 56, 84]
  );
  const blurCss = useTransform(blurVal, (v: number) => `blur(${Math.round(v)}px)`);

  // Crossfade morado → verde (en todos los dispositivos) para asegurar el verde

  // Desvanecer para revelar contenido (fade más tardío)
  const smokeOpacity = useTransform(heroSmooth, [0, 0.85, 1.0], [1, 0.75, 0]);

  // Modo de color según preferencia del usuario
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const update = () => setIsDark(mq.matches);
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    } catch {}
  }, []);

  // Transición morado → rosa → verde en dark; inversa en light
  const purpleRange = isDark ? [0.0, 0.5, 0.75] : [0.6, 0.85, 1.0];
  const purpleVals  = isDark ? [1,   0.3,  0]    : [0,   0.9,  1];
  const pinkRange   =          [0.35, 0.6, 0.85];
  const pinkVals    =          [0,    1,   0];
  const greenRange  = isDark ? [0.6, 0.85, 1.0]  : [0.0, 0.5, 0.75];
  const greenVals   = isDark ? [0,   0.9,  1]    : [1,   0.3,  0];

  const purpleOpacity = useTransform(heroSmooth, purpleRange, purpleVals);
  const pinkOpacity   = useTransform(heroSmooth, pinkRange, pinkVals);
  const greenOpacity  = useTransform(heroSmooth, greenRange, greenVals);
  // Secuencia final: fade a negro → título → fade out → mostrar contenido
  // Ajuste: que aparezca en el "medio" del HERO
  // Antes iniciaba muy tarde (~0.65). Adelantamos el rango para que
  // el título sea visible alrededor del 50–80% del scroll del HERO.
  const overlayOpacity = useTransform(heroSmooth, [0.42, 0.5, 0.86, 0.94], [0, 1, 1, 0]);
  const titleOpacity   = useTransform(heroSmooth, [0.5, 0.56, 0.8, 0.86],   [0, 1, 1, 0]);
  const titleScale     = useTransform(heroSmooth, [0.5, 0.86],               [0.98, 1.06]);

  // Mostrar nav solo al final del hero
  const navOpacity = useTransform(heroSmooth, [0.98, 1], [0, 1]);
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    const unsub = navOpacity.on("change", (v) => setNavVisible(v > 0.5));
    return () => unsub();
  }, [navOpacity]);

  // Scroll-spy
  const [active, setActive] = useState("inicio");
  useEffect(() => {
    const ids = ["inicio", "quienes-somos", "planes", "contacto"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (sections.length === 0) return;

    // IntersectionObserver es más barato que medir en cada scroll.
    let current = "inicio";
    const io = new IntersectionObserver(
      (entries) => {
        // Elegimos la sección con mayor ratio visible dentro de la banda central
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        const top = visible[0];
        if (top?.target?.id && top.target.id !== current) {
          current = top.target.id;
          setActive(current);
        }
      },
      {
        // Banda central del viewport para decidir la sección activa
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.01, 0.25, 0.5, 0.75, 1],
      }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ===== Interacción: cursor en desktop, acelerómetro en móvil =====
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const x = useSpring(mvX, { stiffness: 120, damping: 20, mass: 0.2 });
  const y = useSpring(mvY, { stiffness: 120, damping: 20, mass: 0.2 });
  // Mantener centrado verticalmente (sin subir al hacer scroll)
  const baseY = useTransform(heroSmooth, [0, 1], [0, 0]) as MotionValue<number>;
  const yMix = useTransform([y, baseY], (vals: number[]) => vals[0] + vals[1]) as MotionValue<number>;

  useEffect(() => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return; // respetar accesibilidad

    let amp = Math.round(Math.min(window.innerWidth, window.innerHeight) * (lowPower ? 0.05 : 0.08));
    amp = Math.min(amp, lowPower ? 48 : 80);
    const updateAmp = () => {
      amp = Math.round(Math.min(window.innerWidth, window.innerHeight) * (lowPower ? 0.05 : 0.08));
      amp = Math.min(amp, lowPower ? 48 : 80);
    };
    window.addEventListener("resize", updateAmp);

    // Cursor (desktop)
    const onPointer = (e: PointerEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / cx));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / cy));
      mvX.set(nx * amp);
      mvY.set(ny * amp);
    };

    // Acelerómetro (móvil)
    const onOrient = (e: DeviceOrientationEvent) => {
      const gamma = (e.gamma ?? 0); // izq-der (-90..90)
      const beta = (e.beta ?? 0); // frente-atrás (-180..180)
      const sens = lowPower ? 28 : 18; // menor divisor = más sensibilidad
      const nx = Math.max(-1, Math.min(1, gamma / sens));
      const ny = Math.max(-1, Math.min(1, beta / sens));
      mvX.set(nx * amp);
      mvY.set(ny * amp);
    };

    // Elegimos input según capacidades
    const isTouch = matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      window.addEventListener("deviceorientation", onOrient);
    } else {
      window.addEventListener("pointermove", onPointer);
    }

    return () => {
      window.removeEventListener("resize", updateAmp);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [mvX, mvY]);

  return (
    <div ref={ref} className={`relative min-h-[260vh] ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      <Nav active={active} visible={navVisible} isDark={isDark} />

      {/* ===== HERO: bola con hue-rotate ===== */}
      <section id="inicio" ref={heroRef as any} className="relative h-[200vh] z-0">
        <div className="sticky top-0 h-screen overflow-hidden z-40">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: isDark
                ? "radial-gradient(closest-side, rgba(255,255,255,0.06), transparent 70%), radial-gradient(closest-side, rgba(255,255,255,0.05), transparent 70%)"
                : "radial-gradient(closest-side, rgba(0,0,0,0.06), transparent 70%), radial-gradient(closest-side, rgba(0,0,0,0.05), transparent 70%)",
              backgroundSize: "120px 120px, 240px 240px",
              backgroundPosition: "-20px -20px, 80px 60px",
            }}
          />
          <motion.div
            // Bola central: se mueve con x/y y escala con scroll.
            style={{
              x,
              y: yMix as any,
              scale,
              opacity: smokeOpacity,
              filter: blurCss,
              willChange: "transform, filter",
            }}
            className="absolute inset-0 m-auto aspect-square w-[60vmin] rounded-full pointer-events-none z-50"
          >
            {/* Crossfade morado → rosa → verde */}
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  opacity: purpleOpacity,
                  mixBlendMode: lowPower ? "normal" : ((isDark ? "screen" : "multiply") as any),
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 50% 55%, ${PURPLE} 0%, rgba(85,0,150,0.55) 32%, rgba(85,0,150,0.18) 58%, transparent 90%)`,
                  }}
                />
              </motion.div>

              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  opacity: pinkOpacity,
                  mixBlendMode: lowPower ? "normal" : ((isDark ? "screen" : "multiply") as any),
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 50% 55%, ${PINK} 0%, rgba(255,79,216,0.55) 32%, rgba(255,79,216,0.18) 58%, transparent 90%)`,
                  }}
                />
              </motion.div>

              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  opacity: greenOpacity,
                  mixBlendMode: lowPower ? "normal" : ((isDark ? "screen" : "multiply") as any),
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 50% 55%, ${GREEN} 0%, rgba(4,217,181,0.55) 32%, rgba(4,217,181,0.18) 58%, transparent 90%)`,
                  }}
                />
              </motion.div>
            </>
          </motion.div>

          {/* Overlay de narrativa (por encima de la bola) */}
          <motion.div
            className="absolute inset-0 pointer-events-none grid place-items-center"
            style={{ backgroundColor: "#000", opacity: overlayOpacity, zIndex: 60 }}
          >
            <motion.h1
              style={{ opacity: titleOpacity, scale: titleScale }}
              className="px-6 text-center text-4xl md:text-6xl font-extrabold tracking-tight w-full"
            >
              <span style={{ color: PINK }}>IA</span>
              <span className="mx-2 text-white">para tu</span>
              <span style={{ color: ORANGE }}>negocio</span>
            </motion.h1>
          </motion.div>

          <div className="absolute inset-x-0 bottom-10 text-center text-xs tracking-widest uppercase opacity-60">
            Desliza para revelar
          </div>
        </div>
      </section>

      {/* (Cortina movida dentro del HERO) */}

      {/* ===== QUIÉNES SOMOS ===== */}
      <Section id="quienes-somos" title="¿Quiénes somos?">
        <p className={`text-lg leading-relaxed text-center max-w-3xl mx-auto ${isDark ? "text-white/80" : "text-black/80"}`}>
          Somos una empresa mexicana de soluciones de <span className="text-[#04d9b5]">inteligencia artificial</span>,{" "}
          <span className="text-[#04d9b5]">automatización</span> y <span className="text-[#04d9b5]">ciencia de datos</span>.
          Nuestro objetivo: poner tecnología de clase mundial al alcance de negocios reales para que tomen mejores decisiones y escalen sin drama.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
          <ValueCard isDark={isDark} title="Innovación">Experimentamos, prototipamos y lanzamos soluciones que mueven la aguja.</ValueCard>
          <ValueCard isDark={isDark} title="Oportunidad al talento nuevo">Nos oponemos a las puertas cerradas. Apostamos por mentes frescas con hambre de crecer.</ValueCard>
          <ValueCard isDark={isDark} title="Transparencia">Nada de letras chiquitas. Arquitecturas, precios y alcances claros para avanzar parejo.</ValueCard>
        </div>
      </Section>

      {/* ===== PLANES Y PRECIOS ===== */}
      <Section id="planes" title="Nuestros planes y precios">
        <p className={`text-lg text-center max-w-3xl mx-auto ${isDark ? "text-white/80" : "text-black/80"}`}>
          Planes <span className="text-[#04d9b5]">modulares</span> que se adaptan a tu operación.
          Estamos en <span className="font-semibold text-[#04d9b5]">Founder’s Plan</span>: 50% de descuento comprando 2 o más módulos.
          <br />
          <span className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>* El add-on de WhatsApp (integración y mantenimiento) no entra en la promo.</span>
        </p>

        <PricingConfigurator isDark={isDark} />

        <h3 className="mt-16 text-2xl font-semibold text-center">Paquetes recomendados</h3>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PriceCard isDark={isDark} title="Social Boost" price="3,000">Lu Core + Módulo Meta</PriceCard>
          <PriceCard isDark={isDark} title="e-Commerce" price="3,000">Lu Core + Módulo e-Commerce</PriceCard>
          <PriceCard isDark={isDark} title="Full Commerce" price="4,500">Lu Core + e-Commerce + Meta</PriceCard>
          <PriceCard isDark={isDark} title="Omnin" price="5,500">Todos los módulos</PriceCard>
        </div>

        <p className={`text-sm mt-8 text-center ${isDark ? "text-white/50" : "text-black/50"}`}>* Precios en MXN. No incluyen IVA.</p>

        <h3 className="mt-16 text-2xl font-semibold text-center">Páginas Web + IA</h3>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <PriceCard isDark={isDark} title="Web + Lu Core" price="5,000 inicial / 1,500 mensual">
            Dominio gratis por 1 año (sujeto a disponibilidad). 1 correo gratis o Gmail a mitad de precio (hasta 5 cuentas).
          </PriceCard>
          <PriceCard isDark={isDark} title="Web + e-Commerce" price="6,000 inicial / 2,000 mensual">
            Incluye apps de e-Commerce. Mismos beneficios de dominio y correo.
          </PriceCard>
        </div>

        <div className={`mt-8 text-sm text-center ${isDark ? "text-white/60" : "text-black/60"}`}>
          <span className={`font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>Nota:</span> integración de WhatsApp Business disponible como add-on.
          Incluye habilitación y mantenimiento mensual. Ideal para notificaciones, pedidos y atención directa.
        </div>
      </Section>

      {/* ===== CONTACTO ===== */}
      <Section id="contacto" title="Contacto">
        <p className={`text-lg mb-10 text-center ${isDark ? "text-white/80" : "text-black/80"}`}>
          Hablemos. Podemos mostrarte una demo, resolver dudas y armar un plan a tu medida.
          Si lo prefieres, déjanos tus datos y te escribimos en menos de 24 horas.
        </p>
        <form className="grid gap-4 max-w-xl mx-auto text-left">
          <input
            type="text"
            placeholder="Tu nombre"
            className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#04d9b5] ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
          />
          <input
            type="email"
            placeholder="Tu correo"
            className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#04d9b5] ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
          />
          <textarea
            rows={4}
            placeholder="Cuéntanos de tu proyecto"
            className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#04d9b5] ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
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
