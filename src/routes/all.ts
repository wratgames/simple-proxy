import { setResponseHeaders } from 'h3';
import { getQuery } from 'h3';
import { sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const base = getQuery(event).base as string || '';
  const path = getQuery(event).path as string || '';

  if (!base) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Base URL is required (use ?base=https://example.com)'
    }));
  }

  const targetUrl = new URL(path, base).toString();

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type') || 'text/plain';
    let body = await response.text();

    if (contentType.includes('text/html')) {
      // Rewrite relative URLs
      const prefix = `/all?base=${encodeURIComponent(base)}&path=`;
      body = body
        .replace(/(href|src|action)=["']\/([^"']+)["']/g, (match, attr, val) => {
          return `${attr}="${prefix}/${val}"`;
        })
        .replace(/(href|src|action)=["']([^"':]+)["']/g, (match, attr, val) => {
          if (val.startsWith('#') || val.startsWith('mailto:') || val.startsWith('javascript:')) return match;
          return `${attr}="${prefix}${val}"`;
        });
    }

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    });

    return body;
  } catch (err: any) {
    console.error('Proxy error:', err);
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: err.message
    }));
  }
});
