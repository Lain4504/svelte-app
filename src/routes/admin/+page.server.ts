import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/api/auth';
import axios from 'axios';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
  // Get access token from cookie
  const accessToken = cookies.get('accessToken');
  
  if (!accessToken) {
    throw redirect(302, '/login?returnUrl=/admin');
  }

  try {
    // Get user profile from API using fetch to maintain cookie context
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    const user = await response.json();
    
    // Check if user has admin role
    const hasAdminRole = user.roles.includes('ADMIN_ROLE_ENUM');
    
    if (!hasAdminRole) {
      throw redirect(302, '/unauthorized');
    }

    return {
      user
    };
  } catch (error) {
    console.error('Error checking admin access:', error);
    // Clear invalid token
    cookies.delete('accessToken', { path: '/' });
    throw redirect(302, '/login?returnUrl=/admin');
  }
}; 