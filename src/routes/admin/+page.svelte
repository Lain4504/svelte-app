<script lang="ts">
  import { onMount } from 'svelte';
  import { requireAuth } from '$lib/constants/authMiddleware';
  import { authStore } from '$lib/stores/authStore';
  import { USER_ROLE_ENUM } from '$lib/types/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import UserTable from '$lib/components/UserTable.svelte';

  // Protect this route with authentication middleware
  onMount(() => {
    if (browser) {
      requireAuth();
    }
  });

  // Search state
  let searchText = '';
</script>

<div class="min-h-screen bg-gray-100">
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <span class="text-xl font-semibold">Admin Panel</span>
        </div>
        <div class="flex items-center">
          {#if $authStore.user}
            <span class="mr-4 text-gray-700">
              Welcome, {$authStore.user.username}!
            </span>
            <button
              on:click={() => goto('/dashboard')}
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Dashboard
            </button>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <div class="py-10">
    <header>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <UserTable bind:searchText />
      </div>
    </main>
  </div>
</div>