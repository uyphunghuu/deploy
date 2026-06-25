"use client";

import React from "react";

interface Segment<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          aria-checked={value === option.value}
          className="segmented__item"
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
