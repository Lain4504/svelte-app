import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { refreshTokens, ACCESS_TOKEN_EXPIRY } from './tokenUtils';
import { get } from 'svelte/store';

let refreshInterval: ReturnType<typeof setInterval> | null = null;

// Calculate refresh time (80% of token expiry)
const REFRESH_TIME = (ACCESS_TOKEN_EXPIRY * 0.8) * 1000;

/**
 * Start automatic token refresh
 */
export function startAutoRefresh(): void {
  if (!browser) return;
  
  // Clear any existing interval
  stopAutoRefresh();
  
  // Set up new interval
  refreshInterval = setInterval(async () => {
    if (get(authStore).isAuthenticated) {
      try {
        await refreshTokens();
      } catch (error) {
        console.error('Auto refresh token failed:', error);
      }
    }
  }, REFRESH_TIME);
}

/**
 * Stop automatic token refresh
 */
export function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
} 