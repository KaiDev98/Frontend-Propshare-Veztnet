import axios from "axios";

// Instance axios dengan base URL & token otomatis
const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Setiap request otomatis bawa token dari localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Kalau token expired → redirect ke signin
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;