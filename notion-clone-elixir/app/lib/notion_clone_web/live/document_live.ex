defmodule NotionCloneWeb.DocumentLive do
  use NotionCloneWeb, :live_view

  alias NotionClone.Documents
  alias NotionCloneWeb.Components.BlockEditor
  alias NotionCloneWeb.Presence

  @topic "document:blocks"

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(NotionClone.PubSub, @topic)
    end

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

  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff"}, socket) do
    # 사용자 상태 변경 처리
    {:noreply, socket}
  end

  @impl true
  def handle_info({:block_updated, block, action}, socket) do
    # 블록 업데이트 처리
    document = socket.assigns.document

    updated_document =
      case action do
        :add ->
          # 이미 존재하는 블록인지 확인
          if Enum.any?(document.blocks, fn b -> b.id == block.id end) do
            document
          else
            %{document | blocks: document.blocks ++ [block]}
          end

        :update ->
          updated_blocks = Enum.map(document.blocks, fn b ->
            if b.id == block.id, do: block, else: b
          end)
          %{document | blocks: updated_blocks}

        :delete ->
          updated_blocks = Enum.reject(document.blocks, fn b -> b.id == block.id end)
          %{document | blocks: updated_blocks}
      end

    {:noreply, assign(socket, document: updated_document)}
  end
end
