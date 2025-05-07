import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { authStore, hasRole } from '$lib/stores/authStore';
import type { UserRoles } from '$lib/types/auth';

/**
 * Redirects to the login page with a return URL
 */
export function redirectToLogin(returnUrl?: string): void {
  const url = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
  goto(url);
}

/**
 * Middleware that requires authentication
 * Returns true if authenticated, otherwise redirects and returns false
 */
export function requireAuth(returnUrl?: string): boolean {
  const { isAuthenticated, isLoading } = get(authStore);
  
  // If still loading auth state, allow access for now
  if (isLoading) {
    return true;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    redirectToLogin(returnUrl);
    return false;
  }
  
  return true;
}

/**
 * Middleware that requires specific role
 * Returns true if has required role, otherwise redirects and returns false
 */
export function requireRole(role: UserRoles, returnUrl?: string): boolean {
  // First check if authenticated
  if (!requireAuth(returnUrl)) {
    return false;
  }
  
  const { user } = get(authStore);
  console.log('Current user:', user);
  console.log('Required role:', role);
  console.log('User roles:', user?.roles);
  
  const hasRequiredRole = user?.roles.includes(role);
  console.log('Has required role:', hasRequiredRole);
  
  // If doesn't have the required role, redirect to unauthorized page
  if (!hasRequiredRole) {
    goto('/unauthorized');
    return false;
  }
  
  return true;
}

/**
 * Middleware that requires any of the specified roles
 * Returns true if has any of the required roles, otherwise redirects and returns false
 */
export function requireAnyRole(roles: UserRoles[], returnUrl?: string): boolean {
  // First check if authenticated
  if (!requireAuth(returnUrl)) {
    return false;
  }
  
  // Check if user has any of the required roles
  const { user } = get(authStore);
  const hasAnyRequiredRole = roles.some(role => user?.roles.includes(role));
  
  // If doesn't have any of the required roles, redirect to unauthorized page
  if (!hasAnyRequiredRole) {
    goto('/unauthorized');
    return false;
  }
  
  return true;
}