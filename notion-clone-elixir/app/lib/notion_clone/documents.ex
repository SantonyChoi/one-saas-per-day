defmodule NotionClone.Documents do
  import Ecto.Query, warn: false
  alias NotionClone.Repo
  alias NotionClone.Documents.{Document, Block}

  def list_documents do
    Repo.all(Document)
  end

  def get_document!(id) do
    Document
    |> Repo.get!(id)
    |> Repo.preload(blocks: from(b in Block, order_by: b.order))
  end

  def create_document(attrs \\ %{}) do
    %Document{}
    |> Document.changeset(attrs)
    |> Repo.insert()
  end

  def update_document(%Document{} = document, attrs) do
    document
    |> Document.changeset(attrs)
    |> Repo.update()
  end

  def delete_document(%Document{} = document) do
    Repo.delete(document)
  end

  def create_block(attrs \\ %{}) do
    %Block{}
    |> Block.changeset(attrs)
    |> Repo.insert()
  end

  def update_block(%Block{} = block, attrs) do
    block
    |> Block.changeset(attrs)
    |> Repo.update()
  end

  def delete_block(%Block{} = block) do
    Repo.delete(block)
  end

  def get_next_block_order(document_id) do
    query = from b in Block,
      where: b.document_id == ^document_id,
      select: max(b.order)

    case Repo.one(query) do
      nil -> 0
      max_order -> max_order + 1
    end
  end

  def reorder_blocks(_document_id, block_ids) do
    blocks = from(b in Block, where: b.id in ^block_ids) |> Repo.all()

    block_ids
    |> Enum.with_index()
    |> Enum.each(fn {id, index} ->
      block = Enum.find(blocks, &(&1.id == id))
      update_block(block, %{order: index})
    end)
  end
end
