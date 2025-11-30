const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndSubmission() {
  try {
    console.log('🔐 Testing authentication and submission flow...');
    
    // First, let's try creating a user via auth.signUp
    console.log('\n1️⃣ Creating authenticated test user...');
    const testEmail = 'test.student@gmail.com';
    const testPassword = 'testpassword123';
    
    // Try to sign up a new user
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'student'
        }
      }
    });
    
    if (signupError && signupError.message.includes('already registered')) {
      console.log('📧 User already exists, trying to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        return;
      }
      console.log('✅ Successfully signed in existing user');
    } else if (signupError) {
      console.error('❌ Signup error:', signupError);
      return;
    } else {
      console.log('✅ New user created and authenticated');
    }
    
    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Could not get authenticated user:', userError);
      return;
    }
    
    console.log('👤 Authenticated user:', { id: user.id, email: user.email });
    
    // Now try to create a user record in the users table
    console.log('\n2️⃣ Creating user record in users table...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!existingUser) {
      const { data: newUser, error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          display_name: 'Test Student',
          role: 'student'
        })
        .select()
        .single();
      
      if (userInsertError) {
        console.error('❌ Error creating user record:', userInsertError);
        return;
      }
      console.log('✅ User record created:', newUser);
    } else {
      console.log('✅ User record already exists:', existingUser);
    }
    
    // Now try to insert a submission
    console.log('\n3️⃣ Creating test submission...');
    const { data: submission, error: submissionError } = await supabase
      .from('submission_csv')
      .insert({
        user_id: user.id,
        test_type: 'Aptitude Test',
        score: 28,
        total_questions: 30,
        time_taken: 1500,
        answers: [{ question: 1, answer: 'A', correct: true }],
        status: 'completed'
      })
      .select()
      .single();
    
    if (submissionError) {
      console.error('❌ Submission error:', submissionError);
      return;
    }
    
    console.log('✅ Test submission created:', submission);
    
    // Test the admin dashboard query
    console.log('\n4️⃣ Testing admin dashboard query...');
    const { data: adminQuery, error: adminError } = await supabase
      .from('submission_csv')
      .select(`
        *,
        users!inner(
          email,
          display_name,
          role
        )
      `)
      .order('submitted_at', { ascending: false });
    
    if (adminError) {
      console.error('❌ Admin query error:', adminError);
    } else {
      console.log(`✅ Admin query success: ${adminQuery.length} submissions found`);
      if (adminQuery.length > 0) {
        console.log('📋 Sample submission with user data:');
        console.log(JSON.stringify(adminQuery[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testAuthAndSubmission();
