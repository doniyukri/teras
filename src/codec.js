const MAX_BYTES = 200_000;

function bytesToToken(bytes) {
  let binary = '';
  const size = 0x8000;
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function tokenToBytes(token) {
  const pad = token.length % 4 === 0 ? '' : '='.repeat(4 - (token.length % 4));
  const base64 = token.replaceAll('-', '+').replaceAll('_', '/') + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function readHash(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function pack(value) {
  const json = JSON.stringify(value);
  const encoded = new TextEncoder().encode(json);
  if (typeof CompressionStream === 'undefined') return bytesToToken(encoded);

  const stream = new Blob([encoded]).stream().pipeThrough(new CompressionStream('gzip'));
  const zipped = new Uint8Array(await new Response(stream).arrayBuffer());
  return bytesToToken(zipped);
}

export async function unpack(token) {
  if (!token || token.length > MAX_BYTES) throw new Error('unreadable link');
  const bytes = tokenToBytes(token);
  if (bytes.length > MAX_BYTES) throw new Error('unreadable link');

  const gzipped = bytes[0] === 0x1f && bytes[1] === 0x8b;
  let text;
  if (gzipped) {
    if (typeof DecompressionStream === 'undefined') throw new Error('unreadable link');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder().decode(bytes);
  }
  return JSON.parse(text);
}
