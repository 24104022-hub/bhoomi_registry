// Theme System Configuration
// Defines 6 professional color palettes, all supporting Light and Dark modes.

export const THEMES = [
  {
    id: "government-blue",
    name: "Government Blue",
    description: "Classic authoritative National & State Portal Blue",
    primary: "#1D4ED8",
    primaryDark: "#3B82F6",
    accent: "#60A5FA",
    preview: "#2563EB",
    badge: "Official",
  },
  {
    id: "emerald-green",
    name: "Emerald Green",
    description: "Classic Bhoomi Land Registry Forest Emerald",
    primary: "#059669",
    primaryDark: "#10B981",
    accent: "#34D399",
    preview: "#10B981",
    badge: "Land",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Imperial Sovereign & Legal Authority Indigo Purple",
    primary: "#7C3AED",
    primaryDark: "#A78BFA",
    accent: "#C4B5FD",
    preview: "#8B5CF6",
    badge: "Judicial",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Modern Cadastral GIS & Digital Registry Cyan",
    primary: "#0D9488",
    primaryDark: "#2DD4BF",
    accent: "#5EEAD4",
    preview: "#14B8A6",
    badge: "GIS Tech",
  },
  {
    id: "warm-amber",
    name: "Warm Amber",
    description: "Heritage Deed Parchment & Warm Terracotta Gold",
    primary: "#D97706",
    primaryDark: "#F59E0B",
    accent: "#FCD34D",
    preview: "#F59E0B",
    badge: "Cadastral",
  },
  {
    id: "dark-professional",
    name: "Dark Professional",
    description: "Executive High-Contrast Cyber Obsidian & Steel Slate",
    primary: "#334155",
    primaryDark: "#38BDF8",
    accent: "#38BDF8",
    preview: "#0F172A",
    badge: "Executive",
  },
];

export const VALID_THEME_IDS = THEMES.map((t) => t.id);

export function getThemeMeta(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function normalizeThemeId(rawId) {
  if (!rawId) return "government-blue";
  if (VALID_THEME_IDS.includes(rawId)) return rawId;
  if (rawId === "light") return "government-blue";
  if (rawId === "dark") return "dark-professional";
  return "government-blue";
}
