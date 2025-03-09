<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import BlockEditor from '../../../components/BlockEditor.svelte';
  import { API_URL, SOCKET_URL, apiRequest, getDefaultContent } from '$lib/config';
  
  let pageData = null;
  let blocks = [];
  let isLoading = true;
  let error = null;
  let title = '';
  
  // Fetch page data
  async function fetchPageData() {
    const pageId = $page.params.id;
    isLoading = true;
    
    try {
      // Fetch page details
      pageData = await apiRequest(`/pages/${pageId}`);
      title = pageData.title;
      
      // Fetch blocks
      blocks = await apiRequest(`/pages/${pageId}/blocks`);
    } catch (err) {
      error = err.message;
      console.error('Error fetching page data:', err);
    } finally {
      isLoading = false;
    }
  }
  
  // Update page title
  async function updateTitle() {
    const pageId = $page.params.id;
    
    try {
      await apiRequest(`/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify({ title })
      });
    } catch (err) {
      error = err.message;
      console.error('Error updating title:', err);
    }
  }
  
  // Add a new block
  function addBlock(type = 'paragraph', position = blocks.length) {
    const pageId = $page.params.id;
    
    apiRequest(`/pages/${pageId}/blocks`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        content: getDefaultContent(type),
        position
      })
    })
    .then(newBlock => {
      blocks = [...blocks.slice(0, position), newBlock, ...blocks.slice(position)];
    })
    .catch(err => {
      error = err.message;
      console.error('Error adding block:', err);
    });
  }
  
  onMount(() => {
    fetchPageData();
  });
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
      <p>{error}</p>
    </div>
  {/if}
  
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <p class="text-gray-500">Loading page...</p>
    </div>
  {:else}
    <div class="mb-8">
      <input
        type="text"
        bind:value={title}
        on:blur={updateTitle}
        class="w-full text-3xl font-bold border-none outline-none focus:ring-0"
        placeholder="Untitled"
      />
    </div>
    
    <div class="block-container">
      {#if blocks.length === 0}
        <button
          on:click={() => addBlock('paragraph')}
          class="w-full py-4 text-center text-gray-500 hover:bg-gray-100 rounded-md"
        >
          Click to add content...
        </button>
      {:else}
        <BlockEditor {blocks} {addBlock} pageId={$page.params.id} />
      {/if}
    </div>
    
    <div class="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
      <p>실시간 협업 기능은 현재 비활성화되어 있습니다. 기본 편집 기능만 사용할 수 있습니다.</p>
    </div>
  {/if}
  
  <div class="mt-8">
    <a href="/" class="text-blue-600 hover:underline">← Back to all pages</a>
  </div>
</div> 