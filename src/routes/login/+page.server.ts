import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Get access token from cookie
  const accessToken = cookies.get('accessToken');
  
  // If user is already authenticated, redirect to dashboard
  if (accessToken) {
    throw redirect(302, '/dashboard');
  }

  return {};
}; 