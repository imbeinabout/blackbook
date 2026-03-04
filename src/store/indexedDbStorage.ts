// src/store/indexedDbStorage.ts
const DB_NAME = 'dg-blackbook';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const STATE_KEY = 'agents';

type StoredState = {
  agents: Record<string, unknown>;
  activeAgentId: string | null;
};

// Open (or upgrade) the DB
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Read the serialized JSON state string from IndexedDB
export async function idbGetItem(name: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STATE_STORE, 'readonly');
    const store = tx.objectStore(STATE_STORE);
    const req = store.get(STATE_KEY);

    req.onsuccess = () => {
      resolve(req.result ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

// Write serialized JSON state string into IndexedDB
export async function idbSetItem(name: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STATE_STORE, 'readwrite');
    const store = tx.objectStore(STATE_STORE);
    const req = store.put(value, STATE_KEY);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function idbRemoveItem(name: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STATE_STORE, 'readwrite');
    const store = tx.objectStore(STATE_STORE);
    const req = store.delete(STATE_KEY);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}