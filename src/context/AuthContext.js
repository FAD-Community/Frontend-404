
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginApi,
  getCurrentUserApi,
  logoutApi,
} from "../features/auth/services/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {
    async function initializeAuth() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await getCurrentUserApi();
        const currentUser = result?.user ?? result;

        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, [clearSession]);

  useEffect(() => {
    const handleSessionExpired = () => clearSession();
    const handleUserUpdated = (event) => {
      if (!event.detail) return;
      setUser(event.detail);
      localStorage.setItem("user", JSON.stringify(event.detail));
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    window.addEventListener("auth:user-updated", handleUserUpdated);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, [clearSession]);

  const login = async (credentials) => {
    const data = await loginApi(credentials);

    if (!data?.accessToken || !data?.refreshToken || !data?.user) {
      throw new Error("استجابة تسجيل الدخول غير مكتملة");
    }

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: data.user }));

    setUser(data.user);

    return data.user;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
