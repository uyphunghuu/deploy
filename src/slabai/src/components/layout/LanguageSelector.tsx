"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";

export function LanguageSelector() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="lang-menu-wrapper"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
      style={{ position: "relative" }}
    >
      <Button aria-label="Chọn ngôn ngữ" iconOnly type="button" variant="ghost">
        <span style={{ fontSize: "20px", lineHeight: 1 }}>
          {lang === "vi" ? "🇻🇳" : "🇬🇧"}
        </span>
      </Button>
      {showDropdown && (
        <div className="user-dropdown" style={{ minWidth: "140px", position: "absolute", right: 0, top: "100%", zIndex: 100 }}>
          <button
            onClick={() => {
              setLang("vi");
              setShowDropdown(false);
            }}
            className={`user-dropdown__item ${lang === "vi" ? "lang-dropdown__item--active" : ""}`}
            type="button"
            style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "8px" }}
          >
            <span>🇻🇳 Tiếng Việt</span>
            {lang === "vi" && <span>✓</span>}
          </button>
          <button
            onClick={() => {
              setLang("en");
              setShowDropdown(false);
            }}
            className={`user-dropdown__item ${lang === "en" ? "lang-dropdown__item--active" : ""}`}
            type="button"
            style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "8px" }}
          >
            <span>🇬🇧 English</span>
            {lang === "en" && <span>✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
