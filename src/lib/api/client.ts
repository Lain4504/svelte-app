import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore';
import { refreshTokens, clearTokens } from '$lib/auth/tokenUtils';

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
    error.message?.includes('not authenticated')
  );
};

/**
 * Add auth token to request headers if available
 */
const addAuthHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const authState = get(authStore);
  
  if (authState.accessToken) {
    config.headers.Authorization = `Bearer ${authState.accessToken}`;
  }
  
  return config;
};

/**
 * Handle response error with token refresh and retry logic
 */
const handleResponseError = async (
  error: AxiosError,
  client: AxiosInstance,
  isGraphQL = false
): Promise<any> => {
  const originalRequest: any = error.config;
  
  // Skip if already retried too many times
  if (originalRequest._retry >= MAX_RETRY_ATTEMPTS) {
    return Promise.reject(error);
  }
  
  // Initialize retry counter if not set
  if (originalRequest._retry === undefined) {
    originalRequest._retry = 0;
  }
  
  // Check for authentication errors
  const isAuthError = 
    (error.response?.status === 401) || 
    (isGraphQL && isGraphQLAuthError(error.response as AxiosResponse));
  
  if (isAuthError) {
    try {
      // Increment retry counter
      originalRequest._retry += 1;
      
      // Add exponential backoff for retries
      await sleep(RETRY_DELAY * originalRequest._retry);
      
      // Refresh token
      await refreshTokens();
      
      // Update authentication header with new token
      const authState = get(authStore);
      originalRequest.headers.Authorization = `Bearer ${authState.accessToken}`;
      
      // Retry the original request
      return client(originalRequest);
    } catch (refreshError) {
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
  response => response,
  error => handleResponseError(error, graphqlClient, true)
);

/**
 * Generic GraphQL query function
 */
export async function graphqlQuery<T>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  const response = await graphqlClient.post('', {
    query,
    variables
  });
  
  // Check for GraphQL errors in the response
  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }
  
  return response.data.data as T;
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