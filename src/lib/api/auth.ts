import axios from 'axios';
import type { LoginResponse, RefreshTokenResponse } from '$lib/types/auth';
import type {User} from '$lib/stores/authStore';
import { apiClient } from './client';

// Create API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Login API function
 */
export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });
  
  return response.data;
}

/**
 * Refresh token API function
 */
export async function refreshTokenApi(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await axios.post<RefreshTokenResponse>(`${API_BASE_URL}/auth/refresh-token`, {
    refreshToken
  });
  
  return response.data;
}

/**
 * Get user profile API function
 */
export async function getUserProfile(): Promise<User> {
  const response = await apiClient.get('/auth/me');
  
  // Đảm bảo dữ liệu trả về khớp với cấu trúc User interface
  // Chuyển đổi dữ liệu từ API thành đúng định dạng User
  const userData = response.data;
  
  // Kiểm tra và đảm bảo các trường bắt buộc tồn tại
  const user: User = {
    userId: userData.id || userData.userId || '',
    username: userData.username || '',
    email: userData.email || '',
    roles: userData.roles || []
  };
  
  // Debug để kiểm tra dữ liệu
  console.log('User data from API:', userData);
  console.log('Converted user object:', user);
  
  return user;
}

/**
 * Logout function
 */
export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}