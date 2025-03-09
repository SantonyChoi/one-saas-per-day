<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import * as Y from 'yjs';
  import { WebsocketProvider } from 'y-websocket';
  import BlockEditor from '../../../components/BlockEditor.svelte';
  
  let pageData = null;
  let blocks = [];
  let isLoading = true;
  let error = null;
  let title = '';
  let ydoc;
  let provider;
  let blocksArray;
  
  // Initialize Yjs document and WebSocket connection
  function initYjs() {
    const pageId = $page.params.id;
    const socketUrl = import.meta.env.PUBLIC_SOCKET_URL || 'http://localhost:5001';
    
    // Create a new Yjs document
    ydoc = new Y.Doc();
    
    // Get the shared blocks array
    blocksArray = ydoc.getArray('blocks');
    
    // Connect to the WebSocket server
    provider = new WebsocketProvider(socketUrl, `page-${pageId}`, ydoc);
    
    // Listen for connection status
    provider.on('status', event => {
      console.log('Connection status:', event.status);
    });
    
    // Listen for changes to the blocks array
    blocksArray.observe(event => {
      // Update the local blocks array when the shared array changes
      blocks = Array.from(blocksArray.toArray()).map(block => ({
        id: block.get('id'),
        type: block.get('type'),
        content: JSON.parse(block.get('content')),
        position: block.get('position')
      }));
    });
  }
  
  // Fetch page data
  async function fetchPageData() {
    const pageId = $page.params.id;
    isLoading = true;
    
    try {
      // Fetch page details
      const pageResponse = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api'}/pages/${pageId}`);
      if (!pageResponse.ok) {
        throw new Error('Failed to fetch page');
      }
      pageData = await pageResponse.json();
      title = pageData.title;
      
      // Fetch blocks
      const blocksResponse = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api'}/pages/${pageId}/blocks`);
      if (!blocksResponse.ok) {
        throw new Error('Failed to fetch blocks');
      }
      blocks = await blocksResponse.json();
      
      // Initialize Yjs after fetching data
      initYjs();
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
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api'}/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update title');
      }
    } catch (err) {
      error = err.message;
      console.error('Error updating title:', err);
    }
  }
  
  // Add a new block
  function addBlock(type = 'paragraph', position = blocks.length) {
    const apiUrl = `${import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api'}/pages/${$page.params.id}/blocks`;
    
    let content = {};
    switch (type) {
      case 'paragraph':
        content = { text: '' };
        break;
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
        content = { text: '' };
        break;
      case 'bullet-list':
      case 'numbered-list':
        content = { text: '' };
        break;
      case 'todo':
        content = { text: '', checked: false };
        break;
      default:
        content = { text: '' };
    }
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        content,
        position
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add block');
      }
      return response.json();
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
  
  onDestroy(() => {
    // Clean up Yjs resources
    if (provider) {
      provider.disconnect();
    }
    if (ydoc) {
      ydoc.destroy();
    }
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
  {/if}
  
  <div class="mt-8">
    <a href="/" class="text-blue-600 hover:underline">← Back to all pages</a>
  </div>
</div> 