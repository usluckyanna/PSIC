import { requestAI } from '../server/requestAI.mjs';

const maxBodyBytes = 32 * 1024;
const languages = new Set(['简体中文', 'English', 'Español']);
const fallback = '暂时无法解释这条信息。你可以先上网查找不懂的词，再向老师确认具体要求。';

function reply(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (Number(req.headers['content-length']) > maxBodyBytes) throw new Error('Body too large');
  const body = req.body;
  if (body !== undefined) return typeof body === 'string' ? JSON.parse(body) : body;
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('Body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export default async function chat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: { message: '请点击「发送给 AI」。' } });
  }

  let source, language;
  try {
    ({ source, language } = await readBody(req));
  } catch {
    return reply(res, 400, { error: { message: '无法读取输入，请重新发送。' } });
  }
  if (typeof source !== 'string' || !source.trim() || source.length > 3000 ||
      !languages.has(language)) {
    return reply(res, 400, { error: { message: '请输入 3,000 字符以内的老师信息，并选择阅读语言。' } });
  }

  try {
    const { result, keyError } = await requestAI(source.trim(), language);
    if (keyError) return reply(res, 502, { error: { message: keyError } });
    return reply(res, 200, { result });
  } catch {
    return reply(res, 502, { error: { message: fallback } });
  }
}
