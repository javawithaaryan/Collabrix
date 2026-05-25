import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../lib/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
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
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

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
  };

  const logout = () => {
    localStorage.removeItem("token");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};