import { useState } from 'react';
import { User } from '../types';
import api from '../services/api';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getUsers();
      
      const userList: User[] = response.users.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        email: user.email || `${user.username}@callao.local`,
        role: user.role || 'user',
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        lastLogin: user.last_login ? new Date(user.last_login) : null,
        isActive: user.is_active !== false
      }));
      
      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'user';
  }): Promise<boolean> => {
    try {
      await api.createUser(userData);
      return true;
    } catch (err) {
      console.error('Failed to create user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    try {
      await api.updateUser(userId, userData);
      return true;
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await api.deleteUser(userId);
      return true;
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      await api.changePassword(userId, newPassword);
      return true;
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
      return false;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword
  };
};