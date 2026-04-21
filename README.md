# AI Labs 360

A modern AI news aggregation platform built with Cloudflare Workers and D1.

## Features

- **Live News Aggregation**: Real-time AI news from TechCrunch, Ars Technica, Bloomberg, The Verge, Reuters, and more
- **Smart Categorization**: Automatically categories stories (News, Research, Funding, Policy, Markets)
- **Fresh Timestamps**: Live age-of-story indicators that update in real-time
- **Search & Filter**: Filter by category and search across all stories
- **Responsive Design**: Modern dark theme UI optimized for all devices
- **Hourly Refresh**: Backend fetches latest stories every hour, caches in D1

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML/CSS
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Wrangler CLI

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:8787` to preview.

## Deployment

```bash
npm run deploy
```

## Live

Deployed at: https://ailabs360.com

## RSS Feeds

- TechCrunch
- Ars Technica
- Bloomberg Markets
- The Verge
- Reuters Tech News

Stories refresh hourly. Frontend refreshes client-side every 15 minutes.
