import { defineEventHandler, getQuery, sendError, createError, setResponseHeaders } from 'h3';

const segmentCache = new Map<string, { data: Uint8Array; headers: Record<string, string> }>();

function isPreflightRequest(event: any) {
  return event.method === 'OPTIONS';
}

function handleCors(event: any, extraHeaders: Record<string, string> = {}) {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    ...extraHeaders
  });
  return '';
}

function getCachedSegment(url: string) {
  return segmentCache.get(url);
}

export default defineEventHandler(async (event) => {
  if (isPreflightRequest(event)) return handleCors(event);

  const { url, headers: headersParam } = getQuery(event);

  if (!url || typeof url !== 'string') {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'URL parameter is required' }));
  }

  let headers: Record<string, string> = {};
  try {
    headers = headersParam ? JSON.parse(headersParam as string) : {};
  } catch {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Invalid headers format' }));
  }

  try {
    const isTS = url.endsWith('.ts');
    const cached = isTS && getCachedSegment(url);
    if (cached) {
      setResponseHeaders(event, {
        'Content-Type': cached.headers['content-type'] || 'video/mp2t',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Cache-Control': 'public, max-age=3600'
      });
      return cached.data;
    }

    const finalUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;

    const response = await globalThis.fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = new Uint8Array(await response.arrayBuffer());

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      ...(isTS ? { 'Cache-Control': 'public, max-age=3600' } : {})
    });

    if (isTS) {
      segmentCache.set(url, { data, headers: { 'content-type': contentType } });
    }

    return data;
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return sendError(event, createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Proxy request failed'
    }));
  }
});