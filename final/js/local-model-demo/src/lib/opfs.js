
export const OPFS_ROOT = 'local-models';



export async function getOPFSHandler() {
  // FODO: Step 3: Saving the storage, Getting the storage
  const root = await navigator.storage.getDirectory();
  const modelDir = await root.getDirectoryHandle(OPFS_ROOT, { create: true });
  return modelDir;
}

export async function saveToOPFS(filename, stream, onProgress) {
  const dir = await getOPFSHandler();
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  
  const reader = stream.getReader();
  let stored = 0;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      stored += value.length;
      if (onProgress) onProgress(stored);
    }
    await writable.close();
    return true;
  } catch (err) {
    console.error('OPFS Write Error:', err);
    await writable.abort();
    throw err;
  }
}

export async function loadFromOPFS(filename) {
  try {
    const dir = await getOPFSHandler();
    const fileHandle = await dir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file;
  } catch (e) {
    return null;
  }
}

export async function checkFileExists(filename) {
  try {
    const dir = await getOPFSHandler();
    await dir.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFromOPFS(filename) {
    try {
        const dir = await getOPFSHandler();
        await dir.removeEntry(filename);
        return true;
    } catch {
        return false;
    }
}
