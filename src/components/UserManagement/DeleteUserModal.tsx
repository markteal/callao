import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { User } from '../../types';

interface DeleteUserModalProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-error-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-error-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Delete User</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-warning-500 mt-0.5" />
            <div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Are you sure you want to delete this user?
              </h4>
              <div className="bg-neutral-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-neutral-700">
                  <strong>Username:</strong> {user.username}
                </p>
                <p className="text-sm text-neutral-700">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm text-neutral-700">
                  <strong>Role:</strong> {user.role}
                </p>
              </div>
              <div className="space-y-2 text-sm text-neutral-600">
                <p>This action will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Deactivate the user account</li>
                  <li>Invalidate all active sessions</li>
                  <li>Prevent future logins</li>
                  <li>Preserve activity logs for audit purposes</li>
                </ul>
              </div>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-warning-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-800">Admin User Warning</p>
                  <p className="text-sm text-warning-700">
                    You are deleting an admin user. Make sure there are other admin users available to manage the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;