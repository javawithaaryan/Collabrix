import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../lib/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Auth Error:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (formData) => {
    const response = await api.post(
      "/auth/login",
      formData
    );

    localStorage.setItem(
      "token",
      response.data.token
    );

    setUser(response.data.user);

    return response.data;
  };

  const register = async (formData) => {
    const response = await api.post(
      "/auth/register",
      formData
    );

    localStorage.setItem(
      "token",
      response.data.token
    );

    setUser(response.data.user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used within AuthProvider"
    );
  }

  return context;
};

// Backwards-compatible alias: some files import { useAuth } from this module
export const useAuth = useAuthContext;

export default AuthContext;