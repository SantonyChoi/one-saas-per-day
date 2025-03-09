defmodule NotionCloneWeb.DocumentLive do
  use NotionCloneWeb, :live_view

  alias NotionClone.Documents
  alias NotionCloneWeb.Components.BlockEditor

  @impl true
  def mount(_params, _session, socket) do
    # Create a new document if none exists (temporary solution)
    document =
      case Documents.list_documents() do
        [] ->
          {:ok, document} = Documents.create_document(%{title: "Untitled"})
          document

        [document | _] ->
          Documents.get_document!(document.id)
      end

    {:ok,
     socket
     |> assign(:document, document)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-background">
      <header class="border-b">
        <div class="container mx-auto px-4 py-4">
          <h1 class="text-2xl font-semibold"><%= @document.title %></h1>
        </div>
      </header>

      <main class="container mx-auto py-8">
        <.live_component
          module={BlockEditor}
          id="main-editor"
          document={@document}
        />
      </main>
    </div>
    """
  end
end
