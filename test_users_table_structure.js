const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableStructure() {
  try {
    console.log('🔍 Testing submission_csv_with_users table structure...');
    
    // Check if there are any records
    const { data, error } = await supabase
      .from('submission_csv_with_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying submission_csv_with_users:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Found record in submission_csv_with_users');
      console.log('📋 Available fields:', Object.keys(data[0]));
      console.log('👤 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check specifically for name-related fields
      const nameFields = Object.keys(data[0]).filter(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('display') ||
        key.toLowerCase().includes('user')
      );
      console.log('🏷️  Name-related fields found:', nameFields);
      
    } else {
      console.log('📭 No records found in submission_csv_with_users table');
      
      // Check the table structure by looking at columns
      console.log('🔍 Checking if table exists by attempting to describe it...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('submission_csv_with_users')
        .select('*')
        .limit(0);
      
      if (tableError) {
        console.error('❌ Table might not exist:', tableError);
      } else {
        console.log('✅ Table exists but has no data');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testTableStructure();
