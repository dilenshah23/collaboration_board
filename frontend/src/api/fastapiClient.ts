import axios from 'axios';
import type { Card, CreateCardData, UpdateCardData } from './types';

const FASTAPI_API_URL = import.meta.env.VITE_FASTAPI_API_URL || 'http://localhost:8001';

const fastapiClient = axios.create({
  baseURL: FASTAPI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

fastapiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const cardAPI = {
  list: async (boardId: number): Promise<Card[]> => {
    const response = await fastapiClient.get<Card[]>(`/api/boards/${boardId}/cards`);
    return response.data;
  },

  create: async (boardId: number, data: CreateCardData): Promise<Card> => {
    const response = await fastapiClient.post<Card>(`/api/boards/${boardId}/cards`, data);
    return response.data;
  },

  get: async (cardId: number): Promise<Card> => {
    const response = await fastapiClient.get<Card>(`/api/cards/${cardId}`);
    return response.data;
  },

  update: async (cardId: number, data: UpdateCardData): Promise<Card> => {
    const response = await fastapiClient.patch<Card>(`/api/cards/${cardId}`, data);
    return response.data;
  },

  delete: async (cardId: number): Promise<void> => {
    await fastapiClient.delete(`/api/cards/${cardId}`);
  },

  assignUser: async (cardId: number, userId: number): Promise<void> => {
    await fastapiClient.post(`/api/cards/${cardId}/assign`, { user_id: userId });
  },

  unassignUser: async (cardId: number, userId: number): Promise<void> => {
    await fastapiClient.delete(`/api/cards/${cardId}/assign/${userId}`);
  },
};

export default fastapiClient;
