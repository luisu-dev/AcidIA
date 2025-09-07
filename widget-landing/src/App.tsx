import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ===== Rendimiento: heurística ligera ===== */
const isAndroid = /Android/i.test(navigator.userAgent);
const lowPower =
  isAndroid || (navigator.hardwareConcurrency || 8) <= 4 || window.devicePixelRatio >= 3;

/* ===== Colores ===== */
const PURPLE = "#550096";
const GREEN = "#04d9b5";

/* ===== NAV ===== */
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
                  isActive ? "bg-[#04d9b5] text-black" : "text-white/80 hover:bg-white/10"
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

/* ===== CONTENIDO (cards reutilizables) ===== */
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

/* ===== APP (dark-only) ===== */
export default function App() {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll driver
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 20, mass: 0.3 });

  // Esfera: escala, blur (muy suave en Android)
  const scale = useTransform(smooth, [0, 0.5, 1], lowPower ? [1, 2.0, 2.2] : [1, 2.8, 3.0]);
  const blurVal = useTransform(smooth, [0, 0.6, 1], lowPower ? [8, 12, 14] : [10, 18, 22]);
  const blurCss = useTransform(blurVal, (v) => `blur(${Math.round(v)}px)`);

  // Cross-fade: morado (inicio) → verde (final)
  const purpleOpacity = useTransform(smooth, [0, 0.55, 1], [1, 0.5, 0]);
  const greenOpacity  = useTransform(smooth, [0, 0.55, 1], [0, 0.5, 1]);

  // Desvanecer conjunto al revelar contenido
  const smokeOpacity = useTransform(smooth, [0, 0.45, 0.6], [1, 0.6, 0]);

  // Mostrar nav tras pasar el hero
  const navOpacity = useTransform(smooth, [0.08, 0.12], [0, 1]);
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    const unsub = navOpacity.on("change", (v) => setNavVisible(v > 0.5));
    return () => unsub();
  }, [navOpacity]);

  // Scroll-spy sencillo
  const [active, setActive] = useState("inicio");
  useEffect(() => {
    const ids = ["inicio", "quienes-somos", "planes", "contacto"];
    const handler = () => {
      const y = window.innerHeight * 0.45;
      let best = { id: "inicio", d: Infinity };
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const d = Math.abs(c - y);
        if (d < best.d) best = { id, d };
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

  return (
    <div ref={ref} className="relative min-h-[240vh] bg-black text-white">
      <Nav active={active} visible={navVisible} />

      {/* ===== HERO: solo la bola + hint ===== */}
      <section id="inicio" className="relative h-[130vh] z-0">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* textura sutil (barata) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(closest-side, rgba(255,255,255,0.06), transparent 70%), radial-gradient(closest-side, rgba(255,255,255,0.05), transparent 70%)",
              backgroundSize: "120px 120px, 240px 240px",
              backgroundPosition: "-20px -20px, 80px 60px",
            }}
          />

          {/* esfera */}
          <motion.div
            style={{ scale, opacity: smokeOpacity }}
            className="absolute inset-0 m-auto aspect-square w-[60vmin] rounded-full pointer-events-none will-change-transform"
          >
            {/* morado */}
            <motion.div
              style={{ opacity: purpleOpacity, filter: blurCss, mixBlendMode: "screen" }}
              className="absolute inset-0 rounded-full"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 55%, ${PURPLE} 0%, rgba(85,0,150,0.7) 36%, rgba(85,0,150,0.25) 62%, transparent 72%)`,
                }}
              />
            </motion.div>

            {/* verde */}
            <motion.div
              style={{ opacity: greenOpacity, filter: blurCss, mixBlendMode: "screen" }}
              className="absolute inset-0 rounded-full"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 55%, ${GREEN} 0%, rgba(4,217,181,0.65) 36%, rgba(4,217,181,0.25) 62%, transparent 72%)`,
                }}
              />
            </motion.div>
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
          <ValueCard title="Oportunidad al talento nuevo">Nos oponemos a puertas cerradas. Apuesta por mentes frescas con hambre de crecer.</ValueCard>
          <ValueCard title="Transparencia">Nada de letras chiquitas. Arquitecturas, precios y alcances claros para avanzar parejo.</ValueCard>
        </div>
      </Section>

      {/* ===== PLANES (resumen corto para la demo) ===== */}
      <Section id="planes" title="Nuestros planes y precios">
        <p className="text-lg text-center text-white/80 max-w-3xl mx-auto">
          Planes <span className="text-[#04d9b5]">modulares</span>. Estamos en <span className="font-semibold text-[#04d9b5]">Founder’s Plan</span>: −50% al combinar 2+ módulos (WhatsApp add-on no aplica).
        </p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PriceCard title="Social Boost" price="3,000">Lu Core + Meta</PriceCard>
          <PriceCard title="e-Commerce"  price="3,000">Lu Core + e-Commerce</PriceCard>
          <PriceCard title="Full Commerce" price="4,500">Lu Core + e-Commerce + Meta</PriceCard>
          <PriceCard title="Omnin"       price="5,500">Todos los módulos</PriceCard>
        </div>
        <p className="text-sm text-white/50 mt-6 text-center">Precios en MXN, sin IVA.</p>
      </Section>

      {/* ===== CONTACTO ===== */}
      <Section id="contacto" title="Contacto">
        <p className="text-lg text-white/80 mb-10 text-center">
          Hablemos. Te mostramos demo, resolvemos dudas y armamos un plan a tu medida. Déjanos tus datos y te escribimos en menos de 24 horas.
        </p>
        <form className="grid gap-4 max-w-xl mx-auto text-left">
          <input type="text" placeholder="Tu nombre" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#04d9b5]" />
          <input type="email" placeholder="Tu correo" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#04d9b5]" />
          <textarea rows={4} placeholder="Cuéntanos de tu proyecto" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#04d9b5]" />
          <button type="submit" className="rounded-xl bg-[#04d9b5] text-black px-6 py-3 font-medium shadow hover:brightness-110 transition">Enviar</button>
        </form>
      </Section>
    </div>
  );
}
