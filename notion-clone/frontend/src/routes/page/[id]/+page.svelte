<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import * as Y from 'yjs';
  import { io } from 'socket.io-client';
  import BlockEditor from '../../../components/BlockEditor.svelte';
  import { API_URL, SOCKET_URL, apiRequest, getDefaultContent } from '$lib/config';

  // 실시간 협업 기능 사용 여부를 결정하는 플래그
  let useCollaboration = false;

  let pageData = null;
  let blocks = [];
  let isLoading = true;
  let error = null;
  let title = '';
  let socket;

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

      // Socket.IO 연결 설정
      try {
        socket = io(SOCKET_URL);
        
        // 페이지 룸에 참여
        socket.emit('join_page', pageId);
        
        // 연결 상태 모니터링
        socket.on('connect', () => {
          console.log('Socket connected');
          useCollaboration = true;
        });
        
        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          useCollaboration = false;
        });
        
        // 블록 업데이트 이벤트 처리
        socket.on('block_updated', (updatedBlock) => {
          const index = blocks.findIndex(b => b.id === updatedBlock.id);
          if (index !== -1) {
            blocks[index] = updatedBlock;
            blocks = [...blocks]; // 반응성 트리거
          }
        });
        
        // 블록 삭제 이벤트 처리
        socket.on('block_deleted', (blockId) => {
          blocks = blocks.filter(b => b.id !== blockId);
        });
        
        // 제목 업데이트 이벤트 처리
        socket.on('title_updated', (newTitle) => {
          title = newTitle;
        });
        
        // 에러 처리
        socket.on('error', (err) => {
          console.error('Socket error:', err);
          error = err.message;
        });
        
      } catch(err) {
        console.error('Failed to initialize real-time collaboration:', err);
        error = 'Failed to initialize real-time collaboration. Basic editing is still available.';
      }
    } catch(err) {
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
      
      // 실시간 협업이 활성화된 경우 소켓 이벤트 발생
      if (useCollaboration && socket) {
        socket.emit('update_title', { pageId, title });
      }
    } catch(err) {
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
    }).then(newBlock => {
      blocks = [...blocks.slice(0, position), newBlock, ...blocks.slice(position)];
      
      // 실시간 협업이 활성화된 경우 소켓 이벤트 발생
      if (useCollaboration && socket) {
        socket.emit('add_block', { pageId, block: newBlock });
      }
    }).catch(err => {
      error = err.message;
      console.error('Error adding block:', err);
    });
  }

  // Update a block
  function updateBlock(blockId, content) {
    const pageId = $page.params.id;
    
    apiRequest(`/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    }).then(updatedBlock => {
      const index = blocks.findIndex(b => b.id === blockId);
      if (index !== -1) {
        blocks[index] = updatedBlock;
        blocks = [...blocks]; // 반응성 트리거
      }
      
      // 실시간 협업이 활성화된 경우 소켓 이벤트 발생
      if (useCollaboration && socket) {
        socket.emit('update_block', { pageId, block: updatedBlock });
      }
    }).catch(err => {
      error = err.message;
      console.error('Error updating block:', err);
    });
  }

  // Delete a block
  function deleteBlock(blockId) {
    const pageId = $page.params.id;
    
    apiRequest(`/blocks/${blockId}`, {
      method: 'DELETE'
    }).then(() => {
      blocks = blocks.filter(b => b.id !== blockId);
      
      // 실시간 협업이 활성화된 경우 소켓 이벤트 발생
      if (useCollaboration && socket) {
        socket.emit('delete_block', { pageId, blockId });
      }
    }).catch(err => {
      error = err.message;
      console.error('Error deleting block:', err);
    });
  }

  onMount(() => {
    fetchPageData();
  });

  onDestroy(() => {
    // Clean up Socket.IO resources
    if (socket) {
      socket.disconnect();
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
        class="w-full text-3xl font-bold border-none outline-none focus:ring-0" 
        placeholder="Untitled" 
        bind:value={title} 
        on:blur={updateTitle}
      />
    </div>

    <div class="block-container">
      {#if blocks.length === 0}
        <button 
          class="w-full py-4 text-center text-gray-500 hover:bg-gray-100 rounded-md"
          on:click={() => addBlock()}
        >
          Click to add content...
        </button>
      {:else}
        <BlockEditor 
          {blocks} 
          {addBlock} 
          {updateBlock}
          {deleteBlock}
          pageId={$page.params.id} 
        />
      {/if}
    </div>

    {#if !useCollaboration}
      <div class="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
        <p>실시간 협업 기능을 초기화하는 중입니다. 기본 편집 기능은 계속 사용할 수 있습니다.</p>
      </div>
    {:else}
      <div class="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
        <p>실시간 협업 기능이 활성화되었습니다. 다른 사용자와 함께 편집할 수 있습니다.</p>
      </div>
    {/if}
  {/if}

  <div class="mt-8">
    <a href="/" class="text-blue-600 hover:underline">← Back to all pages</a>
  </div>
</div> 