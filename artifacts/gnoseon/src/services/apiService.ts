const API_BASE_URL = '/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response;
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  }

  async register(username: string, password: string, displayName?: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    });

    const data = await response.json();
    return data;
  }

  async logout(userId: string) {
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Users
  async getUsers() {
    const response = await this.request('/users');
    return response.json();
  }

  async getUser(userId: string) {
    const response = await this.request(`/users/${userId}`);
    return response.json();
  }

  async updateUserProfile(userId: string, updates: { bio?: string; status?: string }) {
    const response = await this.request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  async deleteAccount(userId: string, password: string) {
    const response = await this.request(`/users/${userId}/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    return response.json();
  }

  // Chats
  async getChats(userId: string) {
    const response = await this.request(`/chats/${userId}`);
    return response.json();
  }

  async getMessages(userId1: string, userId2: string) {
    const response = await this.request(`/messages/${userId1}/${userId2}`);
    return response.json();
  }

  async searchMessages(query: string, userId?: string) {
    const params = new URLSearchParams({ q: query });
    if (userId) params.append('userId', userId);
    const response = await this.request(`/messages/search?${params.toString()}`);
    return response.json();
  }

  // Groups
  async getGroups(userId: string) {
    const response = await this.request(`/groups/${userId}`);
    return response.json();
  }

  async getGroupMessages(groupId: string) {
    const response = await this.request(`/groups/${groupId}/messages`);
    return response.json();
  }

  async createGroup(name: string, description: string, createdBy: string) {
    const response = await this.request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description, createdBy }),
    });
    return response.json();
  }

  // Health check
  async healthCheck() {
    const response = await this.request('/health');
    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
