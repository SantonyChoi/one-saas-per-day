defmodule NotionCloneWeb.Components.BlockEditor do
  use NotionCloneWeb, :live_component
  alias Phoenix.LiveView.JS
  alias NotionCloneWeb.Presence
  alias NotionClone.Documents

  @topic "document:blocks"

  @impl true
  def mount(socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(NotionClone.PubSub, @topic)

      user_id = System.unique_integer([:positive])
      username = "User #{user_id}"

      Presence.track_user(
        self(),
        @topic,
        user_id,
        %{username: username}
      )
    end

    {:ok,
     assign(socket,
       selected_block: nil,
       editing_block: nil,
       users: []
     )}
  end

  @impl true
  def update(%{document: document} = assigns, socket) do
    {:ok,
     socket
     |> assign(assigns)
     |> assign(:blocks, document.blocks)
     |> handle_presence_update()}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="w-full max-w-4xl mx-auto p-4">
      <div class="mb-4 flex items-center space-x-2">
        <span class="text-sm text-muted-foreground">Online:</span>
        <%= for user <- @users do %>
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary-foreground">
            <%= user.username %>
          </span>
        <% end %>
      </div>

      <div class="space-y-4" id="block-editor" phx-hook="BlockEditor">
        <%= for block <- @blocks do %>
          <div
            class={[
              "p-2 rounded-lg transition-all group relative",
              @selected_block == block.id && "bg-accent"
            ]}
            id={"block-#{block.id}"}
            phx-click={JS.push("select_block", value: %{id: block.id})}
          >
            <%= if @editing_block == block.id do %>
              <form phx-submit="save_block" phx-target={@myself}>
                <.input
                  type="text"
                  name="content"
                  value={block.content}
                  placeholder="Type something..."
                  phx-blur="stop_editing"
                  phx-target={@myself}
                  autofocus
                />
              </form>
            <% else %>
              <div class="prose prose-sm max-w-none">
                <%= block.content %>
              </div>
              <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  class="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
                  phx-click="delete_block"
                  phx-value-id={block.id}
                  phx-target={@myself}
                >
                  <.icon name="hero-trash" class="w-4 h-4" />
                </button>
              </div>
            <% end %>
          </div>
        <% end %>

        <button
          type="button"
          class="w-full text-left hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md inline-flex items-center"
          phx-click="add_block"
          phx-target={@myself}
        >
          <.icon name="hero-plus" class="w-4 h-4 mr-2" />
          Add a block
        </button>
      </div>
    </div>
    """
  end

  @impl true
  def handle_event("add_block", _params, socket) do
    order = Documents.get_next_block_order(socket.assigns.document.id)

    {:ok, block} =
      Documents.create_block(%{
        content: "",
        type: "text",
        order: order,
        document_id: socket.assigns.document.id
      })

    broadcast_block_update(block, :add)

    {:noreply,
     socket
     |> update(:blocks, &(&1 ++ [block]))
     |> assign(editing_block: block.id)}
  end

  def handle_event("select_block", %{"id" => id}, socket) do
    {:noreply, assign(socket, selected_block: id)}
  end

  def handle_event("save_block", %{"content" => content}, socket) do
    block = Enum.find(socket.assigns.blocks, &(&1.id == socket.assigns.editing_block))
    {:ok, updated_block} = Documents.update_block(block, %{content: content})

    broadcast_block_update(updated_block, :update)

    updated_blocks =
      Enum.map(socket.assigns.blocks, fn b ->
        if b.id == updated_block.id, do: updated_block, else: b
      end)

    {:noreply,
     socket
     |> assign(blocks: updated_blocks, editing_block: nil)
     |> push_event("block_updated", %{id: socket.assigns.editing_block})}
  end

  def handle_event("delete_block", %{"id" => id}, socket) do
    block = Enum.find(socket.assigns.blocks, &(&1.id == id))
    {:ok, _} = Documents.delete_block(block)

    broadcast_block_update(%{id: id}, :delete)

    {:noreply,
     socket
     |> update(:blocks, &Enum.reject(&1, fn b -> b.id == id end))}
  end

  def handle_event("stop_editing", _params, socket) do
    {:noreply, assign(socket, editing_block: nil)}
  end

  # Handle PubSub messages
  def handle_info({:block_updated, block, action}, socket) do
    {:noreply,
     case action do
       :add ->
         update(socket, :blocks, &(&1 ++ [block]))

       :update ->
         update(socket, :blocks, fn blocks ->
           Enum.map(blocks, fn b ->
             if b.id == block.id, do: block, else: b
           end)
         end)

       :delete ->
         update(socket, :blocks, &Enum.reject(&1, fn b -> b.id == block.id end))
     end}
  end

  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff"}, socket) do
    {:noreply, handle_presence_update(socket)}
  end

  defp handle_presence_update(socket) do
    assign(socket, users: Presence.list_users(@topic))
  end

  defp broadcast_block_update(block, action) do
    Phoenix.PubSub.broadcast(
      NotionClone.PubSub,
      @topic,
      {:block_updated, block, action}
    )
  end
end
