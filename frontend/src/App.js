import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import components
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import ExcursionList from './components/ExcursionList';
import ExcursionDetail from './components/ExcursionDetail';
import AddExcursion from './components/AddExcursion';
import ProfilePage from './components/ProfilePage';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
export const AuthContext = React.createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    handleAuthFragment();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthFragment = async () => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1];
      
      try {
        const response = await axios.post(`${API}/auth/profile`, {
          session_id: sessionId
        }, {
          withCredentials: true
        });
        
        setUser(response.data.user);
        // Clear fragment and redirect to home
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Auth error:', error);
      }
    }
  };

  const login = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/profile');
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <AuthProvider>
        <BrowserRouter>
          <Navigation />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/ausfluge" element={<ExcursionList />} />
              <Route path="/ausflug/:id" element={<ExcursionDetail />} />
              <Route path="/hinzufuegen" element={<AddExcursion />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;