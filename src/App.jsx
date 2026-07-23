// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BillHistory from './pages/BillHistory';
import Sidebar from './components/common/Sidebar';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {/* Sidebar will be conditionally rendered inside routes or globally */}
          <div className="app-layout">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <SidebarLayout>
                      <Dashboard />
                    </SidebarLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bills"
                element={
                  <ProtectedRoute>
                    <SidebarLayout>
                      <BillHistory />
                    </SidebarLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1a1a2e',
                border: '1px solid #4a90d9',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4a90d9',
                  secondary: '#ffffff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

// Layout component for pages with Sidebar
const SidebarLayout = ({ children }) => {
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default App;