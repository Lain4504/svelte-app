import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import axios from 'axios';

// Define the API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const GET: RequestHandler = async ({ request }) => {
  // Check for Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Extract the token
  const token = authHeader.split(' ')[1];
  
  try {
    // Forward the request to the real API with the same authorization header
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Return the user data from the real API
    return json(response.data);
  } catch (error: any) {
    console.error('Error verifying token:', error.message);
    
    // If the API returns 401, forward that status
    if (error.response?.status === 401) {
      return new Response(JSON.stringify({ 
        error: error.response.data?.message || 'Invalid or expired token' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // For other errors, return a generic error
    return new Response(JSON.stringify({ 
      error: 'Failed to authenticate user' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};