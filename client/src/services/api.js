import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mhms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

/*
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

const token = localStorage.getItem("mhms_token");
if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;

export default api;
*/