
import { apiRequest } from "../../../api/apiClient";

export async function loginApi(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login: credentials.login,
      password: credentials.password,
    }),
  });
}

export async function getCurrentUserApi() {
  return apiRequest("/me");
}

export async function logoutApi() {
  const refreshToken = localStorage.getItem("refreshToken");

  return apiRequest("/auth/logout", {
    method: "POST",
    headers: {},
    body: JSON.stringify({ refreshToken }),
  });
}

export async function refreshTokenApi() {
  const refreshToken = localStorage.getItem("refreshToken");

  return apiRequest("/auth/refresh", {
    method: "POST",
    headers: {},
    body: JSON.stringify({ refreshToken }),
  });
}
