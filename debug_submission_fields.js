const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSubmissionFields() {
  try {
    console.log('🔍 1. Checking regular submission_csv table...');
    const { data: csvData, error: csvError } = await supabase
      .from('submission_csv')
      .select('*')
      .limit(3);
    
    if (csvError) {
      console.log('❌ Error with submission_csv:', csvError.message);
    } else {
      console.log(`📊 Found ${csvData.length} records in submission_csv`);
      if (csvData.length > 0) {
        console.log('🔍 Sample submission_csv record fields:', Object.keys(csvData[0]));
        console.log('📄 Sample record:', csvData[0]);
      }
    }
    
    console.log('\n🔍 2. Checking submission_csv_with_users view...');
    const { data: viewData, error: viewError } = await supabase
      .from('submission_csv_with_users')
      .select('*')
      .limit(3);
    
    if (viewError) {
      console.log('❌ Error with submission_csv_with_users:', viewError.message);
    } else {
      console.log(`📊 Found ${viewData.length} records in submission_csv_with_users`);
      if (viewData.length > 0) {
        console.log('�� Sample submission_csv_with_users record fields:', Object.keys(viewData[0]));
        console.log('👤 User name field value:', viewData[0].user_name);
        console.log('📧 User email field value:', viewData[0].user_email);
        console.log('📄 Sample record:', viewData[0]);
      }
    }
    
    console.log('\n🔍 3. Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error with users:', usersError.message);
    } else {
      console.log(`👤 Found ${usersData.length} users in users table`);
      usersData.forEach(user => {
        console.log(`  • ${user.display_name || 'No name'} (${user.email || 'No email'}) - ${user.role || 'No role'}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugSubmissionFields();
