// Test Login Credentials Configuration
// This file contains pre-configured test accounts for easy testing

export const TEST_ACCOUNTS = {
  STUDENTS: [
    {
      email: 'student1@test.com',
      password: 'test123',
      displayName: 'John Smith',
      role: 'student',
      profile: {
        rollNumber: 'STU001',
        class: '12A',
        section: 'Computer Science'
      }
    },
    {
      email: 'student2@test.com',
      password: 'test123',
      displayName: 'Jane Doe',
      role: 'student',
      profile: {
        rollNumber: 'STU002',
        class: '12B',
        section: 'Information Technology'
      }
    },
    {
      email: 'student3@test.com',
      password: 'test123',
      displayName: 'Mike Johnson',
      role: 'student',
      profile: {
        rollNumber: 'STU003',
        class: '11A',
        section: 'Computer Applications'
      }
    }
  ],
  ADMINS: [
    {
      email: 'admin1@test.com',
      password: 'admin123',
      displayName: 'Prof. Sarah Wilson',
      role: 'admin',
      profile: {
        department: 'Computer Science',
        employeeId: 'ADMIN001',
        privileges: ['view_students', 'manage_tests', 'generate_reports']
      }
    },
    {
      email: 'admin2@test.com',
      password: 'admin123',
      displayName: 'Dr. Robert Davis',
      role: 'admin',
      profile: {
        department: 'Information Technology',
        employeeId: 'ADMIN002',
        privileges: ['view_students', 'manage_tests', 'generate_reports']
      }
    }
  ],
  SUPER_ADMIN: {
    secretCode: 'admin@2024',
    displayName: 'System Administrator',
    role: 'super_admin'
  }
};

// Quick access helper functions for testing
export const getStudentCredentials = (index = 0) => {
  const student = TEST_ACCOUNTS.STUDENTS[index];
  return {
    email: student.email,
    password: student.password,
    role: 'student'
  };
};

export const getAdminCredentials = (index = 0) => {
  const admin = TEST_ACCOUNTS.ADMINS[index];
  return {
    email: admin.email,
    password: admin.password,
    role: 'admin'
  };
};

export const getSuperAdminCredentials = () => {
  return {
    secretCode: TEST_ACCOUNTS.SUPER_ADMIN.secretCode,
    role: 'super_admin'
  };
};

// Testing utilities
export const TEST_UTILITIES = {
  // Quick login function for testing
  quickLogin: async (type = 'student', index = 0) => {
    if (type === 'student') {
      return getStudentCredentials(index);
    } else if (type === 'admin') {
      return getAdminCredentials(index);
    } else if (type === 'super_admin') {
      return getSuperAdminCredentials();
    }
  },

  // Get all test emails (useful for cleanup)
  getAllTestEmails: () => {
    return [
      ...TEST_ACCOUNTS.STUDENTS.map(s => s.email),
      ...TEST_ACCOUNTS.ADMINS.map(a => a.email)
    ];
  }
};

// Instructions for using test accounts
export const TESTING_INSTRUCTIONS = {
  student: {
    credentials: TEST_ACCOUNTS.STUDENTS[0],
    instructions: [
      '1. Go to the login page',
      '2. Select "Student" login type',
      '3. Use email: student1@test.com',
      '4. Use password: test123',
      '5. You will be redirected to the student dashboard'
    ]
  },
  admin: {
    credentials: TEST_ACCOUNTS.ADMINS[0],
    instructions: [
      '1. Go to the login page',
      '2. Select "Admin" login type',
      '3. Use email: admin1@test.com',
      '4. Use password: admin123',
      '5. You will be redirected to the admin dashboard'
    ]
  },
  super_admin: {
    credentials: TEST_ACCOUNTS.SUPER_ADMIN,
    instructions: [
      '1. Go to the login page',
      '2. Click on "Super Admin" (may need to click a toggle)',
      '3. Use secret code: admin@2024',
      '4. You will be redirected to the super admin dashboard'
    ]
  }
};
