import { ACCESS_TOKEN_EXPIRY } from './tokenUtils';

export class AdaptiveRefreshManager {
  private static instance: AdaptiveRefreshManager;
  private lastSuccessfulRefresh: number = 0;
  private consecutiveFailures: number = 0;
  private baseInterval: number = ACCESS_TOKEN_EXPIRY * 0.8 * 1000;
  private maxInterval: number = ACCESS_TOKEN_EXPIRY * 0.9 * 1000;
  private minInterval: number = ACCESS_TOKEN_EXPIRY * 0.5 * 1000;

  private constructor() {}

  static getInstance(): AdaptiveRefreshManager {
    if (!AdaptiveRefreshManager.instance) {
      AdaptiveRefreshManager.instance = new AdaptiveRefreshManager();
    }
    return AdaptiveRefreshManager.instance;
  }

  getNextRefreshInterval(): number {
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastSuccessfulRefresh;
    
    // If we've had failures, reduce the interval
    if (this.consecutiveFailures > 0) {
      return Math.max(
        this.minInterval,
        this.baseInterval / (this.consecutiveFailures + 1)
      );
    }
    
    // If refresh was successful, gradually increase interval
    return Math.min(
      this.maxInterval,
      this.baseInterval + (timeSinceLastRefresh * 0.1)
    );
  }

  onRefreshSuccess(): void {
    this.lastSuccessfulRefresh = Date.now();
    this.consecutiveFailures = 0;
  }

  onRefreshFailure(): void {
    this.consecutiveFailures++;
  }

  reset(): void {
    this.lastSuccessfulRefresh = 0;
    this.consecutiveFailures = 0;
  }
} 