import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up session timeout callback - NO POPUP, just silent logout
    api.setSessionTimeoutCallback(() => {
      console.log('Session timeout callback triggered - silent logout');
      setUser(null);
      // Don't show any popup - the login form will handle the message
    });

    // Check for existing session
    const savedUser = api.getCurrentUser();
    const hasToken = api.isAuthenticated();
    
    console.log('Auth check - Saved user:', savedUser);
    console.log('Auth check - Has token:', hasToken);
    
    if (savedUser && hasToken) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', username);
      const result = await api.login(username, password);
      
      console.log('Login result:', result);
      
      if (result.success && result.user) {
        const newUser: User = {
          id: result.user.id?.toString() || '1',
          username: result.user.username,
          email: result.user.email || `${result.user.username}@callao.local`,
          role: result.user.role || 'admin',
          createdAt: new Date(),
          lastLogin: new Date(),
          isActive: true,
        };
        
        console.log('Setting user:', newUser);
        setUser(newUser);
        
        // Track successful login activity
        const activityTracker = api.getActivityTracker();
        if (activityTracker) {
          activityTracker.addActivity({
            user: newUser.username,
            action: 'login',
            target: 'System',
            status: 'success',
            details: `User ${newUser.username} logged in successfully`
          });
        }
        
        setIsLoading(false);
        return true;
      }
      
      console.log('Login failed - no user data');
      
      // Track failed login activity
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        activityTracker.addActivity({
          user: username,
          action: 'login_failed',
          target: 'System',
          status: 'error',
          details: `Failed login attempt for user ${username}`
        });
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Track login error activity
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        activityTracker.addActivity({
          user: username,
          action: 'login_error',
          target: 'System',
          status: 'error',
          details: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Track logout activity
    if (user) {
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        activityTracker.addActivity({
          user: user.username,
          action: 'logout',
          target: 'System',
          status: 'success',
          details: `User ${user.username} logged out`
        });
      }
    }
    
    api.logout();
    setUser(null);
  };

  const isAuthenticated = !!user && api.isAuthenticated();
  
  console.log('Auth state - User:', user);
  console.log('Auth state - Is authenticated:', isAuthenticated);
  console.log('Auth state - Is loading:', isLoading);

  return {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
  };
};

export { AuthContext };