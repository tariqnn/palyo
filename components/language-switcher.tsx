"use client";

import { Languages } from "lucide-react";
import { localeCookie, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const next: Locale = locale === "ar" ? "en" : "ar";
  const label = locale === "ar" ? "English" : "العربية";
  const accessible = locale === "ar" ? "Switch language to English" : "تغيير اللغة إلى العربية";
  return <button className="language-switcher" type="button" aria-label={accessible} onClick={() => {
    document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    window.location.reload();
  }}><Languages size={17} aria-hidden="true"/><span>{label}</span></button>;
}
