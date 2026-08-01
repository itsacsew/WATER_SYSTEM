// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserData } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Function to attempt auto-login from stored credentials
  const attemptAutoLogin = async () => {
    try {
      const savedEmail = localStorage.getItem('autoLoginEmail');
      const savedPassword = localStorage.getItem('autoLoginPassword');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      if (rememberMe && savedEmail && savedPassword) {
        console.log('🔄 Attempting auto-login for:', savedEmail);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
          console.log('✅ Auto-login successful!');
          
          // Update last login
          try {
            const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');
            await updateDoc(doc(db, 'users', userCredential.user.uid), {
              lastLogin: serverTimestamp()
            });
          } catch (e) {
            console.log('Could not update lastLogin:', e);
          }
          
          return userCredential.user;
        } catch (error) {
          console.log('❌ Auto-login failed:', error.message);
          // Clear invalid credentials
          localStorage.removeItem('autoLoginEmail');
          localStorage.removeItem('autoLoginPassword');
          localStorage.removeItem('rememberMe');
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error attempting auto-login:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        // User is already logged in
        setUser(currentUser);
        const result = await getUserData(currentUser.uid);
        if (result.success) {
          setUserData(result.data);
        }
        setLoading(false);
        setAutoLoginAttempted(true);
      } else {
        // No user, try auto-login
        if (!autoLoginAttempted) {
          const autoUser = await attemptAutoLogin();
          if (autoUser) {
            setUser(autoUser);
            const result = await getUserData(autoUser.uid);
            if (result.success) {
              setUserData(result.data);
            }
            setLoading(false);
            setAutoLoginAttempted(true);
            return;
          }
        }
        // No user and auto-login failed or not attempted
        setUser(null);
        setUserData(null);
        setLoading(false);
        setAutoLoginAttempted(true);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    refreshUser: async () => {
      if (user) {
        const result = await getUserData(user.uid);
        if (result.success) {
          setUserData(result.data);
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};