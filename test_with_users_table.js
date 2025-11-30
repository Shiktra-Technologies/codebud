const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithUsersTable() {
  try {
    console.log('🔍 Testing submission_csv_with_users table...');
    
    const { data, error } = await supabase
      .from('submission_csv_with_users')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying submission_csv_with_users:', error);
      
      // If that fails, let's check if the table/view exists by listing tables
      console.log('\n🔍 Checking available tables...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%submission%');
      
      if (!tablesError && tables) {
        console.log('📋 Available submission-related tables:', tables.map(t => t.table_name));
      }
    } else {
      console.log(`✅ submission_csv_with_users query successful: ${data.length} records found`);
      
      if (data.length > 0) {
        console.log('📋 Sample record from submission_csv_with_users:');
        console.log(JSON.stringify(data[0], null, 2));
        
        console.log('\n🔑 Available columns in submission_csv_with_users:');
        console.log(Object.keys(data[0]).join(', '));
      } else {
        console.log('�� No records found in submission_csv_with_users');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testWithUsersTable();
