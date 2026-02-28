"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { getToken, setToken, removeToken } from '@/lib/apiClient';
import { USER_ROLES } from '@/lib/constants';

// ──────── Types ────────

export interface AuthUser {
    _id: string;
    email: string;
    display_name: string;
    role: 'student' | 'admin' | 'super_admin';
    created_at: string;
    last_active: string;
    mock?: boolean;
    [key: string]: any;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
    mock?: boolean;
    needsEmailConfirmation?: boolean;
    message?: string;
}

export interface UserRoles {
    STUDENT: string;
    ADMIN: string;
    SUPER_ADMIN: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    userRole: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    signup: (email: string, password: string, role?: string, displayName?: string) => Promise<AuthResult>;
    login: (email: string, password: string, expectedRole?: string | null) => Promise<AuthResult>;
    testLogin: (role?: string) => Promise<AuthResult>;
    superAdminLogin: (password: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    USER_ROLES: UserRoles;
}

// ──────── Context ────────

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// ──────── Provider ────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // ──────── Initialize: check token on mount ────────

    useEffect(() => {
        const initAuth = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            // Ensure cookie is in sync (covers pre-existing localStorage tokens)
            if (!document.cookie.includes('codebud_token=')) {
                setToken(token);
            }

            try {
                const response = await apiClient.get('/api/auth/me');
                if (response.data.success && response.data.user) {
                    const userData = response.data.user;
                    setUser(userData);
                    setUserRole(userData.role);
                    setIsAuthenticated(true);
                    console.log('[AUTH] Session restored:', userData.email);
                }
            } catch (error) {
                console.warn('[AUTH] Token validation failed, clearing session');
                removeToken();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // ──────── Signup ────────

    const signup = useCallback(async (email: string, password: string, role = 'student', displayName = ''): Promise<AuthResult> => {
        try {
            const response = await apiClient.post('/api/auth/signup', {
                email,
                password,
                role,
                displayName: displayName || email.split('@')[0],
            });

            if (response.data.success) {
                const { token, user: userData } = response.data;
                setToken(token);
                setUser(userData);
                setUserRole(userData.role);
                setIsAuthenticated(true);
                console.log('[AUTH] Signup successful:', userData.email);
                return { success: true, user: userData };
            }

            return { success: false, error: response.data.error || 'Signup failed' };
        } catch (error: any) {
            const message = error.response?.data?.error || error.message || 'Signup failed';
            console.error('[AUTH] Signup error:', message);
            return { success: false, error: message };
        }
    }, []);

    // ──────── Login ────────

    const login = useCallback(async (email: string, password: string, expectedRole: string | null = null): Promise<AuthResult> => {
        try {
            const response = await apiClient.post('/api/auth/login', {
                email,
                password,
                expectedRole,
            });

            if (response.data.success) {
                const { token, user: userData } = response.data;
                setToken(token);
                setUser(userData);
                setUserRole(userData.role);
                setIsAuthenticated(true);
                console.log('[AUTH] Login successful:', userData.email);
                return { success: true, user: userData };
            }

            return { success: false, error: response.data.error || 'Login failed' };
        } catch (error: any) {
            const message = error.response?.data?.error || error.message || 'Login failed';
            console.error('[AUTH] Login error:', message);
            return { success: false, error: message };
        }
    }, []);

    // ──────── Test Login (with backend fallback) ────────

    const testLogin = useCallback(async (role = 'student'): Promise<AuthResult> => {
        const testEmail = `test_${role}@codebud.dev`;
        const testDisplayName = `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;

        // Try to signup the test user first, then login
        try {
            await apiClient.post('/api/auth/signup', {
                email: testEmail,
                password: 'test123456',
                role,
                displayName: testDisplayName,
            });
        } catch {
            // User already exists, that's expected
        }

        // Now login
        try {
            const response = await apiClient.post('/api/auth/login', {
                email: testEmail,
                password: 'test123456',
            });

            if (response.data.success) {
                const { token, user: userData } = response.data;
                setToken(token);
                setUser(userData);
                setUserRole(userData.role);
                setIsAuthenticated(true);
                console.log('[AUTH] Test login successful:', testEmail);
                return { success: true, user: userData };
            }

            return { success: false, error: response.data.error };
        } catch (error) {
            // If backend is down, create a mock user for development
            console.warn('[AUTH] Backend unreachable, using mock test login');
            const mockUser: AuthUser = {
                _id: `test_${role}_${Date.now()}`,
                email: testEmail,
                display_name: testDisplayName,
                role: role as AuthUser['role'],
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
                mock: true,
            };
            setUser(mockUser);
            setUserRole(role);
            setIsAuthenticated(true);
            return { success: true, user: mockUser, mock: true };
        }
    }, []);

    // ──────── Super Admin Login ────────

    const superAdminLogin = useCallback(async (password: string): Promise<AuthResult> => {
        const SUPER_ADMIN_PASSWORD = 'codebud_super_admin_2025';
        if (password !== SUPER_ADMIN_PASSWORD) {
            return { success: false, error: 'Invalid super admin password' };
        }

        const superEmail = 'super_admin@codebud.dev';

        try {
            await apiClient.post('/api/auth/signup', {
                email: superEmail,
                password: SUPER_ADMIN_PASSWORD,
                role: 'super_admin',
                displayName: 'Super Admin',
            });
        } catch {
            // Already exists
        }

        try {
            const response = await apiClient.post('/api/auth/login', {
                email: superEmail,
                password: SUPER_ADMIN_PASSWORD,
            });

            if (response.data.success) {
                const { token, user: userData } = response.data;
                setToken(token);
                setUser(userData);
                setUserRole('super_admin');
                setIsAuthenticated(true);
                return { success: true, user: userData };
            }

            return { success: false, error: response.data.error };
        } catch (error) {
            // Fallback mock super admin
            console.warn('[AUTH] Backend unreachable, using mock super admin');
            const mockUser: AuthUser = {
                _id: `super_admin_${Date.now()}`,
                email: superEmail,
                display_name: 'Super Admin',
                role: 'super_admin',
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
                mock: true,
            };
            setUser(mockUser);
            setUserRole('super_admin');
            setIsAuthenticated(true);
            return { success: true, user: mockUser, mock: true };
        }
    }, []);

    // ──────── Logout ────────

    const logout = useCallback(async () => {
        removeToken();
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        console.log('[AUTH] Logged out');
    }, []);

    // ──────── Utility ────────

    const hasPermission = useCallback((permission: string): boolean => {
        if (!userRole) return false;
        const rolePermissions: Record<string, string[]> = {
            student: ['view_dashboard', 'submit_test', 'view_results'],
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
        signup,
        login,
        testLogin,
        superAdminLogin,
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
