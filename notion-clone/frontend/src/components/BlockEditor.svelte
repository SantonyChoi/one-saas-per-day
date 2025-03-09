<script>
  import { createEventDispatcher } from 'svelte';
  import Block from './Block.svelte';
  import { apiRequest } from '$lib/config';
  
  export let blocks = [];
  export let pageId;
  export let addBlock;
  
  const dispatch = createEventDispatcher();
  
  // Update a block
  async function updateBlock(blockId, data) {
    try {
      return await apiRequest(`/blocks/${blockId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Error updating block:', err);
      throw err;
    }
  }
  
  // Delete a block
  async function deleteBlock(blockId) {
    try {
      await apiRequest(`/blocks/${blockId}`, {
        method: 'DELETE'
      });
      
      // Update local blocks array
      blocks = blocks.filter(block => block.id !== blockId);
      
      return true;
    } catch (err) {
      console.error('Error deleting block:', err);
      throw err;
    }
  }
  
  // Handle keyboard events for navigation and block manipulation
  function handleKeydown(event, block, index) {
    const { key, shiftKey, ctrlKey, metaKey } = event;
    
    // Enter key: create a new block
    if (key === 'Enter' && !shiftKey) {
      event.preventDefault();
      addBlock('paragraph', index + 1);
    }
    
    // Backspace key: delete empty block
    if (key === 'Backspace' && block.content.text === '' && blocks.length > 1) {
      event.preventDefault();
      deleteBlock(block.id);
    }
    
    // Arrow up: move to previous block
    if (key === 'ArrowUp' && !shiftKey && !ctrlKey && !metaKey) {
      if (index > 0) {
        event.preventDefault();
        const prevBlock = document.querySelector(`[data-block-id="${blocks[index - 1].id}"]`);
        if (prevBlock) {
          prevBlock.focus();
        }
      }
    }
    
    // Arrow down: move to next block
    if (key === 'ArrowDown' && !shiftKey && !ctrlKey && !metaKey) {
      if (index < blocks.length - 1) {
        event.preventDefault();
        const nextBlock = document.querySelector(`[data-block-id="${blocks[index + 1].id}"]`);
        if (nextBlock) {
          nextBlock.focus();
        }
      }
    }
  }
  
  // Handle content change
  function handleContentChange(event) {
    const { blockId, content } = event.detail;
    const block = blocks.find(b => b.id === blockId);
    
    if (block) {
      updateBlock(blockId, { content });
    }
  }
  
  // Handle block type change
  function handleTypeChange(event) {
    const { blockId, type } = event.detail;
    const block = blocks.find(b => b.id === blockId);
    
    if (block) {
      updateBlock(blockId, { type });
    }
  }
</script>

<div class="blocks">
  {#each blocks as block, index (block.id)}
    <div class="block-wrapper">
      <Block
        {block}
        on:contentChange={handleContentChange}
        on:typeChange={handleTypeChange}
        on:keydown={(e) => handleKeydown(e, block, index)}
      />
    </div>
  {/each}
  
  <button
    on:click={() => addBlock('paragraph')}
    class="w-full py-2 text-center text-gray-500 hover:bg-gray-100 rounded-md mt-2"
  >
    + Add block
  </button>
</div>

<style>
  .blocks {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .block-wrapper {
    position: relative;
  }
</style> 