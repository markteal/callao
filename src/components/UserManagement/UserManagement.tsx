import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  Key,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useUserManagement } from '../../hooks/useUserManagement';
import { User as UserType } from '../../types';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteUserModal from './DeleteUserModal';

const UserManagement: React.FC = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword
  } = useUserManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (userData: {
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'user';
  }) => {
    const success = await createUser(userData);
    if (success) {
      setShowCreateModal(false);
      fetchUsers();
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<UserType>) => {
    const success = await updateUser(userId, userData);
    if (success) {
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    const success = await changePassword(userId, newPassword);
    if (success) {
      setChangingPasswordUser(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      setDeletingUser(null);
      fetchUsers();
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Shield className="w-4 h-4 text-warning-600" />
    ) : (
      <User className="w-4 h-4 text-neutral-600" />
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <span className="px-2 py-1 text-xs font-medium bg-warning-100 text-warning-700 rounded-full">
        Admin
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full">
        User
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-success-100 text-success-700 rounded-full">
        <CheckCircle className="w-3 h-3" />
        <span>Active</span>
      </span>
    ) : (
      <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-error-100 text-error-700 rounded-full">
        <XCircle className="w-3 h-3" />
        <span>Inactive</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-error-600 text-lg font-medium">Error loading users</p>
          <p className="text-neutral-600 mt-2">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">User Management</h2>
              <p className="text-sm text-neutral-600">Manage admin and user accounts</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 text-lg">No users found</p>
            <p className="text-neutral-500 text-sm">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first user to get started'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{user.username}</p>
                        <p className="text-sm text-neutral-600 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-sm text-neutral-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-sm text-neutral-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(user.lastLogin)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChangingPasswordUser(user)}
                        className="p-2 text-neutral-500 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                        title="Change Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="p-2 text-neutral-500 hover:text-error-600 hover:bg-error-100 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {filteredUsers.length > 0 && (
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <div className="flex items-center space-x-4">
              <span>
                {users.filter(u => u.role === 'admin').length} Admins
              </span>
              <span>
                {users.filter(u => u.isActive).length} Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onConfirm={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onConfirm={(userData) => handleUpdateUser(editingUser.id, userData)}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {changingPasswordUser && (
        <ChangePasswordModal
          user={changingPasswordUser}
          onConfirm={(newPassword) => handleChangePassword(changingPasswordUser.id, newPassword)}
          onCancel={() => setChangingPasswordUser(null)}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onConfirm={() => handleDeleteUser(deletingUser.id)}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;