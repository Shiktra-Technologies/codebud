"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { getToken, setToken, removeToken, setMemoryRefreshToken } from '@/lib/apiClient';
import { USER_ROLES } from '@/lib/constants';


export interface AuthUser {
    _id: string;
    email: string;
    display_name: string;
    role: 'student' | 'mentor' | 'admin' | 'codebud_super_admin' | 'company';
    roles?: string[];
    is_new_user?: boolean;
    is_onboarded?: boolean;
    onboarding_completed?: boolean;
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
    startKeycloakLogin: (redirectUri?: string, state?: string) => Promise<AuthResult>;
    exchangeAuthorizationCode: (code: string, redirectUri?: string) => Promise<AuthResult>;
    refreshMe: (tokenOverride?: string) => Promise<AuthResult>;
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

    const mapRoleFromUser = useCallback((userData: any): AuthUser['role'] | null => {
        if (userData?.role === 'codebud_super_admin') return 'codebud_super_admin';
        if (userData?.role === 'admin') return 'admin';
        if (userData?.role === 'mentor') return 'mentor';
        if (userData?.role === 'company') return 'company';
        if (userData?.role === 'student') return 'student';
        return null;
    }, []);

    const normalizeMeResponse = useCallback((meData: any): AuthUser | null => {
        if (!meData?.success || !meData?.user) {
            return null;
        }

        const role = mapRoleFromUser({ role: meData.role });
        if (!role) {
            console.error('[AUTH] /api/me returned invalid role:', meData.role);
            return null;
        }

        const isOnboarded = Boolean(meData.is_onboarded);
        const normalized: AuthUser = {
            ...meData.user,
            email: meData.email || meData.user?.email || '',
            role,
            roles: Array.isArray(meData.roles) ? meData.roles : [],
            is_new_user: Boolean(meData.is_new_user),
            is_onboarded: isOnboarded,
            onboarding_completed: isOnboarded,
        };

        return normalized;
    }, [mapRoleFromUser]);

    const applySession = useCallback((token: string, userData: any): AuthResult => {
        const role = mapRoleFromUser(userData);
        if (!role) {
            console.error('[AUTH] Invalid role from backend session payload:', userData?.role);
            removeToken();
            setUser(null);
            setUserRole(null);
            setIsAuthenticated(false);
            return { success: false, error: 'Invalid role from backend' };
        }

        const isOnboarded = Boolean(userData?.is_onboarded);
        const normalizedUser = {
            ...userData,
            role,
            is_onboarded: isOnboarded,
            onboarding_completed: isOnboarded,
            is_new_user: Boolean(userData?.is_new_user),
        };

        console.log('[AUTH DEBUG] user:', normalizedUser);
        console.log('[ROUTING DEBUG]', normalizedUser.is_onboarded);
        setToken(token);
        setUser(normalizedUser);
        setUserRole(role);
        setIsAuthenticated(true);
        return { success: true, user: normalizedUser };
    }, [mapRoleFromUser]);

    const refreshMe = useCallback(async (tokenOverride?: string): Promise<AuthResult> => {
        const token = tokenOverride || getToken();
        if (!token) {
            return { success: false, error: 'No active token' };
        }

        try {
            if (!document.cookie.includes('codebud_token=')) {
                setToken(token);
            }

            const config = tokenOverride
                ? { headers: { Authorization: `Bearer ${token}` } }
                : undefined;
            const response = await apiClient.get('/api/me', config);
            const normalizedUser = normalizeMeResponse(response.data);

            if (!normalizedUser) {
                removeToken();
                setUser(null);
                setUserRole(null);
                setIsAuthenticated(false);
                return { success: false, error: 'Invalid /api/me response' };
            }

            return applySession(token, normalizedUser);
        } catch (error: any) {
            console.error('[AUTH] Failed to refresh /api/me:', error?.message || error);
            removeToken();
            setUser(null);
            setUserRole(null);
            setIsAuthenticated(false);
            return { success: false, error: 'Failed to fetch /api/me' };
        }
    }, [applySession, normalizeMeResponse]);

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

            await refreshMe(token);

            setLoading(false);
        };

        initAuth();
    }, [refreshMe]);

    // Auto-refresh token is globally handled inside apiClient interceptors based on strict expiry thresholds

    const startKeycloakLogin = useCallback(async (redirectUri?: string, state?: string): Promise<AuthResult> => {
        try {
            const uri = redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '');
            const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000';
            let endpoint = `${backendBase}/api/auth/login-url?redirect_uri=${encodeURIComponent(uri)}`;
            if (state) {
                endpoint += `&state=${encodeURIComponent(state)}`;
            }
            const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'include' });

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

            console.log('[AUTH] Keycloak token received successfully, fetching /api/me...');
            return await refreshMe(kcAccessToken);
        } catch (error: any) {
            const message = error.message || 'Authorization code exchange failed';
            console.error('[AUTH] Exchange error:', message);
            removeToken();
            return { success: false, error: message };
        }
    }, [refreshMe]);

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
            company: ['view_dashboard'],
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
        refreshMe,
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
