import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      return data.user;
    } catch (e) {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/auth/callback") {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const loginWithCreds = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginAsGuest = async () => {
    const { data } = await api.post("/auth/guest");
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, loginWithCreds, register, loginAsGuest, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
