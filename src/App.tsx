import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { useAuth } from './hooks/useAuth';
import { useActivity } from './contexts/ActivityContext';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import ServerStatus from './components/Dashboard/ServerStatus';
import ActivityLog from './components/Dashboard/ActivityLog';
import FileExplorer from './components/FileManager/FileExplorer';
import TransferProgress from './components/FileManager/TransferProgress';
import ServerSettings from './components/Settings/ServerSettings';
import StorageAnalytics from './components/Analytics/StorageAnalytics';
import UserManagement from './components/UserManagement/UserManagement';
import api from './services/api';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const activityTracker = useActivity();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Set up activity tracker in API service
  React.useEffect(() => {
    if (activityTracker) {
      api.setActivityTracker(activityTracker);
    }
  }, [activityTracker]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading Callao...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ServerStatus />
              <ActivityLog />
            </div>
            <TransferProgress />
          </div>
        );
      case 'files':
        return (
          <div className="space-y-6">
            <FileExplorer />
            <TransferProgress />
          </div>
        );
      case 'activity':
        return <ActivityLog />;
      case 'storage':
        return <StorageAnalytics />;
      case 'settings':
        return <ServerSettings />;
      case 'users':
        return user?.role === 'admin' ? (
          <UserManagement />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <p className="text-neutral-600 text-lg">Admin access required</p>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <p className="text-neutral-600 text-lg">Page not found</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Header onNavigate={setActiveTab} />
      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ActivityProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ActivityProvider>
  );
};

export default App;