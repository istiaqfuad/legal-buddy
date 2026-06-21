"""Drop the throwaway eval collections from the remote Qdrant. Safe: only touches
the two legal_acts_eval_* collections, never the production ones."""
from common import COLLECTION_BASELINE, COLLECTION_IMPROVED, build_qdrant_client


def main():
    client = build_qdrant_client()
    existing = {c.name for c in client.get_collections().collections}
    for name in (COLLECTION_BASELINE, COLLECTION_IMPROVED):
        if name in existing:
            client.delete_collection(collection_name=name)
            print(f"dropped {name}")
        else:
            print(f"absent {name}")


if __name__ == "__main__":
    main()
