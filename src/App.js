import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SimpleAuthProvider } from './context/SimpleAuthContext';
import { ProctorProvider } from './context/ProctorContext';
import AuthPage from './components/AuthPage';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/Profile';
import PermissionPage from './components/PermissionPage';
import AptitudeTest from './components/AptitudeTest';
import ProblemList from './components/ProblemList';
import ProblemSolver from './components/ProblemSolver';
import SubmissionPage from './components/SubmissionPage';
import ActivityTracker from './components/ActivityTracker';
import CSVForwardingTest from './components/CSVForwardingTest';
import './App.css';

function App() {
  return (
    <SimpleAuthProvider>
      <ProctorProvider>
        <Router>
          <div className="App">
            <Navbar />
            <ActivityTracker />
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/student" element={
                <PrivateRoute requireRole="student">
                  <StudentDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute requireRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/super-admin" element={
                <PrivateRoute requireRole="super_admin">
                  <SuperAdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/permission/:testType" element={
                <PrivateRoute requirePermission="canTakeTests">
                  <PermissionPage />
                </PrivateRoute>
              } />
              <Route path="/aptitude-test" element={
                <PrivateRoute requirePermission="canTakeTests">
                  <AptitudeTest />
                </PrivateRoute>
              } />
              <Route path="/problems" element={
                <PrivateRoute requirePermission="canViewProblems">
                  <ProblemList />
                </PrivateRoute>
              } />
              <Route path="/problem/:id" element={
                <PrivateRoute requirePermission="canSubmitSolutions">
                  <ProblemSolver />
                </PrivateRoute>
              } />
              <Route path="/submitted" element={
                <PrivateRoute requirePermission="canViewOwnResults">
                  <SubmissionPage />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/csv-test" element={
                <PrivateRoute requireRole="admin">
                  <CSVForwardingTest />
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ProctorProvider>
    </SimpleAuthProvider>
  );
}

export default App;
