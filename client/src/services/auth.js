import { api } from "./api";

const KEY = "mhms_token";

export function saveToken(token) {
  localStorage.setItem(KEY, token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function loadToken() {
  const t = localStorage.getItem(KEY);
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
  return t;
}

export async function registerPatient(payload) {
  const res = await api.post("/auth/register", payload);
  return res.data;
}

export async function loginPatient(email, password) {
  const res = await api.post("/auth/login", { email, password });
  saveToken(res.data.token);
  return res.data;
}