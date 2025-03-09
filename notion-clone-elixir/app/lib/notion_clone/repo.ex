defmodule NotionClone.Repo do
  use Ecto.Repo,
    otp_app: :notion_clone,
    adapter: Ecto.Adapters.Postgres
end
