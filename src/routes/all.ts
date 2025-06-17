export default defineEventHandler(async (event) => {
  const { url } = getQuery(event);

  if (!url || typeof url !== 'string') {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing ?url=' }));
  }

  try {
    const target = new URL(url);
    const res = await fetch(target.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProxyBot/1.0)',
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();
    const base = target.origin;

    let output = raw;

    // Handle HTML
    if (contentType.includes('text/html')) {
      output = raw.replace(/(src|href)=['"]([^'"]+)['"]/gi, (_, attr, value) => {
        const abs = new URL(value, target).href;
        return `${attr}="/proxy?url=${encodeURIComponent(abs)}"`;
      });
      output = output.replace(/(fetch|XMLHttpRequest\s*\(\s*\))\((['"])([^'"]+?)\2\)/gi, (match, func, quote, path) => {
        const abs = new URL(path, target).href;
        return `${func}('/proxy?url=${encodeURIComponent(abs)}')`;
      });
    }

    // Handle JS
    else if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      output = raw.replace(/(['"`])((https?:)?\/\/[^'"`\s]+)\1/g, (_, q, link) => {
        const abs = new URL(link, target).href;
        return `${q}/proxy?url=${encodeURIComponent(abs)}${q}`;
      });
    }

    // Handle CSS
    else if (contentType.includes('text/css')) {
      output = raw.replace(/url\((['"]?)([^'")]+)\1\)/gi, (_, quote, urlVal) => {
        const abs = new URL(urlVal, target).href;
        return `url(/proxy?url=${encodeURIComponent(abs)})`;
      });
    }

    // Set headers
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Cache-Control': 'no-cache',
    });

    return output;
  } catch (err: any) {
    console.error('Proxy error:', err);
    return sendError(event, createError({ statusCode: 500, statusMessage: err.message }));
  }
});
