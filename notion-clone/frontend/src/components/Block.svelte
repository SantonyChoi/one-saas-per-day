<script>
  import { createEventDispatcher } from 'svelte';
  
  export let block;
  
  const dispatch = createEventDispatcher();
  
  // Block types
  const blockTypes = [
    { value: 'paragraph', label: 'Text' },
    { value: 'heading-1', label: 'Heading 1' },
    { value: 'heading-2', label: 'Heading 2' },
    { value: 'heading-3', label: 'Heading 3' },
    { value: 'bullet-list', label: 'Bullet List' },
    { value: 'numbered-list', label: 'Numbered List' },
    { value: 'todo', label: 'To-Do' }
  ];
  
  // Show block type menu
  let showTypeMenu = false;
  
  // Handle content change
  function handleContentChange(event) {
    const text = event.target.textContent;
    const newContent = { ...block.content, text };
    
    dispatch('contentChange', {
      blockId: block.id,
      content: newContent
    });
  }
  
  // Handle checkbox change for todo blocks
  function handleCheckboxChange(event) {
    const checked = event.target.checked;
    const newContent = { ...block.content, checked };
    
    dispatch('contentChange', {
      blockId: block.id,
      content: newContent
    });
  }
  
  // Handle block type change
  function changeBlockType(type) {
    dispatch('typeChange', {
      blockId: block.id,
      type
    });
    
    showTypeMenu = false;
  }
  
  // Handle keydown events
  function handleKeydown(event) {
    // Forward the event to parent
    dispatch('keydown', event);
    
    // Handle slash command
    if (event.key === '/' && block.content.text === '') {
      event.preventDefault();
      showTypeMenu = true;
    }
    
    // Close type menu on escape
    if (event.key === 'Escape' && showTypeMenu) {
      event.preventDefault();
      showTypeMenu = false;
    }
  }
</script>

<div class="block-container relative">
  <!-- Block type menu -->
  {#if showTypeMenu}
    <div class="absolute top-0 left-0 z-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
      <div class="p-2 text-sm text-gray-500">
        Change block type
      </div>
      <ul>
        {#each blockTypes as type}
          <li>
            <button
              class="w-full text-left px-4 py-2 hover:bg-gray-100"
              on:click={() => changeBlockType(type.value)}
            >
              {type.label}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  
  <!-- Block content -->
  <div class="flex items-start">
    <!-- Block type indicator -->
    <div class="block-type-indicator mr-2 text-gray-400 flex-shrink-0 w-6 text-center">
      {#if block.type === 'bullet-list'}
        •
      {:else if block.type === 'numbered-list'}
        {block.position + 1}.
      {:else if block.type === 'todo'}
        <input
          type="checkbox"
          checked={block.content.checked}
          on:change={handleCheckboxChange}
        />
      {/if}
    </div>
    
    <!-- Editable content -->
    <div
      class="block block-{block.type} flex-1"
      contenteditable="true"
      data-block-id={block.id}
      on:input={handleContentChange}
      on:keydown={handleKeydown}
    >
      {block.content.text || ''}
    </div>
  </div>
</div>

<style>
  .block-container {
    margin: 0.25rem 0;
  }
  
  .block {
    min-height: 1.5rem;
    outline: none;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style> 