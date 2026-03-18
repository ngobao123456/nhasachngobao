import { list, put, del, get } from '@vercel/blob';

const STORE_PATH = 'store/nhasach-ngobao-data.json';
const DEFAULT_DATA = { slots: {}, contact: {} };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function readStore() {
  try {
    const blob = await get(STORE_PATH, { access: 'private' });
    if (!blob || !blob.body) return DEFAULT_DATA;
    const text = await new Response(blob.body).text();
    return { ...DEFAULT_DATA, ...(JSON.parse(text) || {}) };
  } catch (error) {
    return DEFAULT_DATA;
  }
}

export async function GET() {
  const data = await readStore();
  return json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      slots: body?.slots && typeof body.slots === 'object' ? body.slots : {},
      contact: body?.contact && typeof body.contact === 'object' ? body.contact : {},
      updatedAt: new Date().toISOString()
    };

    await put(STORE_PATH, JSON.stringify(payload, null, 2), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 1
    });

    return json({ ok: true, updatedAt: payload.updatedAt });
  } catch (error) {
    return json({ error: error?.message || 'Không lưu được dữ liệu' }, 500);
  }
}

export default async function handler(request) {
  if (request.method === 'GET') return GET(request);
  if (request.method === 'POST') return POST(request);
  return json({ error: 'Method not allowed' }, 405);
}
