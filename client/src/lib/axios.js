import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 expiries by clearing session and redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeWorkspaceId");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    
    // Normalize and return standard error payload string
    const message = error.response?.data?.message || error.message || "An unexpected network error occurred.";
    return Promise.reject(new Error(message));
  }
);

export default API;