import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// auto attach token on refresh
const token = localStorage.getItem("mhms_token");
if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;

export default api;