// src/routes/all.ts
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event);

  if (!url) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing URL' }));
  }

  const res = await fetch(url as string);
  const data = await res.text();
  return data;
});
