import axios from 'axios';

// Direct cross-origin calls to the backend. CORS is enforced by the backend's
// explicit allowlist (CORS_ORIGINS) with credentials support; app.mycodebud.in
// and auth.mycodebud.in are same-site, so SameSite=Lax cookies flow.
function resolveApiUrl() {
    return (process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
}

const API_URL = resolveApiUrl();
export const BACKEND_URL = API_URL;

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
    withCredentials: true,
});

// ──────── Token Management ────────

const TOKEN_KEY = 'codebud_token';

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

// `Secure` on HTTPS so the cookie is never sent over plain HTTP in prod.
// (It can't be HttpOnly — it's set from JS by design; the token also lives
// in localStorage, and the backend independently verifies the JWT signature.)
const cookieFlags = () =>
    `path=/; SameSite=Lax${typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''}`;

export function setToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    // Sync to cookie so Next.js middleware can read it server-side
    // encodeURIComponent handles any special chars in the JWT
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; max-age=${60 * 60 * 72}; ${cookieFlags()}`;
}

export function removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    // Clear the cookie as well
    document.cookie = `${TOKEN_KEY}=; max-age=0; ${cookieFlags()}`;
}

export let memoryRefreshToken = null;

export function setMemoryRefreshToken(token) {
    memoryRefreshToken = token;
}

function shouldRefresh(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload?.exp) return true;
        const now = Date.now() / 1000;
        return payload.exp - now < 60; // refresh if < 60 seconds left
    } catch {
        return true;
    }
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

apiClient.interceptors.request.use(
    async (config) => {
        let token = getToken();

        if (token && shouldRefresh(token) && memoryRefreshToken) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const keycloakTokenUrl = `${(process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://keycloak.mycodebud.in').replace(/\/+$/, '')}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'codebud'}/protocol/openid-connect/token`;
                    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'codebud-app';
                    const params = new URLSearchParams({
                        grant_type: "refresh_token",
                        client_id: clientId,
                        refresh_token: memoryRefreshToken,
                    });

                    const res = await fetch(keycloakTokenUrl, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params,
                    });

                    if (!res.ok) throw new Error("Refresh failed");

                    const data = await res.json();
                    setToken(data.access_token);
                    if (data.refresh_token) {
                        memoryRefreshToken = data.refresh_token;
                    }

                    isRefreshing = false;
                    onRefreshed(data.access_token);
                    token = data.access_token;
                } catch (e) {
                    console.error("Refresh failed", e);
                    isRefreshing = false;
                    memoryRefreshToken = null;
                    removeToken();
                    if (typeof window !== 'undefined') window.location.href = '/auth';
                }
            } else {
                return new Promise(resolve => {
                    subscribeTokenRefresh(newToken => {
                        config.headers.Authorization = `Bearer ${newToken}`;
                        resolve(config);
                    });
                });
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ──────── Response Interceptor (handle 401 and network errors) ────────

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload?.exp ? payload.exp < Date.now() / 1000 : false;
    } catch {
        return true;
    }
}

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            const token = getToken();

            if (token && isTokenExpired(token) && !memoryRefreshToken) {
                // Session genuinely over: token expired and no refresh token to
                // renew it (e.g. after a page reload). Clear and prompt re-login
                // instead of leaving every API call silently failing.
                console.warn(`[API] Session expired (401 on ${requestUrl}) — redirecting to login`);
                removeToken();
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
                    window.location.href = '/auth';
                }
            } else {
                console.warn(`[API] 401 on ${requestUrl} — Keycloak token may not be compatible with backend`);
                // Token not expired (or refresh in flight): don't nuke the session —
                // the backend may reject for other, transient reasons.
            }
        }

        // Log network errors for debugging
        if (!error.response) {
            console.error('[API] Network Error:', {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                method: error.config?.method,
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;
