defmodule NotionCloneWeb.Components.UI.Input do
  use Phoenix.Component

  attr :type, :string, default: "text"
  attr :class, :string, default: nil
  attr :rest, :global, include: ~w(autocomplete disabled form max maxlength min minlength
                                 pattern placeholder readonly required size step value)
  slot :inner_block

  def input(assigns) do
    ~H"""
    <input
      type={@type}
      class={[
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
        "disabled:opacity-50",
        @class
      ]}
      {@rest}
    />
    """
  end
end
