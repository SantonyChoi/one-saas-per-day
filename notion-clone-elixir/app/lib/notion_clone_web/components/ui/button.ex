defmodule NotionCloneWeb.Components.UI.Button do
  use Phoenix.Component

  # Variants: default, destructive, outline, secondary, ghost, link
  # Sizes: default, sm, lg, icon

  attr :type, :string, default: "button"
  attr :class, :string, default: nil
  attr :variant, :string, default: "default"
  attr :size, :string, default: "default"
  attr :rest, :global
  slot :inner_block, required: true

  def button(assigns) do
    ~H"""
    <button
      type={@type}
      class={[
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        get_variant_style(@variant),
        get_size_style(@size),
        @class
      ]}
      {@rest}
    >
      <%= render_slot(@inner_block) %>
    </button>
    """
  end

  defp get_variant_style("default"), do: "bg-primary text-primary-foreground hover:bg-primary/90"
  defp get_variant_style("destructive"), do: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  defp get_variant_style("outline"), do: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  defp get_variant_style("secondary"), do: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  defp get_variant_style("ghost"), do: "hover:bg-accent hover:text-accent-foreground"
  defp get_variant_style("link"), do: "text-primary underline-offset-4 hover:underline"

  defp get_size_style("default"), do: "h-10 px-4 py-2"
  defp get_size_style("sm"), do: "h-9 rounded-md px-3"
  defp get_size_style("lg"), do: "h-11 rounded-md px-8"
  defp get_size_style("icon"), do: "h-10 w-10"
end
