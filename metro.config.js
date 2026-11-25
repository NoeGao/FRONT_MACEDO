const { getDefaultConfig } = require('expo/metro-config');
const http = require('node:http');
const https = require('node:https');

const config = getDefaultConfig(__dirname);
const enhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const handleMetro = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;

  return (request, response, next) => {
    const path = new URL(request.url, 'http://localhost');
    if (!/^\/api\/tasks\/(?:\d+)?$/.test(path.pathname)) {
      return handleMetro(request, response, next);
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//.test(apiUrl ?? '')) {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ detail: 'Configurá EXPO_PUBLIC_API_URL en .env y reiniciá Expo.' }));
      return;
    }

    const target = new URL(apiUrl + path.pathname.slice('/api'.length) + path.search);
    const client = target.protocol === 'https:' ? https : http;
    const headers = { Accept: 'application/json' };
    for (const name of ['content-type', 'content-length']) {
      if (request.headers[name]) headers[name] = request.headers[name];
    }

    const upstream = client.request(target, { method: request.method, headers }, (result) => {
      response.writeHead(result.statusCode, {
        'Content-Type': result.headers['content-type'] ?? 'application/json',
      });
      result.on('error', (error) => response.destroy(error));
      result.pipe(response);
    });
    upstream.setTimeout(11000, () => upstream.destroy());
    upstream.on('error', () => {
      if (response.headersSent || response.destroyed) return;
      response.writeHead(502, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ detail: 'Expo no pudo comunicarse con la API. Recargá las tareas antes de repetir el guardado.' }));
    });
    response.on('close', () => upstream.destroy());
    request.pipe(upstream);
  };
};

module.exports = config;
