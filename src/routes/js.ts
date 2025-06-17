// proxy.ts
import { defineEventHandler, getQuery, createError, sendError } from 'h3'

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)

  if (!url || typeof url !== 'string') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid URL'
    }))
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': url, // sometimes needed
      }
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()

    event.node.res.setHeader('Content-Type', contentType)
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')
    event.node.res.setHeader('Access-Control-Allow-Headers', '*')
    event.node.res.setHeader('Access-Control-Allow-Methods', '*')
    event.node.res.setHeader('Cache-Control', 'no-cache')

    return buffer
  } catch (err: any) {
    console.error('Proxy error:', err)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch resource'
    }))
  }
})
