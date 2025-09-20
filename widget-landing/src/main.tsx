import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PrivacyPage from "./Privacy";
import TermsPage from "./Terms";
import DataDeletionPage from "./DataDeletion";
import "./index.css";

// Habilita scroll suave solo en dispositivos capaces
try {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const lowPower = isAndroid || (navigator.hardwareConcurrency || 8) <= 4 || window.devicePixelRatio >= 3;
  if (!lowPower) document.documentElement.classList.add("smooth-scroll");
} catch {}

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isPrivacy = normalizedPath === "/privacy";
const isTerms = normalizedPath === "/terms";
const isDataDeletion = normalizedPath === "/data-deletion";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isPrivacy ? <PrivacyPage /> : isTerms ? <TermsPage /> : isDataDeletion ? <DataDeletionPage /> : <App />}
  </React.StrictMode>
);

// Carga el widget de chat procurando evitar saltos de layout.
const scheduleWidgetLoad = () => {
  let requested = false;
  let fallbackTimer: number | undefined;
  let scrollListener: ((this: Window, ev: Event) => void) | undefined;
  let resizeListener: ((this: Window, ev: UIEvent) => void) | undefined;
  let mutationObserver: MutationObserver | undefined;
  let rafHandle = 0;
  let threshold = computeThreshold();

  const ensureOverrides = () => {
    const styleId = "chat-widget-overrides";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        html, body { margin-bottom: 0 !important; padding-bottom: 0 !important; min-height: 100%; }
        body { overscroll-behavior-y: contain; }
        body > div[data-tenant='lu-core'],
        body > [id^='lu-widget'],
        body > [class*='lu-widget'],
        body > [data-lu-widget] {
          position: fixed !important;
          inset: auto clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px) auto !important;
          margin: 0 !important;
          z-index: 2147483600 !important;
          max-width: min(360px, calc(100vw - 32px)) !important;
          max-height: min(90vh, 640px) !important;
          transform: translate3d(0, 0, 0) !important;
        }
      `;
      document.head.appendChild(style);
    }
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    htmlStyle.setProperty("margin-bottom", "0px", "important");
    htmlStyle.setProperty("padding-bottom", "0px", "important");
    bodyStyle.setProperty("margin-bottom", "0px", "important");
    bodyStyle.setProperty("padding-bottom", "0px", "important");
  };

  const applyWidgetStyles = () => {
    ensureOverrides();
    if (rafHandle) cancelAnimationFrame(rafHandle);
    const preservedScroll = window.scrollY;
    rafHandle = requestAnimationFrame(() => {
      const containers = document.querySelectorAll<HTMLElement>(
        "body > div[data-tenant='lu-core'], body > [id^='lu-widget'], body > [class*='lu-widget'], body > [data-lu-widget]"
      );
      containers.forEach((el) => {
        if (el.tagName === "SCRIPT") return;
        el.style.position = "fixed";
        el.style.left = "auto";
        el.style.top = "auto";
        el.style.right = "clamp(16px, 4vw, 32px)";
        el.style.bottom = "clamp(16px, 4vw, 32px)";
        el.style.margin = "0";
        el.style.maxWidth = "min(360px, calc(100vw - 32px))";
        el.style.maxHeight = "min(90vh, 640px)";
        el.style.transform = "translate3d(0, 0, 0)";
        el.style.zIndex = "2147483600";
      });
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        "iframe[src*='widget-backend-zia'], iframe[data-tenant='lu-core']"
      );
      iframes.forEach((iframe) => {
        iframe.style.position = "relative";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.left = "0";
        iframe.style.top = "0";
        iframe.style.margin = "0";
      });
      window.scrollTo({ top: preservedScroll, left: 0 });
    });
  };

  const loadScript = () => {
    ensureOverrides();

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-tenant='lu-core'][src*='widget-backend-zia.onrender.com']"
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://widget-backend-zia.onrender.com/widget/loader.js";
    script.async = true;
    script.defer = true;
    script.dataset.tenant = "lu-core";
    script.dataset.name = "Lu Core";
    script.dataset.api = "https://widget-backend-zia.onrender.com/v1/chat/stream";
    script.dataset.assets = "https://widget-backend-zia.onrender.com/widget";
    script.addEventListener("load", () => {
      window.setTimeout(applyWidgetStyles, 50);
      window.setTimeout(applyWidgetStyles, 250);
    });
    document.body.appendChild(script);

    if (!mutationObserver) {
      mutationObserver = new MutationObserver(() => applyWidgetStyles());
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
      window.setTimeout(() => {
        mutationObserver?.disconnect();
        mutationObserver = undefined;
      }, 15000);
    }
  };

  const cleanup = () => {
    if (scrollListener) window.removeEventListener("scroll", scrollListener);
    if (resizeListener) window.removeEventListener("resize", resizeListener);
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = undefined;
    }
  };

  const triggerLoad = () => {
    if (requested) return;
    requested = true;
    cleanup();

    const previousScroll = window.scrollY;
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void;
    }).requestIdleCallback;
    const start = () => {
      loadScript();
      applyWidgetStyles();
      requestAnimationFrame(() => {
        window.scrollTo({ top: previousScroll, left: 0 });
        applyWidgetStyles();
      });
    };
    if (typeof idle === "function") {
      idle(start, { timeout: 1000 });
    } else {
      window.setTimeout(start, 0);
    }
  };

  function computeThreshold(): number {
    const hero = document.getElementById("inicio");
    if (!hero) return window.innerHeight * 1.2;
    const rect = hero.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const effectiveHeight = rect.height || hero.offsetHeight || window.innerHeight * 1.8;
    return top + effectiveHeight - window.innerHeight * 0.25;
  }

  const onScroll = () => {
    if (!requested && window.scrollY >= threshold) {
      triggerLoad();
    }
  };

  const onResize = () => {
    threshold = computeThreshold();
    if (!requested) onScroll();
    applyWidgetStyles();
  };

  scrollListener = onScroll;
  resizeListener = onResize;
  window.addEventListener("scroll", scrollListener, { passive: true });
  window.addEventListener("resize", resizeListener, { passive: true });
  fallbackTimer = window.setTimeout(triggerLoad, 15000);

  if (window.scrollY >= threshold) triggerLoad();
};

const ENABLE_WIDGET = false;

if (ENABLE_WIDGET) {
  if (document.readyState === "complete") {
    scheduleWidgetLoad();
  } else {
    const onLoad = () => {
      scheduleWidgetLoad();
      window.removeEventListener("load", onLoad);
    };
    window.addEventListener("load", onLoad);
  }
}
