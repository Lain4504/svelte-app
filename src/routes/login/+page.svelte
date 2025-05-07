<script lang="ts">
  import { goto } from '$app/navigation';
  import { loginApi } from '$lib/api/auth';
  import { authStore } from '$lib/stores/authStore';
  import { saveAccessToken, saveRefreshToken } from '$lib/auth/tokenUtils';
  import { onMount } from 'svelte';
  
  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  
  // Get return URL from query parameters if available
  let returnUrl = '';
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    returnUrl = urlParams.get('returnUrl') || '/dashboard';
  }
  
  // Check authentication on mount
  onMount(() => {
    if ($authStore.isAuthenticated) {
      goto(returnUrl);
    }
  });
  
  async function handleLogin() {
    if (!email || !password) {
      error = 'Please enter both email and password';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Call login API
      const response = await loginApi(email, password);
      
      // Store refresh token in cookie only
      saveRefreshToken(response.refreshToken);
      
      // Save access token and decode roles with user info
      saveAccessToken(response.accessToken, response.userId, response.email);
      
      // Redirect to return URL or dashboard
      goto(returnUrl);
    } catch (err: any) {
      error = err.response?.data?.message || 'Login failed. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex justify-center items-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-center text-gray-900">Login</h1>
    
    {#if error}
      <div class="p-3 text-sm text-red-700 bg-red-100 rounded-md">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="email"
          type="text"
          bind:value={email}
          class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading}
          class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </form>
  </div>
</div>