<script lang="ts">
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { queryClient } from '$lib/query/config';
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { ACCESS_TOKEN_EXPIRY, checkAndRefreshTokenOnStartup, refreshTokens } from '$lib/auth/tokenUtils';
	import { getUserProfile } from '$lib/api/auth';
	import { authStore } from '$lib/stores/authStore';
	import { browser } from '$app/environment';

	// Set up automatic token refresh
	let refreshTokenInterval: NodeJS.Timeout | null = null;
	
	onMount(async () => {
		if (browser) {
			try {
				// Check for existing refresh token in cookies on app startup
				// This will attempt to refresh the token and get a new access token
				await checkAndRefreshTokenOnStartup();
				
				// If we have an access token but no user data, try to fetch the user profile
				const { user, isAuthenticated } = $authStore;
				if (isAuthenticated && !user) {
					try {
						const userProfile = await getUserProfile();
						authStore.setUser(userProfile);
					} catch (error) {
						console.error('Failed to fetch user profile:', error);
					}
				}
				
				// Set up automatic token refresh at regular intervals
				// We'll refresh the token at 80% of its lifetime to ensure it doesn't expire
				const refreshTime = (ACCESS_TOKEN_EXPIRY * 0.8) * 1000;
				
				refreshTokenInterval = setInterval(async () => {
					const { isAuthenticated } = $authStore;
					if (isAuthenticated) {
						try {
							await refreshTokens();
						} catch (error) {
							console.error('Auto refresh token failed:', error);
						}
					}
				}, refreshTime);
			} catch (error) {
				console.error('Error during app initialization:', error);
			}
		}
	});
	
	onDestroy(() => {
		// Clean up the interval when the component is destroyed
		if (refreshTokenInterval) {
			clearInterval(refreshTokenInterval);
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<slot />
	{#if browser && import.meta.env.DEV}
		<SvelteQueryDevtools initialIsOpen={false} />
	{/if}
</QueryClientProvider>
