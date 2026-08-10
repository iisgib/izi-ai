const ALLOWED_ORIGINS = new Set([
  'https://iisgib.github.io',
  'https://iziai.academy',
  'https://www.iziai.academy',
]);

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden origin' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'invalid json' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const name = String(data.name || '').trim().slice(0, 100);
    const phone = String(data.phone || '').trim().slice(0, 40);
    const format = String(data.format || '').trim().slice(0, 40);
    const lang = String(data.lang || '').trim().slice(0, 5);

    if (!name || !phone) {
      return new Response(JSON.stringify({ ok: false, error: 'missing fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const text =
      `🎓 Новая заявка — IZI AI\n\n` +
      `Имя: ${name}\n` +
      `Телефон: ${phone}\n` +
      `Формат: ${format}\n` +
      `Язык сайта: ${lang}`;

    const tgResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    });

    if (!tgResp.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'telegram send failed' }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
