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