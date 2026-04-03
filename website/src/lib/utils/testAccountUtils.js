/**
 * Test Account Utilities — Migrated from Supabase to MongoDB API
 * Test accounts are now created via the backend signup API
 */

import apiClient from '../apiClient';

/**
 * Create test accounts via API
 */
export const createTestAccounts = async () => {
  console.log('🧪 Creating test accounts via API...');
  const accounts = [
    { email: 'test_student@codebud.dev', password: 'test123456', role: 'student', displayName: 'Test Student' },
    { email: 'test_admin@codebud.dev', password: 'test123456', role: 'admin', displayName: 'Test Admin' },
  ];

  const results = { students: [], admins: [], errors: [] };

  for (const account of accounts) {
    try {
      const response = await apiClient.post('/api/auth/signup', account);
      if (response.data.success) {
        console.log(`✅ Created: ${account.email}`);
        (account.role === 'student' ? results.students : results.admins).push(response.data.user);
      }
    } catch (error) {
      // 409 = already exists, which is fine
      if (error.response?.status === 409) {
        console.log(`ℹ️ Account already exists: ${account.email}`);
      } else {
        results.errors.push({ email: account.email, error: error.message });
      }
    }
  }

  return results;
};

export const deleteTestAccounts = async () => {
  console.warn('⚠️ deleteTestAccounts not yet implemented via API');
  return { success: false, message: 'Not implemented' };
};

export const checkTestAccountsExist = async () => {
  console.log('📋 checkTestAccountsExist — try logging in to verify');
  return { exists: false, accounts: [] };
};

export const setupTestEnvironment = async () => {
  console.log('🚀 Setting up test environment...');
  return createTestAccounts();
};

// Dev console helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.testAccountUtils = { createTestAccounts, deleteTestAccounts, checkTestAccountsExist, setupTestEnvironment };
  console.log('🧪 Test account utilities available at window.testAccountUtils');
}
