# CodeBud Frontend

A React-based educational platform for aptitude testing and student management.

## Features

- **Student Dashboard**: Take aptitude tests and view results
- **Admin Dashboard**: Manage students, view submissions, and track real-time activity  
- **Role-based Authentication**: Separate access for students and admins
- **Real-time Activity**: Live tracking of user activity and submissions
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

- **Frontend**: React 18
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: CSS3 with modern design principles

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd codebud_frontend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create .env file with your Supabase credentials
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up database
- Go to your Supabase dashboard
- Run the SQL script from `QUICK_SETUP.sql` in the SQL Editor

5. Start the development server
```bash
npm start
```

## Build for Production

```bash
npm run build
```

The build files will be generated in the `build/` directory.

## Deployment

The app can be deployed to any static hosting service like:
- Netlify
- Vercel 
- GitHub Pages
- AWS S3 + CloudFront

## User Roles

- **Student**: Can take tests and view their results
- **Admin**: Can view all students, submissions, and real-time activity
- **Super Admin**: Full administrative access (use secret code: admin@2024)

## 🧪 Testing & Development

For easy testing and development, pre-configured test accounts are available:

### Quick Test Login
1. Go to the login page and click "🧪 Quick Test Login"
2. Select any test account and login instantly

### Manual Test Credentials
- **Student**: `student1@test.com` / `test123`
- **Admin**: `admin1@test.com` / `admin123`  
- **Super Admin**: Secret code `admin@2024`

📋 **[View Complete Testing Guide →](./TESTING_ACCOUNTS.md)**

*Note: Remove test accounts before production deployment*

## License

This project is licensed under the MIT License.
