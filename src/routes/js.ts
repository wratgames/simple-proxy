import { defineEventHandler, getQuery, createError, sendError } from 'h3'

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid "url" parameter'
    }))
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': url
      }
    })

    if (!response.ok) {
      return sendError(event, createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch: ${response.statusText}`
      }))
    }

    const jsContent = await response.text()

    event.node.res.setHeader('Content-Type', 'application/javascript')
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')
    event.node.res.setHeader('Access-Control-Allow-Headers', '*')
    event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    event.node.res.setHeader('Cache-Control', 'no-cache')

    return jsContent
  } catch (err: any) {
    console.error('[Proxy JS Error]', err)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal server error while proxying JS'
    }))
  }
})
