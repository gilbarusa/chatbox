const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HF_BASE = 'https://api.hostfully.com/api/v3.2';

app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// ── Hostfully proxy ──────────────────────────────────────────────
// All requests to /api/hostfully/* are forwarded to Hostfully
app.all('/api/hostfully/*', async (req, res) => {
  const apiKey    = req.headers['x-hostfully-apikey'] || process.env.HOSTFULLY_API_KEY;
  const agencyUid = req.headers['x-hostfully-agencyuid'] || process.env.HOSTFULLY_AGENCY_UID;
  if (!apiKey) return res.status(401).json({ error: 'Missing Hostfully API key' });

  const hfPath = req.path.replace('/api/hostfully', '');
  const query  = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url    = HF_BASE + hfPath + query;

  try {
    const hfRes = await fetch(url, {
      method:  req.method,
      headers: {
        'X-HOSTFULLY-APIKEY':    apiKey,
        ...(agencyUid ? { 'X-HOSTFULLY-AGENCYUID': agencyUid } : {}),
        'Content-Type': 'application/json',
        'Accept':        'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const text = await hfRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    res.status(hfRes.status).json(data);
  } catch (err) {
    console.error('Hostfully proxy error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Claude proxy ─────────────────────────────────────────────────
// Keeps your Claude API key server-side (never exposed to browser)
app.post('/api/claude', async (req, res) => {
  const claudeKey = req.headers['x-claude-key'] || process.env.CLAUDE_API_KEY;
  if (!claudeKey) return res.status(401).json({ error: 'Missing Claude API key' });

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         claudeKey,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await claudeRes.json();
    res.status(claudeRes.status).json(data);
  } catch (err) {
    console.error('Claude proxy error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Hostfully Bot server running on port ${PORT}`));
