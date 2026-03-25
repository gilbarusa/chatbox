const express = require('express');
const cors    = require('cors');
const https   = require('https');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HF_BASE = 'https://api.hostfully.com/api/v3.2';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Simple https request helper (no extra dependencies) ───────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Hostfully proxy ───────────────────────────────────────────────
app.all('/api/hostfully/*', async (req, res) => {
  const apiKey    = req.headers['x-hostfully-apikey']    || process.env.HOSTFULLY_API_KEY;
  const agencyUid = req.headers['x-hostfully-agencyuid'] || process.env.HOSTFULLY_AGENCY_UID;
  if (!apiKey) return res.status(401).json({ error: 'Missing Hostfully API key' });

  const hfPath  = req.path.replace('/api/hostfully', '');
  const query   = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const fullPath = '/api/v3.2' + hfPath + query;
  const bodyStr  = ['GET','HEAD'].includes(req.method) ? null : JSON.stringify(req.body);

  const options = {
    hostname: 'api.hostfully.com',
    path:     fullPath,
    method:   req.method,
    headers: {
      'X-HOSTFULLY-APIKEY': apiKey,
      'Accept':             'application/json',
      'Content-Type':       'application/json',
      ...(agencyUid ? { 'X-HOSTFULLY-AGENCYUID': agencyUid } : {}),
      ...(bodyStr   ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
    },
  };

  try {
    const result = await httpsRequest(options, bodyStr);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Hostfully proxy error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Claude proxy ──────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  const claudeKey = req.headers['x-claude-key'] || process.env.CLAUDE_API_KEY;
  if (!claudeKey) return res.status(401).json({ error: 'Missing Claude API key' });

  const bodyStr = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com',
    path:     '/v1/messages',
    method:   'POST',
    headers: {
      'x-api-key':         claudeKey,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
      'Content-Length':    Buffer.byteLength(bodyStr),
    },
  };

  try {
    const result = await httpsRequest(options, bodyStr);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Claude proxy error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Hostfully Bot running on port ${PORT}`));
