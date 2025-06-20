import React, { createContext, useContext, ReactNode } from 'react';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { ActivityLog } from '../types';

interface ActivityContextType {
  activities: ActivityLog[];
  addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getRecentActivities: (limit?: number) => ActivityLog[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

interface ActivityProviderProps {
  children: ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const activityTracker = useActivityTracker();

  return (
    <ActivityContext.Provider value={activityTracker}>
      {children}
    </ActivityContext.Provider>
  );
};