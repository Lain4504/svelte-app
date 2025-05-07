<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { graphqlQuery } from '$lib/api/client';
  import { browser } from '$app/environment';
  import { queryClient } from '$lib/query/config';

  // Props
  export let searchText = '';

  // Pagination state
  let currentPage = 0;
  let pageSize = 10;
  let status = '';
  let role = '';

  // GraphQL query
  const USERS_QUERY = `
    query usersPaginated($page: Int, $size: Int, $searchText: String, $status: String, $role: String) {
      usersPaginated(page: $page, size: $size, searchText: $searchText, status: $status, role: $role) {
        content {
          id
          username
          email
          status
          roles
        }
        totalElements
        totalPages
        hasNext
        hasPrevious
      }
    }
  `;

  // Create query
  const usersQuery = createQuery({
    queryKey: ['users', currentPage, pageSize, searchText, status, role],
    queryFn: async () => {

      const response = await graphqlQuery(USERS_QUERY, {
        page: currentPage,
        size: pageSize,
        searchText,
        status,
        role
      });

      return response.usersPaginated;
    },
    // Disable automatic refetching when window is focused
    refetchOnWindowFocus: false,
    // Keep data fresh for 1 minute
    staleTime: 60 * 1000,
    // Only run query on client side
    enabled: browser
  });

  // Handle search
  async function handleSearch() {
    currentPage = 0; // Reset to first page when searching
    try {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      console.error('Search failed:', error);
    }
  }

  // Handle keypress in search input
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }

  // Handle page change
  async function handlePageChange(newPage: number) {
    currentPage = newPage;
    try {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      console.error('Page change failed:', error);
    }
  }

  // Handle status filter change
  function handleStatusChange(newStatus: string) {
    status = newStatus;
  }

  // Handle role filter change
  function handleRoleChange(newRole: string) {
    role = newRole;
  }

  // Watch for changes in searchText
  $: if (searchText !== undefined) {
    console.log('searchText changed:', searchText);
  }
</script>

<div class="space-y-6">
  <!-- Search and Filters -->
  <div class="space-y-4">
    <!-- Search Bar -->
    <div class="flex gap-4">
      <input
        type="text"
        bind:value={searchText}
        on:keypress={handleKeyPress}
        placeholder="Search users..."
        class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      <button
        on:click={handleSearch}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Search
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <select
        bind:value={status}
        on:change={() => handleStatusChange(status)}
        class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      <select
        bind:value={role}
        on:change={() => handleRoleChange(role)}
        class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="">All Roles</option>
        <option value="ADMIN_ROLE_ENUM">Admin</option>
        <option value="USER_ROLE_ENUM">User</option>
        <option value="AUTHOR_ROLE_ENUM">Author</option>
      </select>
    </div>
  </div>

  <!-- Users Table -->
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Username
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Roles
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#if $usersQuery.isLoading}
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
              Loading...
            </td>
          </tr>
        {:else if $usersQuery.isError}
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-sm text-red-500">
              Error: {$usersQuery.error.message}
            </td>
          </tr>
        {:else if $usersQuery.data?.content.length === 0}
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
              No users found
            </td>
          </tr>
        {:else}
          {#each $usersQuery.data?.content || [] as user}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.username}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.email}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {user.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.roles.join(', ')}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if $usersQuery.data}
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-500">
        Total Users: {$usersQuery.data.totalElements}
      </div>
      <div class="flex gap-2">
        <button
          on:click={() => handlePageChange(currentPage - 1)}
          disabled={!$usersQuery.data.hasPrevious}
          class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="px-3 py-1 text-sm text-gray-700">
          Page {currentPage + 1} of {$usersQuery.data.totalPages}
        </span>
        <button
          on:click={() => handlePageChange(currentPage + 1)}
          disabled={!$usersQuery.data.hasNext}
          class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  {/if}
</div> 