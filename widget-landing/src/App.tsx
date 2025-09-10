import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";

/* ========= Rendimiento (bajar costos en Android/equipos modestos) ========= */
const isAndroid = /Android/i.test(navigator.userAgent);
const lowPower =
  isAndroid || (navigator.hardwareConcurrency || 8) <= 4 || window.devicePixelRatio >= 3;

/* ========= Colores ========= */
const PURPLE = "#550096";
const GREEN = "#04d9b5";

/* ========= NAV ========= */
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
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-white/10 bg-black/60 ${
        lowPower ? "" : "backdrop-blur"
      } px-2 py-2 ${visible ? "pointer-events-auto" : "pointer-events-none"}
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
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap
                text-sm md:text-[15px] ${
                  isActive ? "bg-[#04d9b5] text-black" : "text-white/85 hover:bg-white/10"
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
function ValueCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="text-xl font-semibold mb-2 text-[#183df2]">{title}</h3>
      <p className="text-white/70">{children}</p>
    </div>
  );
}
function PriceCard({ title, price, children }: { title: string; price?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl p-6 bg-white/5 border border-white/10 ${lowPower ? "" : "backdrop-blur"}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-xl font-semibold text-white/90">{title}</h4>
        {price && <div className="text-[#04d9b5] font-semibold">MXN {price}</div>}
      </div>
      <div className="mt-3 text-white/70">{children}</div>
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
          const eligibles = selected.filter((k) => MODULES.find((x) => x.key === k)?.promoEligible).length;
          const discounted = m.promoEligible && eligibles >= 2;
          const final = discounted ? Math.round(m.price * 0.5) : m.price;
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`text-left rounded-2xl border p-4 transition ${
                on ? "border-[#04d9b5]/70 bg-[#04d9b5]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
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
                      <div className="text-[11px] text-white/50 line-through">MXN {m.price.toLocaleString()}</div>
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
          <div className="text-[#04d9b5] text-sm mb-2">Founder’s Plan: −50% en módulos elegibles</div>
        ) : (
          <div className="text-white/50 text-sm mb-2">Agrega 2+ módulos elegibles para −50%</div>
        )}
        <div className="text-xl font-bold">Total: MXN {total.toLocaleString()}</div>
        <div className="text-xs text-white/50 mt-1">* Precios sin IVA</div>
      </div>
    </div>
  );
}

/* ========= APP (oscuro) ========= */
export default function App() {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll driver
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 20, mass: 0.3 });

  // Escala + blur (smoke). Más blur en equipos capaces.
  const scale = useTransform(smooth, [0, 0.5, 1], lowPower ? [1, 2.0, 2.2] : [1, 3.0, 3.4]);
  const blurVal = useTransform(
    smooth,
    [0, 0.6, 1],
    lowPower ? [12, 18, 24] : [22, 42, 64]
  );
  const blurCss = useTransform(blurVal, (v: number) => `blur(${Math.round(v)}px)`);

  // Crossfade morado → verde (en todos los dispositivos) para asegurar el verde

  // Desvanecer para revelar contenido (fade más tardío)
  const smokeOpacity = useTransform(smooth, [0, 0.6, 0.85], [1, 0.6, 0]);

  // Opacidad para capa verde (fallback sin filtros en lowPower) — completa antes
  const greenOpacity = useTransform(smooth, [0, 0.35], [0, 1]);

  // Mostrar nav tras hero
  const navOpacity = useTransform(smooth, [0.08, 0.12], [0, 1]);
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
  // Levantar la bola hacia arriba mientras se esfuma (efecto hacia el frente)
  const baseY = useTransform(smooth, [0, 1], [0, -80]);
  const yMix = useTransform([y, baseY], ([yy, by]) => yy + by);

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
    <div ref={ref} className="relative min-h-[260vh] bg-black text-white">
      <Nav active={active} visible={navVisible} />

      {/* ===== HERO: bola con hue-rotate ===== */}
      <section id="inicio" className="relative h-[130vh] z-0">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(closest-side, rgba(255,255,255,0.06), transparent 70%), radial-gradient(closest-side, rgba(255,255,255,0.05), transparent 70%)",
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
            className="absolute inset-0 m-auto aspect-square w-[60vmin] rounded-full pointer-events-none"
          >
            {/* Crossfade en todos los dispositivos para garantizar el verde */}
            <>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 55%, ${PURPLE} 0%, rgba(85,0,150,0.55) 32%, rgba(85,0,150,0.18) 58%, transparent 90%)`,
                  mixBlendMode: lowPower ? "normal" : ("screen" as any),
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  opacity: greenOpacity,
                  mixBlendMode: lowPower ? "normal" : ("screen" as any),
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

          <div className="absolute inset-x-0 bottom-10 text-center text-xs tracking-widest uppercase opacity-60">
            Desliza para revelar
          </div>
        </div>
      </section>

      {/* ===== QUIÉNES SOMOS ===== */}
      <Section id="quienes-somos" title="¿Quiénes somos?">
        <p className="text-lg text-white/80 leading-relaxed text-center max-w-3xl mx-auto">
          Somos una empresa mexicana de soluciones de <span className="text-[#04d9b5]">inteligencia artificial</span>,{" "}
          <span className="text-[#04d9b5]">automatización</span> y <span className="text-[#04d9b5]">ciencia de datos</span>.
          Nuestro objetivo: poner tecnología de clase mundial al alcance de negocios reales para que tomen mejores decisiones y escalen sin drama.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
          <ValueCard title="Innovación">Experimentamos, prototipamos y lanzamos soluciones que mueven la aguja.</ValueCard>
          <ValueCard title="Oportunidad al talento nuevo">Nos oponemos a las puertas cerradas. Apostamos por mentes frescas con hambre de crecer.</ValueCard>
          <ValueCard title="Transparencia">Nada de letras chiquitas. Arquitecturas, precios y alcances claros para avanzar parejo.</ValueCard>
        </div>
      </Section>

      {/* ===== PLANES Y PRECIOS ===== */}
      <Section id="planes" title="Nuestros planes y precios">
        <p className="text-lg text-center text-white/80 max-w-3xl mx-auto">
          Planes <span className="text-[#04d9b5]">modulares</span> que se adaptan a tu operación.
          Estamos en <span className="font-semibold text-[#04d9b5]">Founder’s Plan</span>: 50% de descuento comprando 2 o más módulos.
          <br />
          <span className="text-sm text-white/50">* El add-on de WhatsApp (integración y mantenimiento) no entra en la promo.</span>
        </p>

        <PricingConfigurator />

        <h3 className="mt-16 text-2xl font-semibold text-center">Paquetes recomendados</h3>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PriceCard title="Social Boost" price="3,000">Lu Core + Módulo Meta</PriceCard>
          <PriceCard title="e-Commerce" price="3,000">Lu Core + Módulo e-Commerce</PriceCard>
          <PriceCard title="Full Commerce" price="4,500">Lu Core + e-Commerce + Meta</PriceCard>
          <PriceCard title="Omnin" price="5,500">Todos los módulos</PriceCard>
        </div>

        <p className="text-sm text-white/50 mt-8 text-center">* Precios en MXN. No incluyen IVA.</p>

        <h3 className="mt-16 text-2xl font-semibold text-center">Páginas Web + IA</h3>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <PriceCard title="Web + Lu Core" price="5,000 inicial / 1,500 mensual">
            Dominio gratis por 1 año (sujeto a disponibilidad). 1 correo gratis o Gmail a mitad de precio (hasta 5 cuentas).
          </PriceCard>
          <PriceCard title="Web + e-Commerce" price="6,000 inicial / 2,000 mensual">
            Incluye apps de e-Commerce. Mismos beneficios de dominio y correo.
          </PriceCard>
        </div>

        <div className="mt-8 text-sm text-white/60 text-center">
          <span className="font-semibold text-white/80">Nota:</span> integración de WhatsApp Business disponible como add-on.
          Incluye habilitación y mantenimiento mensual. Ideal para notificaciones, pedidos y atención directa.
        </div>
      </Section>

      {/* ===== CONTACTO ===== */}
      <Section id="contacto" title="Contacto">
        <p className="text-lg text-white/80 mb-10 text-center">
          Hablemos. Podemos mostrarte una demo, resolver dudas y armar un plan a tu medida.
          Si lo prefieres, déjanos tus datos y te escribimos en menos de 24 horas.
        </p>
        <form className="grid gap-4 max-w-xl mx-auto text-left">
          <input
            type="text"
            placeholder="Tu nombre"
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#04d9b5]"
          />
          <input
            type="email"
            placeholder="Tu correo"
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#04d9b5]"
          />
          <textarea
            rows={4}
            placeholder="Cuéntanos de tu proyecto"
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#04d9b5]"
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
