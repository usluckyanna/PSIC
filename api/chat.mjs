import { getKey } from '../server/getKey.mjs';

const model = 'gpt-5.6-luna';
const maxBodyBytes = 128 * 1024;

function reply(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (Number(req.headers['content-length']) > maxBodyBytes) {
    throw new Error('Request is too large.');
  }
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function complete(messages, key) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_completion_tokens: 2048 }),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  return { response, data: await response.json().catch(() => null) };
}

export default async function chat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: { message: 'Use POST to send a message.' } });
  }

  let messages;
  try {
    ({ messages } = await readBody(req));
  } catch {
    return reply(res, 400, { error: { message: 'Send a valid JSON message.' } });
  }
  if (!Array.isArray(messages) || messages.length > 12 ||
      messages.at(-1)?.role !== 'user' ||
      messages.some((message, index) =>
        message?.role !== (index % 2 ? 'assistant' : 'user') ||
        typeof message.content !== 'string' || !message.content.trim() ||
        message.content.length > 3000)) {
    return reply(res, 400, { error: { message: 'Send up to 12 alternating messages, each 3,000 characters or fewer.' } });
  }

  const conversation = messages.map(({ role, content }) => ({ role, content }));
  let key;
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      key = await getKey({ invalidKey: key });
    } catch (error) {
      return reply(res, 502, { error: { message: error.message } });
    }
    try {
      result = await complete(conversation, key);
    } catch {
      return reply(res, 502, { error: { message: 'Could not reach OpenAI. Try again.' } });
    }
    if (result.data?.error?.code !== 'invalid_api_key') break;
  }
  if (!result.response.ok) {
    console.error('OpenAI chat failed with HTTP status', result.response.status);
    return reply(res, 502, { error: { message: 'OpenAI could not complete the request.' } });
  }
  const content = result.data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    return reply(res, 502, { error: { message: 'OpenAI returned an empty reply.' } });
  }
  return reply(res, 200, { message: content });
}
