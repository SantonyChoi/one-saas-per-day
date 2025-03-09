defmodule NotionClone.Repo.Migrations.CreateDocumentsAndBlocks do
  use Ecto.Migration

  def change do
    create table(:documents) do
      add :title, :string, null: false

      timestamps()
    end

    create table(:blocks) do
      add :content, :text
      add :type, :string, null: false
      add :order, :integer, null: false
      add :document_id, references(:documents, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:blocks, [:document_id])
    create index(:blocks, [:document_id, :order])
  end
end
