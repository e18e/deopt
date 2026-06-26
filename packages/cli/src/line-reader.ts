import { open } from 'node:fs/promises';

const MAX_BUFFER_SIZE = 50 * 1024 * 1024; // 50 MB

export async function* lineReader(
  path: string,
  encoding: BufferEncoding,
): AsyncGenerator<string> {
  const fd = await open(path, 'r');
  const stats = await fd.stat();
  const fileSize = stats.size;
  let bytesRead = 0;
  const remainingString = '';

  while (bytesRead < fileSize) {
    let bufferSize = MAX_BUFFER_SIZE;
    if (bytesRead + MAX_BUFFER_SIZE > fileSize) {
      bufferSize = fileSize - bytesRead;
    }

    const buffer = Buffer.alloc(bufferSize);

    const chunk = await fd.read(buffer, 0, bufferSize, bytesRead);
    let current = 0;
    while (current < bufferSize) {
      const next = chunk.buffer.indexOf('\n', current);
      if (next === -1) break;
      const line =
        remainingString +
        chunk.buffer.subarray(current, next).toString(encoding);
      yield line;
      current = next + 1;
    }
    bytesRead += current;
  }
  await fd.close();
}
