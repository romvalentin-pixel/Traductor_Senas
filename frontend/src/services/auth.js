import api from "./api.js";

export async function register({ nombre, email, password }) {
  return api.post("/auth/register", { nombre, email, password });
}

export async function login(email, password) {
  // El backend usa el flujo OAuth2 Password (form-urlencoded).
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return api.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export async function me() {
  return api.get("/auth/me");
}

export async function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email });
}

export async function resetPassword({ token, newPassword }) {
  return api.post("/auth/reset-password", { token, new_password: newPassword });
}