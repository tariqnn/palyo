"use client";

import { useEffect } from "react";
import { translateArabic, type Locale } from "@/lib/i18n";

const translated = new WeakMap<Node, string>();
const attributes = ["aria-label", "placeholder", "title", "alt"] as const;

function localizeElement(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "CODE", "PRE"].includes(parent.tagName)) continue;
    const source = translated.get(node) ?? node.textContent ?? "";
    const next = translateArabic(source);
    if (next !== source) {
      translated.set(node, source);
      node.textContent = next;
    }
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll<HTMLElement>("*")] : [...root.querySelectorAll<HTMLElement>("*")];
  for (const element of elements) {
    for (const attribute of attributes) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      const sourceKey = `data-i18n-${attribute}`;
      const source = element.getAttribute(sourceKey) ?? current;
      const next = translateArabic(source);
      if (next !== source) {
        element.setAttribute(sourceKey, source);
        element.setAttribute(attribute, next);
      }
    }
  }
}

function restoreEnglish(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const source = translated.get(node);
    if (source !== undefined) {
      node.textContent = source;
      translated.delete(node);
    }
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll<HTMLElement>("*")] : [...root.querySelectorAll<HTMLElement>("*")];
  for (const element of elements) {
    for (const attribute of attributes) {
      const sourceKey = `data-i18n-${attribute}`;
      const source = element.getAttribute(sourceKey);
      if (source !== null) {
        element.setAttribute(attribute, source);
        element.removeAttribute(sourceKey);
      }
    }
  }
}

export function LocaleController({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.body.dataset.locale = locale;
    if (locale === "ar") {
      let observer:MutationObserver|undefined;
      let titleObserver:MutationObserver|undefined;
      let timer:ReturnType<typeof setTimeout>|undefined;
      const localizeTitle = () => {
        const current = document.title;
        const titleParts = current.split(" | ");
        const next = titleParts.length > 1 ? `${translateArabic(titleParts[0])} | ${titleParts.slice(1).join(" | ")}` : translateArabic(current);
        if (next !== current) document.title = next;
      };
      const start = () => {
        timer=setTimeout(()=>{
          localizeElement(document.body);
          localizeTitle();
          document.body.dataset.localized = "true";
          observer = new MutationObserver(records => {
            for (const record of records) {
              for (const added of record.addedNodes) {
                if (added.nodeType === Node.TEXT_NODE && added.parentNode) localizeElement(added.parentNode);
                else if (added instanceof Element) localizeElement(added);
              }
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          titleObserver = new MutationObserver(localizeTitle);
          titleObserver.observe(document.head, { childList: true, subtree: true });
        },250);
      };
      start();
      return () => {
        if(timer)clearTimeout(timer);
        observer?.disconnect();
        titleObserver?.disconnect();
      };
    }
    restoreEnglish(document.body);
    document.body.dataset.localized = "true";
  }, [locale]);
  return null;
}
