import { fileURLToPath } from 'node:url';

export function normalizeFile(file) {
  if (file == null) return file;
  // Node.js may append :line:column to the end
  file = file.replace(/:\d+:\d+$/, '');
  // ESM source locations are reported as file:// URLs
  if (file.startsWith('file://')) {
    try {
      return fileURLToPath(file);
    } catch {
      return file;
    }
  }
  return file;
}
