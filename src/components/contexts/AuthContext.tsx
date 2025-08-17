import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../supabaseClient'; 
import { Session, User, AuthChangeEvent, SignInWithPasswordCredentials } from '@supabase/supabase-js';

// Define the shape of the context value
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (credentials: SignInWithPasswordCredentials) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin role check - for simplicity, we assume the admin is identified by a specific email
// stored in your environment variables. This is a secure approach.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (credentials: SignInWithPasswordCredentials) => {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    isAuthenticated: !!session, // User is authenticated if a session exists
    isAdmin: !!session && session.user.email === ADMIN_EMAIL, // Check if the logged-in user is the admin
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};