/**
 * IndexedDB blob storage for uploaded documents/images.
 * Metadata lives in the app store; binaries live here, keyed by the same id.
 * The backend phase swaps this for Supabase Storage behind the same calls.
 */

const DB_NAME = "personal-os-files";
const STORE = "blobs";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putFileBlob(id: string, blob: Blob): Promise<void> {
  await withStore("readwrite", (store) => store.put(blob, id));
}

export async function getFileBlob(id: string): Promise<Blob | undefined> {
  return withStore<Blob | undefined>("readonly", (store) => store.get(id));
}

export async function deleteFileBlob(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}
