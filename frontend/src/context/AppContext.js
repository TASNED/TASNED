import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import content from "../content";
import api from "../lib/api";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("tasned_lang") || "en");
  const [user, setUser] = useState(null);
  const t = content[lang];

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    localStorage.setItem("tasned_lang", lang);
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };
  const logout = async () => { await api.post("/auth/logout"); setUser(false); };

  return (
    <AppCtx.Provider value={{ lang, setLang, toggleLang, t, user, setUser, login, logout, refreshUser }}>
      {children}
    </AppCtx.Provider>
  );
}
