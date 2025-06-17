import { defineEventHandler, getQuery, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string;

  if (!url) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing URL' }));
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    });

    const contentType = response.headers.get("content-type") || "text/plain";

    event.res.setHeader("Content-Type", contentType);
    event.res.setHeader("Access-Control-Allow-Origin", "*");

    return await response.text();
  } catch (err: any) {
    return sendError(event, createError({ statusCode: 500, statusMessage: err.message }));
  }
});
