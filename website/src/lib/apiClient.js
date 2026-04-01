import axios from 'axios';

function resolveApiUrl() {
    const raw = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://10.172.29.192:5000';
    return String(raw).replace(/\/+$/, '');
}

const API_URL = resolveApiUrl();

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// ──────── Token Management ────────

const TOKEN_KEY = 'codebud_token';

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    // Sync to cookie so Next.js middleware can read it server-side
    // encodeURIComponent handles any special chars in the JWT
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 72}; SameSite=Lax`;
}

export function removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    // Clear the cookie as well
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

// ──────── Request Interceptor (attach JWT) ────────

apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ──────── Response Interceptor (handle 401 and network errors) ────────

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeToken();
            // Don't redirect if already on auth page
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
                window.location.href = '/auth';
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
