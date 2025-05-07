import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { UserRoles } from '$lib/types/auth';

// Define user type
export interface User {
    userId: string;
    username: string;
    email: string;
    roles: UserRoles[];
}

// Authentication state
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Initial state
const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
};

// Create the writable store
const createAuthStore = () => {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        // Set user info
        setUser: (user: User) => {
            update(state => ({
                ...state,
                user,
                isAuthenticated: true,
                isLoading: false
            }));
        },
        // Clear auth state (logout)
        clearAuth: () => {
            set(initialState);
        },
        // Set loading state
        setLoading: (isLoading: boolean) => {
            update(state => ({
                ...state,
                isLoading
            }));
        }
    };
};

// Create the auth store
export const authStore = createAuthStore();

// Derived store for checking if user has specific role
export const hasRole = (role: UserRoles) => {
    return derived(authStore, $authStore => {
        return $authStore.user?.roles?.includes(role) || false;
    });
};

// Derived store for checking if user is authenticated
export const isAuthenticated = derived(authStore, $authStore => $authStore.isAuthenticated);