<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { getAccessToken } from '$lib/auth/tokenUtils';
  import { browser } from '$app/environment';
  import { jwtDecode } from 'jwt-decode';

  let timeLeft = 0;
  let timerInterval: NodeJS.Timeout;

  // Function to get expiration time from token
  function getExpirationTime(token: string): number {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      return Math.max(0, Math.floor((expirationTime - currentTime) / 1000)); // Convert to seconds
    } catch (error) {
      console.error('Error decoding token:', error);
      return 0;
    }
  }

  // Function to update time left
  function updateTimeLeft() {
    const token = getAccessToken();
    if (token) {
      timeLeft = getExpirationTime(token);
    } else {
      timeLeft = 0;
    }
  }

  onMount(() => {
    if (browser) {
      // Initial update
      updateTimeLeft();

      // Update timer every second
      timerInterval = setInterval(() => {
        if ($authStore.isAuthenticated) {
          timeLeft--;
          
          // If time is up, clear interval
          if (timeLeft <= 0) {
            clearInterval(timerInterval);
          }
        }
      }, 1000);
    }
  });

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  // Format time remaining as MM:SS
  $: formattedTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get color based on time remaining
  $: timerColor = timeLeft <= 60 ? 'text-red-500' : 'text-green-500';
</script>

{#if $authStore.isAuthenticated}
  <div class="flex items-center space-x-2">
    <span class="text-sm text-gray-600">Token expires in:</span>
    <span class={`text-sm font-medium ${timerColor}`}>
      {formattedTime()}
    </span>
  </div>
{/if} 