import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const TOKEN_KEY = "sl_token";
const USER_KEY = "sl_user";

const AppContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [theme, setTheme] = useState(() => localStorage.getItem("sl_theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("sl_lang") || "es-AR");
  const [speechRate, setSpeechRate] = useState(
    () => parseFloat(localStorage.getItem("sl_rate") || "1")
  );
  const [visualDetection, setVisualDetection] = useState(
    () => localStorage.getItem("sl_visual") !== "0"
  );
  const [autoSpeak, setAutoSpeak] = useState(
    () => localStorage.getItem("sl_autoSpeak") !== "0"
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("sl_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sl_lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("sl_rate", String(speechRate));
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem("sl_visual", visualDetection ? "1" : "0");
  }, [visualDetection]);

  useEffect(() => {
    localStorage.setItem("sl_autoSpeak", autoSpeak ? "1" : "0");
  }, [autoSpeak]);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      login,
      logout,
      theme,
      setTheme,
      language,
      setLanguage,
      speechRate,
      setSpeechRate,
      visualDetection,
      setVisualDetection,
      autoSpeak,
      setAutoSpeak,
    }),
    [
      token,
      user,
      isAuthenticated,
      login,
      logout,
      theme,
      language,
      speechRate,
      visualDetection,
      autoSpeak,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}