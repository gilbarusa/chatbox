# Hostfully AI Reply Bot

An AI-powered guest messaging bot that connects to Hostfully and auto-generates replies using Claude.

---

## How it works

```
Guest message → Hostfully API → Your Server → Claude AI → Reply sent back
```

Your server acts as a secure middleman — keeping your API keys safe and bypassing browser CORS restrictions.

---

## Setup: Step by step

### Step 1 — Create a GitHub repo

1. Go to [github.com](https://github.com) → click **New repository**
2. Name it `hostfully-bot` (or anything you like)
3. Set to **Private**, click **Create repository**
4. Upload all these files to the repo (drag and drop in GitHub's web UI, or use git)

Your repo should look like this:
```
hostfully-bot/
  server.js
  package.json
  .env.example
  .gitignore
  public/
    index.html
```

> ⚠️ Do NOT upload a `.env` file — that contains your secrets. It's already in `.gitignore`.

---

### Step 2 — Deploy to Render (free)

1. Go to [render.com](https://render.com) → Sign up with your GitHub account
2. Click **New → Web Service**
3. Connect your `hostfully-bot` GitHub repo
4. Fill in:
   - **Name**: `hostfully-bot` (or anything)
   - **Runtime**: `Node`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
5. Scroll down to **Environment Variables** and add:
   - `HOSTFULLY_API_KEY` → your Hostfully API key
   - `CLAUDE_API_KEY` → your Claude API key (`sk-ant-...`)
6. Click **Create Web Service**

Render will build and deploy. After ~2 minutes you'll get a URL like:
```
https://hostfully-bot.onrender.com
```

---

### Step 3 — Open the bot

1. Visit your Render URL in a browser: `https://hostfully-bot.onrender.com`
2. Click **Settings** (top right)
3. Fill in:
   - **Server URL**: your Render URL (e.g. `https://hostfully-bot.onrender.com`)
   - **Hostfully API Key**: your key
   - **Agency UID**: from Hostfully → Agency Settings
   - **Claude API Key**: your key
4. Click **Save & Connect**

Your conversations will load automatically!

---

## Using the bot

### Property Knowledge Base
Go to the **Property KB** tab. For each property, fill in details like:
- Oven type (gas/electric)
- Bathroom outlet location
- WiFi password
- Check-in code
- Parking info

Claude uses these when answering property-specific questions.

### Q&A Training
Go to the **Q&A** tab. Add example questions and your ideal replies.
Claude learns your tone and style from these examples.

### AI Suggest
1. Select a conversation
2. Click **✦ AI suggest**
3. Review the suggested reply
4. Click **Use this** → **Send →**

### Auto-send mode
In Settings, switch to **Auto-send when confident**.
The bot will reply automatically for questions it can answer confidently.
If it's not sure (property-specific details not in the KB), it waits for you.

---

## Getting your API keys

**Hostfully API key:**
Hostfully → Agency Settings → API section → copy your key

**Agency UID:**
Hostfully → Agency Settings → copy the Agency UID

**Claude API key:**
[console.anthropic.com](https://console.anthropic.com) → API Keys → Create key

---

## Free tier notes

- Render free tier **spins down after 15 minutes of inactivity** — first request after idle takes ~30 seconds to wake up
- To keep it always-on, upgrade to Render's paid tier ($7/month) or use [UptimeRobot](https://uptimerobot.com) to ping your `/health` endpoint every 5 minutes (free)

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Failed to fetch" | Check your Server URL in Settings — must match your Render URL exactly |
| 401 Unauthorized | Check your Hostfully API key |
| No threads loading | Check your Agency UID |
| AI replies not working | Check your Claude API key |
| Render deploy failed | Check the Render logs — usually a missing `package.json` field |
