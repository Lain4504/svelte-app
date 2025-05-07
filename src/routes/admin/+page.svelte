<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';
  
  // Get user data from server
  export let data;
  
  // Update auth store with user data from server
  onMount(() => {
    if (data.user) {
      authStore.setUser(data.user);
    }
  });
  
  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<div class="min-h-screen bg-gray-100">
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <span class="text-xl font-semibold">Admin Panel</span>
        </div>
        <div class="flex items-center">
          <button
            on:click={goToDashboard}
            class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="py-10">
    <header>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Admin Panel
        </h1>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h2 class="text-lg font-medium text-gray-900">Admin Functions</h2>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              These functions are only available to administrators.
            </p>
          </div>
          <div class="border-t border-gray-200">
            <div class="px-4 py-5">
              <p class="text-gray-700">
                This page is protected with role-based access control.
                Only users with the ADMIN role can access this page.
              </p>
              
              <div class="mt-6 grid grid-cols-1 gap-4">
                <div class="p-4 bg-green-50 rounded-md">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-green-800">
                        Authentication successful!
                      </h3>
                      <div class="mt-2 text-sm text-green-700">
                        <p>
                          You have successfully authenticated with the ADMIN role.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>