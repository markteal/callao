import React, { useState } from 'react';
import { LogIn, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showSessionExpiredMessage, setShowSessionExpiredMessage] = useState(false);
  const { login, isLoading } = useAuth();

  // Check if we should show session expired message
  React.useEffect(() => {
    // Check if user was previously logged in (has user data but no token)
    const savedUser = localStorage.getItem('callao_user');
    const hasToken = localStorage.getItem('callao_token');
    
    if (savedUser && !hasToken) {
      // User was logged in before but token is gone - session expired
      setShowSessionExpiredMessage(true);
    }

    // Also check URL params for explicit session expired flag
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sessionExpired') === 'true') {
      setShowSessionExpiredMessage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setShowSessionExpiredMessage(false);

    if (!username || !password) {
      setLoginError('Please enter both username and password');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setLoginError('Invalid credentials. Please check your username and password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Callao</h1>
          <p className="text-white/80">Personal Cloud File Server</p>
        </div>

        {/* Session Expired Message - Only show when applicable */}
        {showSessionExpiredMessage && (
          <div className="mb-6 bg-warning-500/20 border border-warning-400/30 text-warning-100 px-4 py-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Session Expired</p>
                <p className="text-sm mt-1">Your session has expired due to inactivity. Please log in again to continue.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="bg-error-500/20 border border-error-400/30 text-error-100 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginForm;