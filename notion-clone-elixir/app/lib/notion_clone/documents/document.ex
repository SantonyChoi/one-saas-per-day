defmodule NotionClone.Documents.Document do
  use Ecto.Schema
  import Ecto.Changeset

  schema "documents" do
    field :title, :string
    has_many :blocks, NotionClone.Documents.Block

    timestamps()
  end

  def changeset(document, attrs) do
    document
    |> cast(attrs, [:title])
    |> validate_required([:title])
  end
end
