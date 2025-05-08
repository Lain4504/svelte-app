import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { refreshTokens } from './tokenUtils';
import { get } from 'svelte/store';
import { AdaptiveRefreshManager } from './AdaptiveRefreshManager';

let refreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start automatic token refresh
 */
export function startAutoRefresh(): void {
  if (!browser) return;
  
  // Clear any existing interval
  stopAutoRefresh();
  
  const adaptiveManager = AdaptiveRefreshManager.getInstance();
  
  // Set up new interval with adaptive timing
  const scheduleNextRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(async () => {
      if (get(authStore).isAuthenticated) {
        try {
          await refreshTokens();
          // Schedule next refresh with adaptive timing
          scheduleNextRefresh();
        } catch (error) {
          console.error('Auto refresh token failed:', error);
          // On failure, schedule next refresh sooner
          scheduleNextRefresh();
        }
      }
    }, adaptiveManager.getNextRefreshInterval());
  };
  
  // Start the first refresh cycle
  scheduleNextRefresh();
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