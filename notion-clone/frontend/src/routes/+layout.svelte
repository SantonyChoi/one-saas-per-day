<script>
  import '../app.css';
</script>

<div class="min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900">Notion Clone</a>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="bg-white border-t border-gray-200 py-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm text-gray-500">
        Minimalist Notion Clone - Built with SvelteKit, Flask, and PostgreSQL
      </p>
    </div>
  </footer>
</div> 