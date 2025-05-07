import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import type { RefreshTokenResponse } from '$lib/types/auth';
import { refreshTokenApi, getUserProfile } from '$lib/api/auth';
import { jwtDecode } from 'jwt-decode';
import type { USER_ROLE_ENUM } from '$lib/types/auth';

// Token expiration times (in seconds)
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// Cookie options
const secureCookie = import.meta.env.PROD;
const sameSite = 'strict';
const path = '/';

interface DecodedToken {
  roles: Array<{ authority: string }>;
  sub: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token and extract roles
 */
function decodeToken(accessToken: string): { username: string; roles: string[] } {
  const decoded = jwtDecode<DecodedToken>(accessToken);
  
  // Extract roles from the token and remove ROLE_ prefix
  const roles = decoded.roles.map(role => role.authority.replace('ROLE_', ''));

  return {
    username: decoded.sub,
    roles
  };
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, expirySeconds: number): void {
  if (!browser) return;
  
  const date = new Date();
  date.setTime(date.getTime() + expirySeconds * 1000);
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${name}=${value};${expires};path=${path};sameSite=${sameSite};secure=${secureCookie}`;
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  if (!browser) return null;
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  if (!browser) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
}

/**
 * Save access token to cookie and update user info
 */
export function saveAccessToken(accessToken: string, userId: string = '', email: string = ''): void {
  // Decode token to get roles
  const { username, roles } = decodeToken(accessToken);
  
  // Save access token to cookie
  setCookie('accessToken', accessToken, ACCESS_TOKEN_EXPIRY);
  
  // Update auth store with user info
  authStore.setUser({
    userId,
    username,
    email,
    roles
  });
}

/**
 * Save refresh token to cookie
 */
export function saveRefreshToken(refreshToken: string): void {
  setCookie('refreshToken', refreshToken, REFRESH_TOKEN_EXPIRY);
}

/**
 * Save both tokens to cookies
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  saveAccessToken(accessToken);
  saveRefreshToken(refreshToken);
}

/**
 * Clear tokens from cookies and auth state
 */
export function clearTokens(): void {
  // Clear from store
  authStore.clearAuth();
  
  // Clear from cookies
  deleteCookie('accessToken');
  deleteCookie('refreshToken');
}

// Track refresh token promise to avoid multiple parallel calls
let refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
// Track whether we're in a refresh token flow
let isRefreshing = false;

/**
 * Refresh tokens using the refresh token API
 * Returns a promise with the new tokens
 */
export async function refreshTokens(): Promise<RefreshTokenResponse> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshTokenPromise) {
    return refreshTokenPromise;
  }
  
  isRefreshing = true;
  
  try {
    // Get refresh token from cookie
    const refreshToken = getCookie('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Create a new promise for the refresh token call
    refreshTokenPromise = refreshTokenApi(refreshToken);
    
    // Wait for the response
    const response = await refreshTokenPromise;
    
    // Save the new tokens
    saveAccessToken(response.accessToken);
    saveRefreshToken(response.refreshToken);

    // Fetch user profile to get complete user info
    try {
      const userProfile = await getUserProfile();
      authStore.setUser(userProfile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
    
    return response;
  } catch (error) {
    // If refresh fails, clear tokens and throw error
    clearTokens();
    throw error;
  } finally {
    // Reset the promise and flag
    refreshTokenPromise = null;
    isRefreshing = false;
  }
}

/**
 * Check if we need to refresh the token on app startup
 * Returns a promise that resolves when token check is complete
 */
export async function checkAndRefreshTokenOnStartup(): Promise<void> {
  if (!browser) return;
  
  // Check if we have a refresh token in cookies
  const refreshToken = getCookie('refreshToken');
  
  // Set initial loading state
  authStore.setLoading(true);
  
  if (refreshToken) {
    try {
      // Try to refresh token to get a new access token
      await refreshTokens();
    } catch (error) {
      console.error('Failed to refresh token on startup:', error);
      clearTokens();
    }
  }
  
  // Finished loading
  authStore.setLoading(false);
}