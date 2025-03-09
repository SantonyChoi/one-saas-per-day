defmodule NotionCloneWeb.Presence do
  use Phoenix.Presence,
    otp_app: :notion_clone,
    pubsub_server: NotionClone.PubSub

  def track_user(pid, topic, user_id, meta) do
    track(pid, topic, user_id, Map.merge(%{
      online_at: DateTime.utc_now(),
    }, meta))
  end

  def list_users(topic) do
    list(topic)
    |> Enum.map(fn {user_id, %{metas: [meta | _]}} ->
      %{
        id: user_id,
        online_at: meta.online_at,
        username: meta.username
      }
    end)
  end
end
