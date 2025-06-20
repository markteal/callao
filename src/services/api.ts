// API service for communicating with the Python Callao server
const API_BASE_URL = 'http://localhost:11777';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

// Simplified request cache for frequently accessed data
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMs: number = 10000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

class CallaoAPI {
  private token: string | null = null;
  private sessionTimeoutCallback: (() => void) | null = null;
  private cache = new RequestCache();
  private activityTracker: any = null;

  constructor() {
    // Load saved token from localStorage
    this.token = localStorage.getItem('callao_token');
  }

  // Set callback for session timeout
  setSessionTimeoutCallback(callback: () => void) {
    this.sessionTimeoutCallback = callback;
  }

  // Set activity tracker for logging activities
  setActivityTracker(tracker: any) {
    this.activityTracker = tracker;
  }

  // Get activity tracker
  getActivityTracker() {
    return this.activityTracker;
  }

  // Handle session timeout
  private handleSessionTimeout() {
    console.log('Session expired - logging out user');
    this.logout();
    if (this.sessionTimeoutCallback) {
      this.sessionTimeoutCallback();
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; useCache?: boolean }
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${endpoint}`;
    
    // Check cache for GET requests only (and only for specific endpoints)
    if ((!options.method || options.method === 'GET') && 
        cacheOptions?.useCache !== false && 
        (endpoint.includes('/api/status') || endpoint.includes('/api/storage-stats'))) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${endpoint}`);
        return cached;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle session timeout (401 Unauthorized)
      if (response.status === 401) {
        this.handleSessionTimeout();
        throw new Error('Session expired. Please log in again.');
      }

      // Handle non-JSON responses (like file downloads)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response as any;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Cache only specific successful GET requests
      if ((!options.method || options.method === 'GET') && 
          cacheOptions?.useCache !== false &&
          (endpoint.includes('/api/status') || endpoint.includes('/api/storage-stats'))) {
        this.cache.set(cacheKey, data, cacheOptions?.ttl || 10000);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<{ success: boolean; user?: any; token?: string }> {
    try {
      const response = await this.request<ApiResponse>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }, { useCache: false });

      // Handle both old and new response formats
      if (response.success || response.token) {
        const token = response.token;
        const user = response.user;
        
        if (token) {
          this.token = token;
          localStorage.setItem('callao_token', token);
        }
        
        if (user) {
          localStorage.setItem('callao_user', JSON.stringify(user));
        }
        
        // Clear cache on login
        this.cache.clear();
        
        return { success: true, user, token };
      }

      return { success: false };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('callao_token');
    localStorage.removeItem('callao_user');
    this.cache.clear();
  }

  // Server status with light caching
  async getServerStatus(): Promise<any> {
    return this.request('/api/status', {}, { ttl: 5000 });
  }

  // Server management
  async restartServer(): Promise<ApiResponse> {
    const result = await this.request('/api/server/restart', {
      method: 'POST',
    }, { useCache: false });
    
    // Clear cache after restart
    this.cache.clear();
    return result;
  }

  // File operations - NO caching for file listings to avoid stale data
  async listFiles(path: string = ''): Promise<{ files: any[] }> {
    return this.request(`/api/files?path=${encodeURIComponent(path)}`, {}, { useCache: false });
  }

  async createFolder(path: string, name: string): Promise<ApiResponse> {
    const result = await this.request('/api/create-folder', {
      method: 'POST',
      body: JSON.stringify({ path, name }),
    }, { useCache: false });
    
    // Invalidate storage stats cache
    this.cache.invalidate('/api/storage-stats');
    
    return result;
  }

  async deleteItem(path: string): Promise<ApiResponse> {
    const result = await this.request('/api/delete', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }, { useCache: false });
    
    // Invalidate storage stats cache
    this.cache.invalidate('/api/storage-stats');
    
    return result;
  }

  async renameItem(oldPath: string, newName: string): Promise<ApiResponse> {
    return this.request('/api/rename', {
      method: 'POST',
      body: JSON.stringify({ old_path: oldPath, new_name: newName }),
    }, { useCache: false });
  }

  async downloadFile(path: string): Promise<Response> {
    return this.request(`/api/download${path}`, {}, { useCache: false });
  }

  async uploadFile(path: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          // Handle session timeout for uploads
          if (xhr.status === 401) {
            this.handleSessionTimeout();
            reject(new Error('Session expired. Please log in again.'));
            return;
          }

          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            // Invalidate storage stats cache after successful upload
            this.cache.invalidate('/api/storage-stats');
            resolve(response);
          } else {
            reject(new Error(response.error || `HTTP ${xhr.status}`));
          }
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/upload`);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  }

  // User management - NO caching for user data
  async getUsers(): Promise<{ users: any[] }> {
    return this.request('/api/users', {}, { useCache: false });
  }

  async createUser(userData: {
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'user';
  }): Promise<ApiResponse> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, { useCache: false });
  }

  async updateUser(userId: string, userData: any): Promise<ApiResponse> {
    return this.request(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }, { useCache: false });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/api/users/${userId}`, {
      method: 'DELETE',
    }, { useCache: false });
  }

  async changePassword(userId: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ user_id: parseInt(userId), new_password: newPassword }),
    }, { useCache: false });
  }

  // Activity logs - NO caching for real-time data
  async getActivityLogs(limit: number = 50, offset: number = 0): Promise<{ logs: any[] }> {
    return this.request(`/api/activity-logs?limit=${limit}&offset=${offset}`, {}, { useCache: false });
  }

  // Storage stats with light caching
  async getStorageStats(): Promise<any> {
    return this.request('/api/storage-stats', {}, { ttl: 15000 });
  }

  // Check if we have a valid token
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current user from localStorage
  getCurrentUser(): any {
    const userStr = localStorage.getItem('callao_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern: string): void {
    this.cache.invalidate(pattern);
  }
}

export const api = new CallaoAPI();
export default api;