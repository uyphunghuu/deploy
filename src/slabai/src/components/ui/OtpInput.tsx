"use client";

import { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const cells = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  function update(nextValue: string, index: number) {
    const digits = nextValue.replace(/\D/g, "").slice(0, 6);
    if (digits.length > 1) {
      onChange(digits);
      refs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const next = cells.map((cell, cellIndex) => (cellIndex === index ? digits : cell)).join("");
    onChange(next);
    if (digits && index < 5) refs.current[index + 1]?.focus();
  }

  return (
    <div className="otp-group" role="group" aria-label="Mã xác thực 6 chữ số">
      {cells.map((cell, index) => (
        <input
          aria-label={`Chữ số ${index + 1}`}
          aria-invalid={Boolean(error)}
          className="otp-cell"
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(event) => update(event.target.value, index)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !cell && index > 0) refs.current[index - 1]?.focus();
          }}
          onPaste={(event) => {
            event.preventDefault();
            update(event.clipboardData.getData("text"), index);
          }}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={cell}
        />
      ))}
      {error && <p className="field__error otp-error">{error}</p>}
    </div>
  );
}
