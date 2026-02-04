import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { authAPI } from './utils/api';
import { Toaster, toast } from 'sonner@2.0.3';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminDashboard from './components/AdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import ManagerDashboard from './components/ManagerDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  position?: string;
  dutyType?: string;
  baseSalary?: number;
}

interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  prices: {
    petrol: number;
    diesel: number;
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'admin' | 'worker' | 'manager'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const response = await authAPI.verifySession();
          const data = response.data;
          
          setUser(data.user);
          setStation(data.station);
          setToken(await user.getIdToken());
          setCurrentPage(data.user.role === 'admin' ? 'admin' : data.user.position === 'manager' ? 'manager' : 'worker');
        } catch (error) {
          console.error('Session verification failed:', error);
        }
      } else {
        setUser(null);
        setStation(null);
        setToken(null);
        setCurrentPage('landing');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: User, stationData: Station, authToken: string, loginType?: string) => {
    setUser(userData);
    setStation(stationData);
    setToken(authToken);
    
    if (userData.role === 'admin') {
      setCurrentPage('admin');
    } else if (loginType === 'manager' || userData.position === 'manager') {
      setCurrentPage('manager');
    } else {
      setCurrentPage('worker');
    }
    
    toast.success(`Welcome back, ${userData.name}!`);
  };

  const handleRegister = () => {
    setCurrentPage('login');
    toast.success('Registration successful! Please login.');
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setStation(null);
      setToken(null);
      setCurrentPage('landing');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      {currentPage === 'landing' && (
        <LandingPage 
          onGetStarted={() => setCurrentPage('register')} 
          onLogin={() => setCurrentPage('login')} 
        />
      )}
      {currentPage === 'login' && (
        <LoginPage 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setCurrentPage('register')} 
        />
      )}
      {currentPage === 'register' && (
        <RegisterPage 
          onRegister={handleRegister} 
          onSwitchToLogin={() => setCurrentPage('login')} 
        />
      )}
      {currentPage === 'admin' && user && station && token && (
        <AdminDashboard 
          user={user} 
          station={station} 
          token={token} 
          onLogout={handleLogout} 
        />
      )}
      {currentPage === 'manager' && user && station && token && (
        <ManagerDashboard 
          user={user} 
          station={station} 
          token={token} 
          onLogout={handleLogout} 
        />
      )}
      {currentPage === 'worker' && user && station && token && (
        <WorkerDashboard 
          user={user} 
          station={station} 
          token={token} 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}
