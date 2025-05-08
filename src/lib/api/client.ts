import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore';
import { refreshTokens, clearTokens, getAccessToken, isTokenValid } from '$lib/auth/tokenUtils';
import { browser } from '$app/environment';
import { TokenRefreshError } from '$lib/auth/TokenRefreshManager';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql';

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms

// Create axios instance for RESTful API
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create axios instance for GraphQL API
export const graphqlClient: AxiosInstance = axios.create({
  baseURL: GRAPHQL_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Sleep function for retry delay
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process GraphQL error response to check for authentication errors
 */
const isGraphQLAuthError = (response: AxiosResponse): boolean => {
  const errors = response.data?.errors || [];
  return errors.some((error: any) => 
    error.extensions?.code === 'UNAUTHENTICATED' || 
    error.message?.toLowerCase().includes('not authenticated')
  );
};

/**
 * Add auth token to request headers if available
 */
const addAuthHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (!browser) return config;
  
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
};

/**
 * Retry a request with exponential backoff
 */
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = MAX_RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's not an auth error
      if (!(error instanceof TokenRefreshError)) {
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, i) * RETRY_DELAY);
    }
  }
  
  throw lastError;
}

/**
 * Handle response error with token refresh and retry logic
 */
const handleResponseError = async (
  error: AxiosError,
  client: AxiosInstance,
  isGraphQL = false
): Promise<any> => {
  if (!browser) return Promise.reject(error);
  
  console.log('Handling response error:', error);
  const originalRequest: any = error.config;
  
  if (!originalRequest) {
    console.error('No original request config found in error object');
    return Promise.reject(error);
  }
  
  // Skip if already retried too many times
  if (originalRequest._retry >= MAX_RETRY_ATTEMPTS) {
    console.log('Max retry attempts reached');
    return Promise.reject(error);
  }
  
  // Initialize retry counter if not set
  if (originalRequest._retry === undefined) {
    originalRequest._retry = 0;
  }
  
  // Check for authentication errors
  let isAuthError = error.response?.status === 401;
  
  // For GraphQL, also check error message in response data
  if (isGraphQL && error.response) {
    isAuthError = isAuthError || isGraphQLAuthError(error.response as AxiosResponse);
  }
  
  console.log('Is auth error:', isAuthError);
  
  if (isAuthError) {
    try {
      console.log('Attempting to refresh token...');
      // Increment retry counter
      originalRequest._retry += 1;
      
      // Try to refresh token
      await refreshTokens();
      
      // Update authentication header with new token
      const token = getAccessToken();
      if (!token || !isTokenValid(token)) {
        throw new TokenRefreshError('Invalid token after refresh', 'REFRESH_FAILED');
      }
      
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      
      console.log('Retrying original request with new token...');
      // Retry the original request with exponential backoff
      return retryRequest(() => client(originalRequest));
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      // If refresh token fails, clear auth and reject
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
  
  // For other errors, just reject
  return Promise.reject(error);
};

// Add request interceptors to both clients
[apiClient, graphqlClient].forEach(client => {
  client.interceptors.request.use(addAuthHeader, Promise.reject);
});

// Add response interceptors for REST client
apiClient.interceptors.response.use(
  response => response,
  error => handleResponseError(error, apiClient, false)
);

// Add response interceptors for GraphQL client
graphqlClient.interceptors.response.use(
  response => {
    // Check for GraphQL errors in the response data
    if (response.data?.errors) {
      const error = response.data.errors[0];
      console.log('GraphQL Error detected in response:', error);
      
      if (error.extensions?.code === 'UNAUTHENTICATED' || 
          error.message?.toLowerCase().includes('not authenticated')) {
        console.log('Detected authentication error in GraphQL response, triggering refresh...');
        
        // Create a proper Axios error
        const axiosError = new axios.AxiosError(
          error.message,
          '401',
          response.config,
          null,
          {
            message: error.message,
            code: '401',
            config: response.config,
            response: {
              status: 401,
              statusText: 'Unauthorized',
              data: response.data,
              headers: response.headers,
              config: response.config
            }
          }
        );
        
        // Set the response on the AxiosError
        axiosError.response = {
          status: 401,
          statusText: 'Unauthorized',
          data: response.data,
          headers: response.headers,
          config: response.config
        } as any;
        
        // Make sure handleResponseError is called with the proper parameters
        return handleResponseError(axiosError, graphqlClient, true)
          .catch(err => {
            console.error('GraphQL auth error handling failed:', err);
            throw axiosError; // Return the original error if refresh attempt fails
          });
      }
    }
    
    return response;
  },
  error => {
    console.log('GraphQL Error Interceptor received error:', error);
    return handleResponseError(error, graphqlClient, true);
  }
);

/**
 * Generic GraphQL query function
 */
export async function graphqlQuery<T>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  try {
    console.log(`Executing GraphQL query with ${Object.keys(variables).length} variables`);
    
    const response = await graphqlClient.post('', {
      query,
      variables
    });
    
    // Check for GraphQL errors in the response
    if (response.data.errors) {
      const errorMessage = response.data.errors[0].message;
      console.error('GraphQL error in response:', errorMessage);
      throw new Error(errorMessage);
    }
    
    return response.data.data as T;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    throw error;
  }
}

/**
 * Generic GraphQL mutation function
 */
export async function graphqlMutation<T>(
  mutation: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  return graphqlQuery<T>(mutation, variables);
}