import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0'

export const supabase = createClient(supabaseUrl, supabaseKey)

// User roles configuration for Supabase
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
}

export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    canTakeTests: true,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: true,
    canSubmitSolutions: true
  },
  [USER_ROLES.ADMIN]: {
    canTakeTests: false,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: false,
    canSubmitSolutions: false,
    canViewStudents: true,
    canViewAllResults: true,
    canManageTests: true,
    canGenerateReports: true,
    canViewSubmissions: true
  },
  [USER_ROLES.SUPER_ADMIN]: {
    canTakeTests: false,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: false,
    canSubmitSolutions: false,
    canViewStudents: true,
    canViewAllResults: true,
    canManageTests: true,
    canGenerateReports: true,
    canViewSubmissions: true,
    canManageAdmins: true,
    canManageSystem: true,
    canViewAllActivity: true
  }
}

export default supabase
