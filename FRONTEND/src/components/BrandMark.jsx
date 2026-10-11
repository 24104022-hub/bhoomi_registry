import React from "react";

export default function BrandMark({ size = 40 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="#B08A3E" strokeWidth="1.5" />
      <path d="M24 8L38 16V24C38 33 32 39.5 24 41C16 39.5 10 33 10 24V16L24 8Z" fill="#B08A3E" fillOpacity="0.14" stroke="#B08A3E" strokeWidth="1.4" />
      <path d="M16 26L24 15L32 26" stroke="#F6F2E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 26V32H30V26" stroke="#F6F2E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="15" y1="32" x2="33" y2="32" stroke="#F6F2E8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
