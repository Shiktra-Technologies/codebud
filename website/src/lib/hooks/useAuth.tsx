"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { getToken, setToken, removeToken, setMemoryRefreshToken } from '@/lib/apiClient';
import { USER_ROLES } from '@/lib/constants';


export interface AuthUser {
    _id: string;
    email: string;
    display_name: string;
    role: 'student' | 'mentor' | 'admin' | 'codebud_super_admin';
    [key: string]: any;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
}

export interface UserRoles {
    STUDENT: string;
    MENTOR: string;
    ADMIN: string;
    SUPER_ADMIN: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    userRole: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    startKeycloakLogin: (redirectUri?: string) => Promise<AuthResult>;
    exchangeAuthorizationCode: (code: string, redirectUri?: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    USER_ROLES: UserRoles;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const isTokenExpired = useCallback((payload: any) => {
        if (!payload?.exp) return true;
        return payload.exp * 1000 < Date.now();
    }, []);

    const mapRoleFromUser = useCallback((userData: any): string => {
        const roles = userData?.roles || [];
        if (!roles || roles.length === 0) {
            console.error('[AUTH] No roles found in token');
            return 'unauthorized';
        }
        if (roles.includes('codebud_super_admin')) return 'codebud_super_admin';
        if (roles.includes('admin')) return 'admin';
        if (roles.includes('mentor')) return 'mentor';
        return 'student';
    }, []);

    const applySession = useCallback((token: string, userData: any): AuthResult => {
        const role = mapRoleFromUser(userData);
        console.log('[AUTH DEBUG] Applying session — role:', role, 'roles:', userData?.roles);
        setToken(token);
        setUser({ ...userData, role });
        setUserRole(role);
        setIsAuthenticated(true);
        return { success: true, user: { ...userData, role } };
    }, [mapRoleFromUser]);

    useEffect(() => {
        const initAuth = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            if (!document.cookie.includes('codebud_token=')) {
                setToken(token);
            }

            // Try to decode the stored token to recover user info
            // This works for both Keycloak RS256 tokens and internal HS256 tokens
            let userData: any = null;

            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

                    // Check token expiry
                    if (isTokenExpired(payload)) {
                        console.warn('[AUTH] Token expired');
                        removeToken();
                        setLoading(false);
                        return;
                    }

                    // Build user data from token payload
                    const storedRoles: string[] = payload?.realm_access?.roles || [];
                    console.log('[AUTH DEBUG] Stored token roles:', storedRoles);

                    userData = {
                        _id: payload.sub || payload.user_id || '',
                        email: payload.email || payload.preferred_username || '',
                        display_name: payload.name || payload.preferred_username || payload.email?.split('@')[0] || 'User',
                        roles: storedRoles,
                    };
                }
            } catch {
                console.warn('[AUTH] Could not decode stored token');
            }

            if (userData && userData.email) {
                // Token is valid and decodable — apply session directly
                applySession(token, userData);
                console.log('[AUTH] Session restored from stored token for:', userData.email);

                // Best-effort: try to get fresh user data from backend (non-blocking)
                try {
                    const response = await apiClient.get('/api/auth/me');
                    if (response.data?.success && response.data?.user) {
                        applySession(token, response.data.user);
                        console.log('[AUTH] User data refreshed from backend');
                    }
                } catch {
                    // Backend unavailable or token type mismatch — that's fine, we already have user data
                    console.log('[AUTH] Backend /api/auth/me unavailable, using token data');
                }
            } else {
                // Token is corrupted or unreadable
                removeToken();
            }

            setLoading(false);
        };

