import api from "./api";

// storage keys (same as your ProtectedRoute uses)
const K_TOKEN = "mhms_token";
const K_ROLE = "mhms_role";

export function saveSession(token, role) {
  localStorage.setItem(K_TOKEN, token);
  localStorage.setItem(K_ROLE, role);
}

export function clearSession() {
  localStorage.removeItem(K_TOKEN);
  localStorage.removeItem(K_ROLE);
}

export function getRole() {
  return localStorage.getItem(K_ROLE);
}

export async function loginAny(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  saveSession(data.token, data?.user?.role);
  return data;
}

// patient register uses /auth/register (your existing)
export async function registerPatient(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

// donor register/login uses /donor-auth/*
export async function registerDonor(payload) {
  const { data } = await api.post("/donor-auth/register", payload);
  // donor register does not auto-login, keep simple
  return data;
}

export async function loginDonor(email, password) {
  const { data } = await api.post("/donor-auth/login", { email, password });
  saveSession(data.token, data?.user?.role);
  return data;
}

// applicant apply creates APPLICANT + application
export async function applyJob(payload) {
  const { data } = await api.post("/applications/apply", payload);
  return data;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}

/*
import api from "./api";

export async function loginPatient(email, password) {
  const { data } = await api.post("/auth/login", { email, password });

  // store token + role
  localStorage.setItem("mhms_token", data.token);
  localStorage.setItem("mhms_role", data.user.role);

  // attach token for future requests
  api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

  return data;
}

export async function registerPatient(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export function logout() {
  localStorage.removeItem("mhms_token");
  localStorage.removeItem("mhms_role");
  delete api.defaults.headers.common.Authorization;
}
*/