<script lang="ts">
  import { onMount } from 'svelte';
  import { requireAuth } from '$lib/constants/authMiddleware';
  import { authStore } from '$lib/stores/authStore';
  import { logoutApi } from '$lib/api/auth';
  import { clearTokens } from '$lib/auth/tokenUtils';
  import { goto } from '$app/navigation';
  import { USER_ROLE_ENUM } from '$lib/types/auth';
  import TokenTimer from '$lib/components/TokenTimer.svelte';
  import NovelInteraction from '$lib/components/NovelInteraction.svelte';

  // Protect this route with authentication middleware
  onMount(() => {
    requireAuth();
  });
  
  async function handleLogout() {
    try {
      // Call logout API
      await logoutApi();
      // Clear tokens from both store and cookies
      clearTokens();
      // Redirect to login page
      goto('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API fails, clear tokens locally
      clearTokens();
      goto('/login');
    }
  }

  function goToAdmin() {
    goto('/admin');
  }
</script>

<div class="min-h-screen bg-gray-100">
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <span class="text-xl font-semibold">Dashboard</span>
        </div>
        <div class="flex items-center">
          {#if $authStore.user}
            <span class="mr-4 text-gray-700">
              Welcome, {$authStore.user.username}!
            </span>
            <TokenTimer />
            {#if $authStore.user.roles.includes(USER_ROLE_ENUM.ADMIN)}
              <button
                on:click={goToAdmin}
                class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Admin Panel
              </button>
            {/if}
            <button
              on:click={handleLogout}
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          {/if}
        </div>
      </div>
    </div>
  </nav>
  
  <div class="py-10">
    <header>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h2 class="text-lg font-medium text-gray-900">User Information</h2>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Personal details and application data.
              </p>
            </div>
            <div class="border-t border-gray-200">
              <dl>
                {#if $authStore.user}
                  <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Username</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {$authStore.user.username}
                    </dd>
                  </div>
                  <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Email address</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {$authStore.user.email}
                    </dd>
                  </div>
                  <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">User ID</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {$authStore.user.userId}
                    </dd>
                  </div>
                  {#if $authStore.user.roles}
                  <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Roles</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {$authStore.user.roles.join(', ')}
                    </dd>
                  </div>
                  {/if}
                {/if}
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Access Token Status</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {$authStore.isAuthenticated ? 'Valid' : 'Not Available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <NovelInteraction novelId="661f0e3f4f1b2c6f9f123456" />
        </div>
      </div>
    </main>
  </div>
</div>