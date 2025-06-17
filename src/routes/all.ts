export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)

  if (!url || typeof url !== 'string') {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing ?url=' }))
  }

  try {
    const target = new URL(url)
    const res = await fetch(target.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProxyBot/1.0)',
      },
    })

    const contentType = res.headers.get('content-type') || ''
    const data = await res.text()
    const base = target.origin

    let output = data

    // ---------- HTML ----------
    if (contentType.includes('text/html')) {
      output = data.replace(/(src|href)=["']([^"']+)["']/gi, (_, attr, value) => {
        const absolute = new URL(value, target).href
        return `${attr}="/proxy?url=${encodeURIComponent(absolute)}"`
      })

      // Rewrite inline fetch(), new XMLHttpRequest(), etc
      output = output.replace(/(fetch|XMLHttpRequest\s*\(\s*\))\((['"])([^'"]+?)\2\)/gi, (match, func, quote, path) => {
        const abs = new URL(path, target).href
        return `${func}("/proxy?url=${encodeURIComponent(abs)}")`
      })
    }

    // ---------- JavaScript ----------
    else if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      output = data.replace(/(['"`])((https?:)?\/\/[^"'`\s]+)\1/g, (_, q, link) => {
        const absolute = new URL(link, target).href
        return `${q}/proxy?url=${encodeURIComponent(absolute)}${q}`
      })
    }

    // ---------- CSS ----------
    else if (contentType.includes('text/css')) {
      output = data.replace(/url\((['"]?)([^'")]+)\1\)/gi, (_, quote, urlVal) => {
        const absolute = new URL(urlVal, target).href
        return `url(/proxy?url=${encodeURIComponent(absolute)})`
      })
    }

    // ---------- Set Headers ----------
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Cache-Control': 'no-cache',
    })

    return output
  } catch (err: any) {
    console.error('Proxy failed:', err)
    return sendError(event, createError({ statusCode: 500, statusMessage: err.message }))
  }
})
