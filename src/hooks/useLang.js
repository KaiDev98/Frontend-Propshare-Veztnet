// src/hooks/useLang.js
// Hook untuk subscribe ke perubahan bahasa secara realtime

import { useState, useEffect, useCallback } from "react";
import { getCurrentLang, setCurrentLang, t as translate } from "../i18n/translations";

export function useLang() {
  const [lang, setLang] = useState(getCurrentLang);

  useEffect(() => {
    const handler = (e) => setLang(e.detail.lang);
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  const changeLang = useCallback((newLang) => {
    setCurrentLang(newLang);
    setLang(newLang);
  }, []);

  // t() wrapper yang auto-re-render saat bahasa berubah
  const t = useCallback((key) => {
    return translate(key);
  }, [lang]); // eslint-disable-line

  return { lang, changeLang, t };
}