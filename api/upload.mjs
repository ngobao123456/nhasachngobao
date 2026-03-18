import { put } from '@vercel/blob';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function safeName(name = 'image') {
  const lastDot = name.lastIndexOf('.');
  const base = (lastDot > 0 ? name.slice(0, lastDot) : name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'image';
  const ext = lastDot > 0 ? name.slice(lastDot).toLowerCase() : '';
  return `${base}${ext}`;
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || 'images')
      .replace(/[^a-zA-Z0-9/_-]+/g, '')
      .replace(/^\/+|\/+$/g, '') || 'images';

    if (!(file instanceof File)) {
      return json({ error: 'Không tìm thấy file ảnh' }, 400);
    }

    if (!/^image\//i.test(file.type)) {
      return json({ error: 'Chỉ chấp nhận file ảnh' }, 400);
    }

    const pathname = `${folder}/${Date.now()}-${safeName(file.name)}`;
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
      cacheControlMaxAge: 86400
    });

    return json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl || blob.url
    });
  } catch (error) {
    return json({ error: error?.message || 'Không tải ảnh lên được' }, 500);
  }
}
