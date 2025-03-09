defmodule NotionClone.Documents.Block do
  use Ecto.Schema
  import Ecto.Changeset

  schema "blocks" do
    field :content, :string
    field :type, :string, default: "text"
    field :order, :integer
    belongs_to :document, NotionClone.Documents.Document

    timestamps()
  end

  def changeset(block, attrs) do
    block
    |> cast(attrs, [:content, :type, :order, :document_id])
    |> validate_required([:type, :order, :document_id])
    |> foreign_key_constraint(:document_id)
  end
end
