"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function DiscussCTA() {
  const t = useTranslations("discussBar");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
        >
          <div className="flex items-center justify-between gap-4 border border-luxury-border bg-luxury-graphite/95 px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <p className="text-sm font-medium text-luxury-ivory">{t("text")}</p>
            <Link
              href="/contact"
              className="shrink-0 bg-luxury-gold px-4 py-2 text-xs font-semibold text-luxury-black no-underline"
            >
              {t("action")}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
