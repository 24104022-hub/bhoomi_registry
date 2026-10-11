import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { t as translate } from "../i18n/translations.js";
import { api, setToken } from "../services/api.js";
import { THEMES, normalizeThemeId, VALID_THEME_IDS } from "../utils/themeConfig.js";

const AppContext = createContext(null);

const PREFS_KEY = "bhoomi_prefs_v2";
const LEGACY_PREFS_KEY = "bhoomi_prefs_v1";
const SESSION_KEY = "bhoomi_session_v1";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY) || localStorage.getItem(LEGACY_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration from v1 light/dark theme to v2 theme palette + mode
      let theme = parsed.theme;
      let mode = parsed.mode;

      if (theme === "light") {
        theme = "government-blue";
        mode = "light";
      } else if (theme === "dark") {
        theme = "dark-professional";
        mode = "dark";
      } else if (!VALID_THEME_IDS.includes(theme)) {
        theme = "government-blue";
      }

      if (!mode || (mode !== "light" && mode !== "dark")) {
        mode = theme === "dark-professional" ? "dark" : "light";
      }

      return {
        language: parsed.language || "en",
        theme,
        mode,
        fontSize: parsed.fontSize || "medium",
      };
    }
  } catch {
    /* ignore */
  }

  return {
    language: "en",
    theme: "government-blue",
    mode: "light",
    fontSize: "medium",
  };
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

const initialState = {
  user: loadSession(),
  ...loadPrefs(),
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_THEME": {
      const normalized = normalizeThemeId(action.payload);
      return {
        ...state,
        theme: normalized,
        // If switching to Dark Professional and mode was light, default to dark
        mode: normalized === "dark-professional" && state.mode === "light" ? "dark" : state.mode,
      };
    }
    case "SET_MODE":
      return { ...state, mode: action.payload === "dark" ? "dark" : "light" };
    case "TOGGLE_MODE":
      return { ...state, mode: state.mode === "dark" ? "light" : "dark" };
    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.payload };
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.payload] };
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((tst) => tst.id !== action.payload) };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Sync user session to localStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [state.user]);

  // Sync preferences and apply theme tokens to document
  useEffect(() => {
    const prefs = {
      language: state.language,
      theme: state.theme,
      mode: state.mode,
      fontSize: state.fontSize,
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    // Also save legacy format for backward compatibility
    localStorage.setItem(
      LEGACY_PREFS_KEY,
      JSON.stringify({ language: state.language, theme: state.mode, fontSize: state.fontSize })
    );

    // Apply data attributes to html root
    const root = document.documentElement;
    root.setAttribute("data-theme", state.theme);
    root.setAttribute("data-mode", state.mode);
    root.setAttribute("data-theme-mode", state.mode);
    root.setAttribute("data-font", state.fontSize);
    document.body.setAttribute("data-lang", state.language);

    if (state.mode === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-is-dark", "true");
    } else {
      root.classList.remove("dark");
      root.removeAttribute("data-is-dark");
    }
  }, [state.language, state.theme, state.mode, state.fontSize]);

  const addToast = useCallback((message, variant = "success") => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: "ADD_TOAST", payload: { id, message, variant } });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", payload: id }), 3800);
  }, []);

  const removeToast = useCallback((id) => dispatch({ type: "REMOVE_TOAST", payload: id }), []);

  // Listen for global auth expiration events from API client
  useEffect(() => {
    function handleAuthExpired(e) {
      dispatch({ type: "LOGOUT" });
      addToast(e.detail?.message || "Session expired. Please log in again.", "error");
    }

    window.addEventListener("bhoomi:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("bhoomi:auth-expired", handleAuthExpired);
  }, [addToast]);

  const login = useCallback((user) => dispatch({ type: "LOGIN", payload: user }), []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    } finally {
      setToken(null);
      dispatch({ type: "LOGOUT" });
      addToast("You have been logged out successfully.", "info");
    }
  }, [addToast]);

  const updateUser = useCallback((patch) => dispatch({ type: "UPDATE_USER", payload: patch }), []);
  const setLanguage = useCallback((lang) => dispatch({ type: "SET_LANGUAGE", payload: lang }), []);
  const setTheme = useCallback((theme) => dispatch({ type: "SET_THEME", payload: theme }), []);
  const setMode = useCallback((mode) => dispatch({ type: "SET_MODE", payload: mode }), []);
  const toggleMode = useCallback(() => dispatch({ type: "TOGGLE_MODE" }), []);
  const setFontSize = useCallback((size) => dispatch({ type: "SET_FONT_SIZE", payload: size }), []);

  const tr = useCallback((key) => translate(state.language, key), [state.language]);

  const value = {
    ...state,
    themes: THEMES,
    login,
    logout,
    updateUser,
    setLanguage,
    setTheme,
    setMode,
    toggleMode,
    setFontSize,
    addToast,
    removeToast,
    t: tr,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
