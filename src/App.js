import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProctorProvider } from './context/ProctorContext';
import PermissionPage from './components/PermissionPage';
import ProblemList from './components/ProblemList';
import ProblemSolver from './components/ProblemSolver';
import SubmissionPage from './components/SubmissionPage';
import './App.css';

function App() {
  return (
    <ProctorProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<PermissionPage />} />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problem/:id" element={<ProblemSolver />} />
            <Route path="/submitted" element={<SubmissionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ProctorProvider>
  );
}

export default App;
