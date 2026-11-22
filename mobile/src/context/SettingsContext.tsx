import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_LANGUAGE, STORAGE_KEYS } from '../constants/config';
import type { ThemeMode } from '../constants/theme';

interface SettingsContextValue {
  language: string;
  speechRate: number;
  autosave: boolean;
  autoSpeak: boolean;
  themeMode: ThemeMode;
  ready: boolean;
  setLanguage: (value: string) => void;
  setSpeechRate: (value: number) => void;
  setAutosave: (value: boolean) => void;
  setAutoSpeak: (value: boolean) => void;
  setThemeMode: (value: ThemeMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function parseThemeMode(value: string | null): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [speechRate, setSpeechRateState] = useState(1);
  const [autosave, setAutosaveState] = useState(true);
  const [autoSpeak, setAutoSpeakState] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const entries = await AsyncStorage.multiGet([
          STORAGE_KEYS.language,
          STORAGE_KEYS.speechRate,
          STORAGE_KEYS.autosave,
          STORAGE_KEYS.autoSpeak,
          STORAGE_KEYS.themeMode,
        ]);
        if (cancelled) return;
        const stored = Object.fromEntries(entries);
        if (stored[STORAGE_KEYS.language]) setLanguageState(stored[STORAGE_KEYS.language]!);
        const rate = Number(stored[STORAGE_KEYS.speechRate]);
        if (Number.isFinite(rate) && rate >= 0.5 && rate <= 2) setSpeechRateState(rate);
        if (stored[STORAGE_KEYS.autosave] !== null) {
          setAutosaveState(stored[STORAGE_KEYS.autosave] !== '0');
        }
        if (stored[STORAGE_KEYS.autoSpeak] !== null) {
          setAutoSpeakState(stored[STORAGE_KEYS.autoSpeak] !== '0');
        }
        setThemeModeState(parseThemeMode(stored[STORAGE_KEYS.themeMode] ?? null));
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((value: string) => {
    setLanguageState(value);
    void AsyncStorage.setItem(STORAGE_KEYS.language, value);
  }, []);

  const setSpeechRate = useCallback((value: number) => {
    setSpeechRateState(value);
    void AsyncStorage.setItem(STORAGE_KEYS.speechRate, String(value));
  }, []);

  const setAutosave = useCallback((value: boolean) => {
    setAutosaveState(value);
    void AsyncStorage.setItem(STORAGE_KEYS.autosave, value ? '1' : '0');
  }, []);

  const setAutoSpeak = useCallback((value: boolean) => {
    setAutoSpeakState(value);
    void AsyncStorage.setItem(STORAGE_KEYS.autoSpeak, value ? '1' : '0');
  }, []);

  const setThemeMode = useCallback((value: ThemeMode) => {
    setThemeModeState(value);
    void AsyncStorage.setItem(STORAGE_KEYS.themeMode, value);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      language,
      speechRate,
      autosave,
      autoSpeak,
      themeMode,
      ready,
      setLanguage,
      setSpeechRate,
      setAutosave,
      setAutoSpeak,
      setThemeMode,
    }),
    [
      language,
      speechRate,
      autosave,
      autoSpeak,
      themeMode,
      ready,
      setLanguage,
      setSpeechRate,
      setAutosave,
      setAutoSpeak,
      setThemeMode,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettingsContext debe usarse dentro de <SettingsProvider>');
  return context;
}