        initAuth();
    }, [applySession, isTokenExpired]);

    // Auto-refresh token is globally handled inside apiClient interceptors based on strict expiry thresholds

    const startKeycloakLogin = useCallback(async (redirectUri?: string): Promise<AuthResult> => {
        try {
            const uri = redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '');
            const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://10.172.29.192:5000';
            const endpoint = `${backendBase}/api/auth/login-url?redirect_uri=${encodeURIComponent(uri)}`;
            const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });

            if (response.status === 404) {
                return { success: false, error: 'Auth service unavailable' };
            }

            const data = await response.json();
            const loginUrl = data?.login_url;
            if (!loginUrl) {
                return { success: false, error: 'Missing login URL from backend' };
            }

            if (typeof window !== 'undefined') {
                window.location.href = loginUrl;
            }
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error?.message || 'Unable to start Keycloak login' };
        }
    }, []);

    const exchangeAuthorizationCode = useCallback(async (code: string, redirectUri?: string): Promise<AuthResult> => {
        try {
            const keycloakTokenUrl = `${(process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://keycloak.mycodebud.in').replace(/\/+$/, '')}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'codebud'}/protocol/openid-connect/token`;
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'codebud-app';
            const uri = redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '');

            // Exchange code directly with Keycloak (public client flow)
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                code,
                redirect_uri: uri,
            });

            console.log('[AUTH] Exchanging code with Keycloak:', keycloakTokenUrl);

            const tokenResp = await fetch(keycloakTokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params,
            });

            if (!tokenResp.ok) {
                const errText = await tokenResp.text();
                console.error('[AUTH] Keycloak token exchange failed:', tokenResp.status, errText);
                return { success: false, error: 'Token exchange failed' };
            }

            const tokens = await tokenResp.json();
            const kcAccessToken = tokens.access_token;
            const kcRefreshToken = tokens.refresh_token;

            if (kcRefreshToken) {
                setMemoryRefreshToken(kcRefreshToken);
            }

            if (!kcAccessToken) {
                return { success: false, error: 'No access token received from Keycloak' };
            }

            console.log('[AUTH] Keycloak token received successfully');

            // Decode JWT payload for user info
            let kcPayload: any = {};
            try {
                const parts = kcAccessToken.split('.');
                if (parts.length === 3) {
                    kcPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                }
            } catch {
                console.warn('[AUTH] Could not decode Keycloak token payload');
            }

            // Validate token structure
            if (!kcPayload || !kcPayload.realm_access) {
                console.error('[AUTH] Invalid Keycloak token structure — missing realm_access');
                return { success: false, error: 'Invalid Keycloak token structure' };
            }

            // Extract Keycloak realm roles
            const kcRoles: string[] = kcPayload.realm_access?.roles || [];
            console.log("[AUTH DEBUG] roles:", kcRoles);
            console.log('[AUTH DEBUG] Token payload:', kcPayload);

            const email = kcPayload.email || kcPayload.preferred_username || '';
            const displayName = kcPayload.name || kcPayload.preferred_username || email.split('@')[0] || 'User';

            const userData: any = {
                _id: kcPayload.sub || '',
                email,
                display_name: displayName,
                roles: kcRoles,  // full Keycloak role array — no hardcoded role
            };

            // Apply session — store Keycloak token directly, no backend callback
            console.log('[AUTH] Applying session for:', email);
            return applySession(kcAccessToken, userData);
        } catch (error: any) {
            const message = error.message || 'Authorization code exchange failed';
            console.error('[AUTH] Exchange error:', message);
            return { success: false, error: message };
        }
    }, [applySession]);

    const logout = useCallback(async () => {
        removeToken();
        setMemoryRefreshToken(null);
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
    }, []);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!userRole) return false;
        const rolePermissions: Record<string, string[]> = {
            student: ['view_dashboard', 'submit_test', 'view_results'],
            mentor: ['view_dashboard', 'view_results', 'view_assigned_students', 'view_submissions', 'add_feedback', 'manage_practice_sets', 'view_violations'],
            admin: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data'],
            codebud_super_admin: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data', 'manage_admins', 'system_settings'],
        };
        return (rolePermissions[userRole] || []).includes(permission);
    }, [userRole]);

    const value: AuthContextType = {
        user,
        userRole,
        loading,
        isAuthenticated,
        startKeycloakLogin,
        exchangeAuthorizationCode,
        logout,
        hasPermission,
        USER_ROLES: USER_ROLES as UserRoles,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
