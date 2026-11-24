/**
 * StayFolk — API client.
 * Talks to the Node server in /server when it is present. On a static host
 * (GitHub Pages) the detection call fails cleanly and the app falls back to
 * the browser-only demo store.
 */

const opts = (method, body) => ({
  method,
  credentials: 'same-origin',
  headers: body ? { 'Content-Type': 'application/json' } : {},
  body: body ? JSON.stringify(body) : undefined,
});

async function request(method, path, body) {
  const res = await fetch(path, opts(method, body));
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    const err = new Error('Server did not answer with JSON');
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path, body) => request('DELETE', path, body),
};

/** Returns the bootstrap payload when a real server answers, otherwise null. */
export async function detect() {
  try {
    const res = await fetch('api/bootstrap', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.includes('application/json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}
