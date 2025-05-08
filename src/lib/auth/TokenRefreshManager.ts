import { refreshTokenApi } from '$lib/api/auth';
import { getCookie, saveTokens, REFRESH_TOKEN_COOKIE } from './tokenUtils';
import type { RefreshTokenResponse } from '$lib/types/auth';

export class TokenRefreshError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_REFRESH_TOKEN' | 'REFRESH_FAILED' | 'NETWORK_ERROR',
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

export class TokenRefreshManager {
  private static instance: TokenRefreshManager;
  private refreshPromise: Promise<RefreshTokenResponse> | null = null;
  private refreshInProgress = false;
  private lastRefreshTime = 0;
  private readonly MIN_REFRESH_INTERVAL = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  async refresh(): Promise<RefreshTokenResponse> {
    // Prevent too frequent refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshTime < this.MIN_REFRESH_INTERVAL) {
      if (this.refreshPromise) {
        return this.refreshPromise;
      }
    }

    if (this.refreshInProgress) {
      return this.refreshPromise!;
    }

    this.refreshInProgress = true;
    this.lastRefreshTime = now;

    try {
      const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
      if (!refreshToken) {
        throw new TokenRefreshError(
          'No refresh token available',
          'NO_REFRESH_TOKEN'
        );
      }

      this.refreshPromise = refreshTokenApi(refreshToken);
      const response = await this.refreshPromise;
      saveTokens(response.accessToken, response.refreshToken);
      return response;
    } catch (error) {
      if (error instanceof TokenRefreshError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof Error && error.message.includes('network')) {
        throw new TokenRefreshError(
          'Network error during token refresh',
          'NETWORK_ERROR',
          error
        );
      }
      
      // Handle other errors
      throw new TokenRefreshError(
        'Failed to refresh token',
        'REFRESH_FAILED',
        error
      );
    } finally {
      this.refreshInProgress = false;
    }
  }
} 