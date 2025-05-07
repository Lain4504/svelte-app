<script lang="ts">
  import { goto } from '$app/navigation';
  
  function goToDashboard() {
    goto('/dashboard');
  }
  
  function goToLogin() {
    goto('/login');
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
  <div class="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="bg-red-500 p-4">
      <div class="flex items-center">
        <svg class="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="ml-3 text-xl font-semibold text-white">Unauthorized Access</h2>
      </div>
    </div>
    <div class="p-6">
      <p class="text-gray-700 mb-6">
        You do not have permission to access this page. This page requires specific roles that your account does not have.
      </p>
      
      <div class="flex space-x-4">
        <button
          on:click={goToDashboard}
          class="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go to Dashboard
        </button>
        <button
          on:click={goToLogin}
          class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Login Again
        </button>
      </div>
    </div>
  </div>
</div>