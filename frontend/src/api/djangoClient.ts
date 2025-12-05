import axios from 'axios';
import type { 
  AuthTokens, 
  LoginCredentials, 
  RegisterData, 
  User,
  Workspace,
  CreateWorkspaceData,
  Board,
  CreateBoardData 
} from './types';

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000';

const djangoClient = axios.create({
  baseURL: DJANGO_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

djangoClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

djangoClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${DJANGO_API_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return djangoClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await djangoClient.post<User>('/api/auth/register/', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await djangoClient.post<AuthTokens>('/api/auth/login/', credentials);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await djangoClient.post('/api/auth/logout/', { refresh_token: refreshToken });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await djangoClient.get<User>('/api/auth/me/');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await djangoClient.post<{ access: string }>('/api/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

export const workspaceAPI = {
  list: async (): Promise<Workspace[]> => {
    const response = await djangoClient.get<Workspace[]>('/api/workspaces/');
    return response.data;
  },

  create: async (data: CreateWorkspaceData): Promise<Workspace> => {
    const response = await djangoClient.post<Workspace>('/api/workspaces/', data);
    return response.data;
  },

  get: async (id: number): Promise<Workspace> => {
    const response = await djangoClient.get<Workspace>(`/api/workspaces/${id}/`);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateWorkspaceData>): Promise<Workspace> => {
    const response = await djangoClient.patch<Workspace>(`/api/workspaces/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await djangoClient.delete(`/api/workspaces/${id}/`);
  },

  addMember: async (workspaceId: number, userId: number, role: 'admin' | 'member'): Promise<void> => {
    await djangoClient.post(`/api/workspaces/${workspaceId}/members/`, {
      user_id: userId,
      role,
    });
  },

  removeMember: async (workspaceId: number, userId: number): Promise<void> => {
    await djangoClient.delete(`/api/workspaces/${workspaceId}/members/${userId}/`);
  },
};

export const boardAPI = {
  list: async (workspaceId: number): Promise<Board[]> => {
    const response = await djangoClient.get<Board[]>(`/api/workspaces/${workspaceId}/boards/`);
    return response.data;
  },

  create: async (workspaceId: number, data: CreateBoardData): Promise<Board> => {
    const response = await djangoClient.post<Board>(
      `/api/workspaces/${workspaceId}/boards/create/`,
      data
    );
    return response.data;
  },

  get: async (id: number): Promise<Board> => {
    const response = await djangoClient.get<Board>(`/api/boards/${id}/`);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateBoardData>): Promise<Board> => {
    const response = await djangoClient.patch<Board>(`/api/boards/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await djangoClient.delete(`/api/boards/${id}/`);
  },
};

export default djangoClient;
