<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  
  function goToLogin() {
    goto('/login');
  }
  
  function goToDashboard() {
    goto('/dashboard');
  }
  
  function goToAdmin() {
    goto('/admin');
  }
</script>

<div class="min-h-screen bg-gray-100">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center">
      <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
        <span class="block xl:inline">Authentication Demo</span>
        <span class="block text-indigo-600 xl:inline">with Svelte</span>
      </h1>
      <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        Testing the authentication system with automatic token refresh, role-based access control, and persistence.
      </p>
      
      <div class="mt-10">
        {#if $authStore.isAuthenticated}
          <div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  You are logged in as {$authStore.user?.username}
                </h3>
              </div>
            </div>
          </div>
          
          <div class="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
            <button
              on:click={goToDashboard}
              class="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 sm:px-8"
            >
              Go to Dashboard
            </button>
            <button
              on:click={goToAdmin}
              class="flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-50 sm:px-8"
            >
              Admin Panel
            </button>
          </div>
        {:else}
          <div class="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-1 sm:gap-5">
            <button
              on:click={goToLogin}
              class="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 sm:px-8"
            >
              Log in to Test
            </button>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="mt-12 bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg leading-6 font-medium text-gray-900">
          Authentication Features
        </h2>
        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Access Token in Store
              </h3>
              <div class="mt-2 text-sm text-gray-500">
                <p>
                  Access token is stored only in the Svelte store for better security.
                  It's not persisted in cookies.
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Refresh Token in Cookies
              </h3>
              <div class="mt-2 text-sm text-gray-500">
                <p>
                  Refresh token is stored only in HTTP-only cookies, not in the store.
                  It persists even after browser restart.
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Automatic Token Refresh
              </h3>
              <div class="mt-2 text-sm text-gray-500">
                <p>
                  The system will automatically refresh tokens before they expire.
                  It also handles 401 errors from REST APIs and UNAUTHENTICATED errors from GraphQL.
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Role-Based Access Control
              </h3>
              <div class="mt-2 text-sm text-gray-500">
                <p>
                  Different pages require different roles.
                  The admin page requires ADMIN role, while the dashboard just requires authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>