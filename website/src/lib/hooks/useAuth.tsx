"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { getToken, setToken, removeToken } from '@/lib/apiClient';
import { USER_ROLES } from '@/lib/constants';

export interface AuthUser {
    _id: string;
    email: string;
    display_name: string;
    role: 'student' | 'mentor' | 'admin' | 'super_admin';
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

    const mapRoleFromUser = useCallback((userData: any): string => {
        const roles = userData?.roles || [];
        if (roles.includes('super_admin')) return 'super_admin';
        if (roles.includes('admin')) return 'admin';
        if (roles.includes('mentor')) return 'mentor';
        return userData?.role || 'student';
    }, []);

    const applySession = useCallback((token: string, userData: any): AuthResult => {
        const role = mapRoleFromUser(userData);
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

            try {
                const response = await apiClient.get('/api/auth/me');
                if (response.data.success && response.data.user) {
                    applySession(token, response.data.user);
                } else {
                    removeToken();
                }
            } catch {
                removeToken();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, [applySession]);

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
            const response = await apiClient.post('/api/auth/callback', {
                code,
                redirect_uri: redirectUri,
            });

            if (!response.data?.success || !response.data?.access_token) {
                return { success: false, error: response.data?.error || 'Token exchange failed' };
            }

            const token = response.data.access_token;
            const meResponse = await apiClient.get('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!meResponse.data?.success || !meResponse.data?.user) {
                return { success: false, error: 'Token validated but user profile unavailable' };
            }

            return applySession(token, meResponse.data.user);
        } catch (error: any) {
            const message = error.response?.data?.error || error.message || 'Authorization code exchange failed';
            return { success: false, error: message };
        }
    }, [applySession]);

    const logout = useCallback(async () => {
        removeToken();
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
            super_admin: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data', 'manage_admins', 'system_settings'],
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
