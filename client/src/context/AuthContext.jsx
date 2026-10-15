import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { db } from '../database/db';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('vmcare_user') || localStorage.getItem('ashaseva_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('vmcare_auth_token') || localStorage.getItem('ashaseva_auth_token') || null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If deviceId doesn't exist, create one
    if (!localStorage.getItem('vmcare_device_id')) {
      const devId = localStorage.getItem('ashaseva_device_id') || ('tablet-rural-' + Math.random().toString(36).substring(2, 9));
      localStorage.setItem('vmcare_device_id', devId);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const userData = res.data || res.user;
      const authToken = res.data?.token || res.accessToken || res.token;

      if (userData && authToken) {
        const fullUser = { ...userData, token: authToken };
        setUser(fullUser);
        setToken(authToken);
        localStorage.setItem('vmcare_user', JSON.stringify(fullUser));
        localStorage.setItem('vmcare_auth_token', authToken);
        await db.settings.put({ key: 'cachedUser', value: fullUser });
        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid response from server' };
    } catch (error) {
      // If offline, check if matches cached user
      const cached = localStorage.getItem('vmcare_user') || localStorage.getItem('ashaseva_user');
      if (cached && error.isOffline) {
        const parsed = JSON.parse(cached);
        if (parsed.email.toLowerCase() === email.toLowerCase()) {
          setUser(parsed);
          return { success: true, offlineNotice: true };
        }
      }
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role = 'admin') => {
    setLoading(true);
    let email = 'admin@ruralcare.local';
    let password = 'AdminPass123';
    let defaultUser = {
      id: 'demo-admin',
      name: 'VMcare Admin',
      email: 'admin@ruralcare.local',
      role: 'admin',
      token: 'demo-jwt-token-admin'
    };

    if (role === 'worker') {
      email = 'worker@ruralcare.local';
      password = 'WorkerPass123';
      defaultUser = {
        id: 'demo-worker',
        name: 'Anitha (VMcare Health Worker)',
        email: 'worker@ruralcare.local',
        role: 'health_worker',
        village: 'Kaveri Nagar',
        token: 'demo-jwt-token-worker'
      };
    } else if (role === 'doctor') {
      email = 'doctor@ruralcare.local';
      password = 'DoctorPass123';
      defaultUser = {
        id: 'demo-doctor',
        name: 'Dr. S. Ramanathan (PHC Medical Officer)',
        email: 'doctor@ruralcare.local',
        role: 'doctor',
        village: 'Primary Health Centre',
        token: 'demo-jwt-token-doctor'
      };
    }

    try {
      const res = await login(email, password);
      if (res.success) return res;
      // If server returned non-success, fallback to offline demo session
      setUser(defaultUser);
      setToken(defaultUser.token);
      localStorage.setItem('vmcare_user', JSON.stringify(defaultUser));
      localStorage.setItem('vmcare_auth_token', defaultUser.token);
      return { success: true, offlineNotice: true };
    } catch {
      setUser(defaultUser);
      setToken(defaultUser.token);
      localStorage.setItem('vmcare_user', JSON.stringify(defaultUser));
      localStorage.setItem('vmcare_auth_token', defaultUser.token);
      return { success: true, offlineNotice: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vmcare_user');
    localStorage.removeItem('vmcare_auth_token');
    localStorage.removeItem('ashaseva_user');
    localStorage.removeItem('ashaseva_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
