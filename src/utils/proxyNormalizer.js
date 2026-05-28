function parseUrlProxy(proxy) {
  const parsed = new URL(proxy);
  const protocol = parsed.protocol.replace(':', '');
  const username = parsed.username ? decodeURIComponent(parsed.username) : '';
  const password = parsed.password ? decodeURIComponent(parsed.password) : '';
  const host = parsed.hostname;
  const port = parsed.port;

  if (!['http', 'https', 'socks4', 'socks5'].includes(protocol)) {
    throw new Error(`Unsupported proxy protocol: ${protocol}`);
  }

  if (!host || !port) {
    throw new Error(`Invalid proxy format: ${proxy}`);
  }

  const auth = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    : '';

  return {
    url: `${protocol}://${auth}${host}:${port}`,
    protocol,
    host,
    port: Number(port),
    username,
    password
  };
}

function normalizeProxy(raw) {
  const proxy = String(raw || '').trim();

  if (!proxy || proxy.startsWith('#')) {
    return null;
  }

  if (proxy.includes('://')) {
    return parseUrlProxy(proxy);
  }

  if (proxy.includes('@')) {
    return parseUrlProxy(`http://${proxy}`);
  }

  const parts = proxy.split(':');

  if (parts.length === 2) {
    return parseUrlProxy(`http://${proxy}`);
  }

  if (parts.length === 4) {
    const [host, port, username, password] = parts;
    return parseUrlProxy(
      `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`
    );
  }

  throw new Error(`Invalid proxy format: ${proxy}`);
}

module.exports = {
  normalizeProxy
};
