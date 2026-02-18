import { TEST_ACCOUNTS } from '../config/testAccounts';

// Safe import with fallback
let supabase = null;
try {
  const supabaseConfig = require('../config/supabaseConfig');
  supabase = supabaseConfig.supabase;
} catch (error) {
  console.warn('Supabase configuration not available:', error);
}

/**
 * Utility functions for managing test accounts in development
 * These functions require Supabase to be properly configured
 */

const checkSupabaseAvailable = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your configuration.');
  }
  return true;
};

/**
 * Create test accounts in Supabase Auth and Users table
 * This is useful for seeding the database with test data
 */
export const createTestAccounts = async () => {
  checkSupabaseAvailable();
  console.log('🧪 Creating test accounts in database...');
  
  const results = {
    students: [],
    admins: [],
    errors: []
  };

  try {
    // Create student accounts
    for (const student of TEST_ACCOUNTS.STUDENTS) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: student.password,
          email_confirm: true,
          user_metadata: {
            displayName: student.displayName,
            role: student.role
          }
        });

        if (authError) {
          console.error(`❌ Failed to create student auth: ${student.email}`, authError);
          results.errors.push({ type: 'student', email: student.email, error: authError.message });
          continue;
        }

        // Create user record
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: student.email,
            display_name: student.displayName,
            role: student.role,
            profile_data: student.profile,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          }])
          .select()
          .single();

        if (userError) {
          console.error(`❌ Failed to create student user record: ${student.email}`, userError);
          results.errors.push({ type: 'student', email: student.email, error: userError.message });
        } else {
          console.log(`✅ Created student: ${student.email}`);
          results.students.push(userData);
        }

      } catch (error) {
        console.error(`❌ Error creating student ${student.email}:`, error);
        results.errors.push({ type: 'student', email: student.email, error: error.message });
      }
    }

    // Create admin accounts
    for (const admin of TEST_ACCOUNTS.ADMINS) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: {
            displayName: admin.displayName,
            role: admin.role
          }
        });

        if (authError) {
          console.error(`❌ Failed to create admin auth: ${admin.email}`, authError);
          results.errors.push({ type: 'admin', email: admin.email, error: authError.message });
          continue;
        }

        // Create user record
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: admin.email,
            display_name: admin.displayName,
            role: admin.role,
            profile_data: admin.profile,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          }])
          .select()
          .single();

        if (userError) {
          console.error(`❌ Failed to create admin user record: ${admin.email}`, userError);
          results.errors.push({ type: 'admin', email: admin.email, error: userError.message });
        } else {
          console.log(`✅ Created admin: ${admin.email}`);
          results.admins.push(userData);
        }

      } catch (error) {
        console.error(`❌ Error creating admin ${admin.email}:`, error);
        results.errors.push({ type: 'admin', email: admin.email, error: error.message });
      }
    }

    console.log('🎉 Test account creation completed!');
    console.log(`✅ Students created: ${results.students.length}`);
    console.log(`✅ Admins created: ${results.admins.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);

    return results;

  } catch (error) {
    console.error('❌ Fatal error creating test accounts:', error);
    throw error;
  }
};

/**
 * Delete all test accounts from database
 * Useful for cleanup during development
 */
export const deleteTestAccounts = async () => {
  checkSupabaseAvailable();
  console.log('🗑️ Deleting test accounts...');
  
  const testEmails = [
    ...TEST_ACCOUNTS.STUDENTS.map(s => s.email),
    ...TEST_ACCOUNTS.ADMINS.map(a => a.email)
  ];

  try {
    // Delete from users table first
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .in('email', testEmails);

    if (usersError) {
      console.error('❌ Error deleting users:', usersError);
    } else {
      console.log('✅ Deleted user records');
    }

    // Note: Deleting auth users requires admin privileges
    // This would need to be done through Supabase dashboard or admin API
    console.log('⚠️ Auth users need to be deleted manually through Supabase dashboard');

    return { success: true, message: 'Test accounts deleted from users table' };

  } catch (error) {
    console.error('❌ Error deleting test accounts:', error);
    throw error;
  }
};

/**
 * Check if test accounts already exist
 */
export const checkTestAccountsExist = async () => {
  checkSupabaseAvailable();
  
  const testEmails = [
    ...TEST_ACCOUNTS.STUDENTS.map(s => s.email),
    ...TEST_ACCOUNTS.ADMINS.map(a => a.email)
  ];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('email, role, display_name')
      .in('email', testEmails);

    if (error) {
      console.error('❌ Error checking test accounts:', error);
      return { exists: false, accounts: [], error: error.message };
    }

    console.log(`📋 Found ${data.length} existing test accounts`);
    return { exists: data.length > 0, accounts: data };

  } catch (error) {
    console.error('❌ Error checking test accounts:', error);
    return { exists: false, accounts: [], error: error.message };
  }
};

/**
 * Development utility to quickly set up test environment
 * Call this in development console to seed database
 */
export const setupTestEnvironment = async () => {
  console.log('🚀 Setting up test environment...');
  
  try {
    // Check if accounts already exist
    const { exists, accounts } = await checkTestAccountsExist();
    
    if (exists) {
      console.log('✅ Test accounts already exist:', accounts.length);
      console.log('📋 Existing accounts:', accounts);
      return { success: true, message: 'Test accounts already exist', accounts };
    }

    // Create accounts
    const results = await createTestAccounts();
    
    return {
      success: true,
      message: 'Test environment setup complete',
      results
    };

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    return {
      success: false,
      message: 'Failed to setup test environment',
      error: error.message
    };
  }
};

// Export for use in development console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.testAccountUtils = {
    createTestAccounts,
    deleteTestAccounts,
    checkTestAccountsExist,
    setupTestEnvironment
  };
  
  console.log('🧪 Test account utilities available at window.testAccountUtils');
}
