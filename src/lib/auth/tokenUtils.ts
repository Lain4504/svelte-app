import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import type { RefreshTokenResponse } from '$lib/types/auth';
import { refreshTokenApi, getUserProfile } from '$lib/api/auth';
import { jwtDecode } from 'jwt-decode';
import type { USER_ROLE_ENUM } from '$lib/types/auth';

// Constants
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Cookie names
const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

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
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
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
  // Save access token to cookie
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_EXPIRY);
  
  // Decode token to get roles
  const { username, roles } = decodeToken(accessToken);
  
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
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_EXPIRY);
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
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
}

// Track refresh token promise to avoid multiple parallel calls
let refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
// Track whether we're in a refresh token flow
let isRefreshing = false;

/**
 * Load user info from API and update store
 */
async function loadUserInfo(): Promise<void> {
  try {
    const userProfile = await getUserProfile();
    if (userProfile) {
      authStore.setUser(userProfile);
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
    // If we can't get user profile, try to get basic info from token
    const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
    if (accessToken) {
      const { username, roles } = decodeToken(accessToken);
      authStore.setUser({
        userId: '',
        username,
        email: '',
        roles
      });
    }
  }
}

/**
 * Check if we need to refresh the token on app startup
 * Returns a promise that resolves when token check is complete
 */
export async function checkAndRefreshTokenOnStartup(): Promise<void> {
  if (!browser) return;
  
  // Set initial loading state
  authStore.setLoading(true);
  
  try {
    // Check if we have an access token
    const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
    const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
    
    if (accessToken && refreshToken) {
      // Try to load user info first
      await loadUserInfo();
      
      // Then try to refresh token
      try {
        await refreshTokens();
      } catch (error) {
        console.error('Failed to refresh token on startup:', error);
        clearTokens();
      }
    } else {
      clearTokens();
    }
  } catch (error) {
    console.error('Error during startup:', error);
    clearTokens();
  } finally {
    // Finished loading
    authStore.setLoading(false);
  }
}

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
    const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
    
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

    // Load full user info
    await loadUserInfo();
    
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

// Function to handle login
export async function handleLogin(username: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { accessToken, refreshToken, userId, email } = await response.json();

    // Save tokens and user info
    saveAccessToken(accessToken, userId, email);
    saveRefreshToken(refreshToken);

    return { success: true };
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error };
  }
}

// Function to handle logout
export function handleLogout() {
  // Clear cookies
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);

  // Clear auth store
  authStore.clearAuth();
}

// Function to get the current access token
export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

// Function to check if user is authenticated
export function isAuthenticated(): boolean {
  if (!browser) return false;
  return !!getCookie(ACCESS_TOKEN_COOKIE);
}