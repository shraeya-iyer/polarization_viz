export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export function redditLoginUrl() {
  return `${API_BASE}/auth/reddit/login`;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  if (res.status === 401) {
    const err = new Error("unauthenticated");
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Request to ${path} failed with ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const getMe = () => request("/api/me");
export const getGeneralArticle = () => request("/api/general-article");
export const getCommunities = () => request("/api/communities");
export const logout = () => request("/auth/reddit/logout", { method: "POST" });
