import React from "react";

const PATHS = {
  grid: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  home: "M4 11.5L12 4l8 7.5M6 10v9h5v-5h2v5h5v-9",
  map: "M9 4l6 2 6-2v14l-6 2-6-2-6 2V6l6-2zm0 0v14m6-12v14",
  "file-plus": "M6 3h8l5 5v13H6V3zm7 0v5h5M9 14h6M12 11v6",
  swap: "M4 8h13l-3-3m3 3l-3 3M20 16H7l3 3m-3-3l3-3",
  doc: "M6 3h8l5 5v13H6V3zm2 8h8m-8 4h8m-8-8h4",
  wallet: "M3 7h15a3 3 0 013 3v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0a2 2 0 012-2h11M16 13h.01",
  calendar: "M4 5h16v16H4V5zm0 5h16M8 3v4M16 3v4",
  bell: "M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zm4 10a2 2 0 004 0",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zm8-3a8 8 0 00-.2-1.7l2-1.6-2-3.4-2.4 1a8 8 0 00-2.9-1.7L14 2h-4l-.5 2.6a8 8 0 00-2.9 1.7l-2.4-1-2 3.4 2 1.6A8 8 0 004 12c0 .6.1 1.1.2 1.7l-2 1.6 2 3.4 2.4-1c.9.7 1.9 1.3 2.9 1.7L10 22h4l.5-2.6a8 8 0 002.9-1.7l2.4 1 2-3.4-2-1.6c.1-.6.2-1.1.2-1.7z",
  users: "M9 12a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 0112 0M17 8a3 3 0 010 6M21 19.5a5.5 5.5 0 00-4.5-4.4",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  award: "M12 15l-3.5 3.5 1-4.8-3.5-3.5 4.8-.7L12 5l1.2 4.5 4.8.7-3.5 3.5 1 4.8z",
  building: "M3 21h18M5 21V7l8-4v18M13 7h6v14M8 11h2M8 15h2M16 11h2M16 15h2",
  compass: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm4.24-14.24l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  briefcase: "M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z",
  "file-text": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  "alert-circle": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-14v4m0 4h.01",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-14v6l4 2",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
};

export default function Icon({ name, size = 18, className = "" }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
