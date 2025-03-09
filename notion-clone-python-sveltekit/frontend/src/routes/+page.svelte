<script>
  import { onMount } from 'svelte';
  import { API_URL, apiRequest, BLOCK_TYPES } from '$lib/config';
  
  let pages = [];
  let newPageTitle = '';
  let isLoading = true;
  let error = null;
  
  // Fetch all pages
  async function fetchPages() {
    isLoading = true;
    try {
      pages = await apiRequest('/pages');
    } catch (err) {
      error = err.message;
      console.error('Error fetching pages:', err);
    } finally {
      isLoading = false;
    }
  }
  
  // Create a new page
  async function createPage() {
    if (!newPageTitle.trim()) return;
    
    try {
      const newPage = await apiRequest('/pages', {
        method: 'POST',
        body: JSON.stringify({ title: newPageTitle })
      });
      
      pages = [...pages, newPage];
      newPageTitle = '';
    } catch (err) {
      error = err.message;
      console.error('Error creating page:', err);
    }
  }
  
  // Delete a page
  async function deletePage(id) {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    try {
      await apiRequest(`/pages/${id}`, {
        method: 'DELETE'
      });
      
      pages = pages.filter(page => page.id !== id);
    } catch (err) {
      error = err.message;
      console.error('Error deleting page:', err);
    }
  }
  
  onMount(fetchPages);
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">My Pages</h1>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
      <p>{error}</p>
    </div>
  {/if}
  
  <!-- Create new page form -->
  <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Create a new page</h2>
    <form on:submit|preventDefault={createPage} class="flex gap-2">
      <input
        type="text"
        bind:value={newPageTitle}
        placeholder="Enter page title..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Create
      </button>
    </form>
  </div>
  
  <!-- Pages list -->
  <div>
    <h2 class="text-xl font-semibold mb-4">Your pages</h2>
    
    {#if isLoading}
      <p class="text-gray-500">Loading pages...</p>
    {:else if pages.length === 0}
      <p class="text-gray-500">No pages yet. Create your first page above!</p>
    {:else}
      <ul class="space-y-2">
        {#each pages as page (page.id)}
          <li class="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50">
            <a href="/page/{page.id}" class="text-blue-600 hover:underline flex-1">
              {page.title}
            </a>
            <div class="flex gap-2">
              <button
                on:click={() => deletePage(page.id)}
                class="text-red-600 hover:text-red-800"
                aria-label="Delete page"
              >
                Delete
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div> 