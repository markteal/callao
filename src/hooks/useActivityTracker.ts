import { useState, useEffect, useCallback } from 'react';
import { ActivityLog } from '../types';

interface ActivityTracker {
  activities: ActivityLog[];
  addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getRecentActivities: (limit?: number) => ActivityLog[];
}

export const useActivityTracker = (): ActivityTracker => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Load activities from localStorage on mount
  useEffect(() => {
    const savedActivities = localStorage.getItem('callao_activities');
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        const validActivities = parsed.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        setActivities(validActivities);
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    }
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('callao_activities', JSON.stringify(activities));
    }
  }, [activities]);

  const addActivity = useCallback((activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setActivities(prev => {
      // Add new activity and keep only the last 100 activities for performance
      const updated = [newActivity, ...prev].slice(0, 100);
      return updated;
    });
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
    localStorage.removeItem('callao_activities');
  }, []);

  const getRecentActivities = useCallback((limit: number = 50) => {
    return activities.slice(0, limit);
  }, [activities]);

  return {
    activities,
    addActivity,
    clearActivities,
    getRecentActivities
  };
};

// Global activity tracker instance
let globalActivityTracker: ReturnType<typeof useActivityTracker> | null = null;

export const getGlobalActivityTracker = () => {
  return globalActivityTracker;
};

export const setGlobalActivityTracker = (tracker: ReturnType<typeof useActivityTracker>) => {
  globalActivityTracker = tracker;
};