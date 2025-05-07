<script lang="ts">
  import { graphqlQuery } from '$lib/api/client';
  import { isAuthenticated } from '$lib/auth/tokenUtils';
  import { onMount } from 'svelte';

  export let novelId: string;
  
  let interaction = {
    inWishlist: false,
    hasFollowing: false,
    hasRating: false,
    createdAt: null
  };
  let loading = false;
  let error: string | null = null;
  let hasFetched = false;
  let retryCount = 0;
  const MAX_RETRIES = 2;

  const USER_NOVEL_INTERACTION = `
    query userNovelInteraction($novelId: ID!) {
      userNovelInteraction(novelId: $novelId) {
        inWishlist
        hasFollowing
        hasRating
        createdAt
      }
    }
  `;

  async function fetchInteraction() {
    loading = true;
    error = null;
    
    try {
      // Check authentication before making request
      if (!isAuthenticated()) {
        error = 'You must be logged in to view interactions';
        loading = false;
        return;
      }
      
      console.log(`Fetching novel interaction for novel ID: ${novelId}`);
      const result = await graphqlQuery<{
        userNovelInteraction: typeof interaction
      }>(USER_NOVEL_INTERACTION, {
        novelId
      });
      
      if (result && result.userNovelInteraction) {
        interaction = result.userNovelInteraction;
        hasFetched = true;
        retryCount = 0; // Reset retry count on success
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Failed to fetch novel interaction:', err);
      
      // Handle authentication errors with retry
      if (err.message?.includes('Not authenticated') || 
          err.response?.status === 401 || 
          err.code === '401') {
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Authentication error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          retryCount++;
          // Wait a moment before retrying
          setTimeout(() => {
            loading = false;
            fetchInteraction();
          }, 1000);
          return;
        } else {
          error = 'Authentication failed. Please try logging in again.';
        }
      } else {
        error = 'Failed to load novel interaction';
      }
    } finally {
      loading = false;
    }
  }

  function removeData() {
    interaction = {
      inWishlist: false,
      hasFollowing: false,
      hasRating: false,
      createdAt: null
    };
    hasFetched = false;
    error = null;
    retryCount = 0;
  }
  
  // Optional: Auto-fetch on mount if needed
  // onMount(() => {
  //   if (isAuthenticated()) {
  //     fetchInteraction();
  //   }
  // });
</script>

<div class="bg-white shadow rounded-lg p-4">
  <h3 class="text-lg font-medium text-gray-900 mb-4">Novel Interaction</h3>
  
  {#if !hasFetched}
    <div class="text-center py-4 text-gray-500">
      Click the button below to fetch novel interaction data
    </div>
  {:else if loading}
    <div class="flex items-center justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {:else}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-gray-600">In Wishlist:</span>
        <span class="font-medium">{interaction.inWishlist ? 'Yes' : 'No'}</span>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Following:</span>
        <span class="font-medium">{interaction.hasFollowing ? 'Yes' : 'No'}</span>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Has Rating:</span>
        <span class="font-medium">{interaction.hasRating ? 'Yes' : 'No'}</span>
      </div>
      
      {#if interaction.createdAt}
        <div class="flex items-center justify-between">
          <span class="text-gray-600">Created At:</span>
          <span class="font-medium">{new Date(interaction.createdAt).toLocaleString()}</span>
        </div>
      {/if}
    </div>
  {/if}
  
  <div class="mt-4 space-y-2">
    <button
      on:click={fetchInteraction}
      class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      disabled={loading}
    >
      {#if !hasFetched}
        Fetch Interaction
      {:else if loading}
        Loading...
      {:else}
        Refresh Interaction
      {/if}
    </button>

    {#if hasFetched}
      <button
        on:click={removeData}
        class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Remove Data
      </button>
    {/if}
  </div>
</div>