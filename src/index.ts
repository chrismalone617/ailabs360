interface Story {
  id: string;
  title: string;
  excerpt: string;
  link: string;
  source: string;
  category: string;
  timestamp: number;
  age: string;
}

interface Env {
  DB: D1Database;
}

const RSS_FEEDS = [
  { url: 'https://feeds.techcrunch.com/techcrunch/feed/', source: 'TechCrunch' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' },
  { url: 'https://feeds.reuters.com/reuters/technologyNews', source: 'Reuters' },
];

async function parseRSSFeed(feedUrl: string): Promise<any[]> {
  try {
    const response = await fetch(feedUrl);
    const text = await response.text();
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(text)) !== null) {
      const itemText = match[1];
      const title = extractXMLValue(itemText, 'title');
      const link = extractXMLValue(itemText, 'link');
      const description = extractXMLValue(itemText, 'description');
      const pubDate = extractXMLValue(itemText, 'pubDate');
      
      if (title && link) {
        items.push({
          title: cleanHTML(title),
          excerpt: cleanHTML(description).substring(0, 150),
          link,
          timestamp: new Date(pubDate).getTime() || Date.now(),
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error('Error parsing RSS:', feedUrl);
    return [];
  }
}

function extractXMLValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function cleanHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function formatAge(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

function categorizeStory(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('research') || lowerTitle.includes('paper') || lowerTitle.includes('study')) return 'research';
  if (lowerTitle.includes('funding') || lowerTitle.includes('raise') || lowerTitle.includes('series') || lowerTitle.includes('invest')) return 'funding';
  if (lowerTitle.includes('regulation') || lowerTitle.includes('policy') || lowerTitle.includes('law')) return 'policy';
  if (lowerTitle.includes('acquire') || lowerTitle.includes('acquisition')) return 'markets';
  
  return 'news';
}

async function ensureTableExists(db: D1Database) {
  try {
    await db.prepare(`SELECT 1 FROM stories LIMIT 1`).first();
  } catch {
    try {
      await db.prepare(`
        CREATE TABLE stories (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          excerpt TEXT,
          link TEXT NOT NULL,
          source TEXT,
          category TEXT,
          timestamp INTEGER,
          created_at INTEGER
        )
      `).run();
    } catch (e) {
      console.error('Error creating table:', e);
    }
  }
}

async function fetchAndCacheStories(db: D1Database) {
  await ensureTableExists(db);
  
  for (const feed of RSS_FEEDS) {
    const items = await parseRSSFeed(feed.url);
    
    for (const item of items.slice(0, 3)) {
      const id = Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      const category = categorizeStory(item.title);
      
      try {
        await db.prepare(
          `INSERT INTO stories (id, title, excerpt, link, source, category, timestamp, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, item.title, item.excerpt, item.link, feed.source, category, item.timestamp, Date.now()).run();
      } catch (e) {
        console.log('Insert error:', e);
      }
    }
  }
}

const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Labs 360 - The AI News Hub</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%); color: #e0e0e0; line-height: 1.6; }
        header { background: rgba(15, 15, 30, 0.95); border-bottom: 1px solid rgba(100, 200, 255, 0.2); padding: 24px 0; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); }
        .header-content { max-width: 1400px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; gap: 32px; }
        .logo { font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #64c8ff, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .search-bar { flex: 1; max-width: 400px; }
        .search-bar input { width: 100%; padding: 10px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(100, 200, 255, 0.3); border-radius: 6px; color: #e0e0e0; }
        .nav-pills { display: flex; gap: 8px; }
        .nav-pill { padding: 8px 16px; background: rgba(100, 200, 255, 0.1); border: 1px solid rgba(100, 200, 255, 0.3); border-radius: 20px; color: #64c8ff; font-size: 13px; cursor: pointer; }
        .nav-pill.active { background: #64c8ff; color: #0f0f1e; }
        main { max-width: 1400px; margin: 0 auto; padding: 48px 24px; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid rgba(100, 200, 255, 0.3); }
        .section-title { font-size: 20px; font-weight: 700; }
        .section-dot { width: 8px; height: 8px; background: #64c8ff; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .news-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(100, 200, 255, 0.15); border-radius: 8px; padding: 20px; transition: all 0.3s; display: flex; flex-direction: column; gap: 12px; text-decoration: none; color: inherit; }
        .news-card:hover { background: rgba(100, 200, 255, 0.08); border-color: rgba(100, 200, 255, 0.4); transform: translateY(-2px); }
        .news-tag { font-size: 11px; font-weight: 600; padding: 4px 10px; background: rgba(100, 200, 255, 0.15); color: #64c8ff; border-radius: 4px; width: fit-content; text-transform: uppercase; }
        .news-headline { font-size: 16px; font-weight: 600; line-height: 1.4; color: #ffffff; }
        .news-card:hover .news-headline { color: #64c8ff; }
        .news-excerpt { font-size: 13px; color: #b0b0b0; }
        .news-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #808080; margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(100, 200, 255, 0.1); }
        .loading { text-align: center; padding: 40px; color: #808080; }
        .loader { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(100, 200, 255, 0.3); border-top-color: #64c8ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        footer { background: rgba(15, 15, 30, 0.95); border-top: 1px solid rgba(100, 200, 255, 0.2); padding: 32px 24px; text-align: center; color: #707070; font-size: 13px; margin-top: 80px; }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="logo">AI Labs 360</div>
            <div class="search-bar">
                <input type="text" id="search" placeholder="Search AI news...">
            </div>
            <div class="nav-pills">
                <div class="nav-pill active" data-filter="all">All</div>
                <div class="nav-pill" data-filter="news">News</div>
                <div class="nav-pill" data-filter="research">Research</div>
                <div class="nav-pill" data-filter="funding">Funding</div>
            </div>
        </div>
    </header>
    <main>
        <div id="stories" class="news-grid">
            <div class="loading">
                <div class="loader"></div>
                <p>Loading latest AI news...</p>
            </div>
        </div>
    </main>
    <footer>
        <p>AI Labs 360 — Fresh AI news aggregated in real-time.</p>
    </footer>
    <script>
        let allStories = [];
        let currentFilter = 'all';

        async function loadStories() {
            try {
                const response = await fetch('/api/stories');
                if (!response.ok) throw new Error('API error');
                const stories = await response.json();
                allStories = stories;
                renderStories();
            } catch (error) {
                console.error('Error:', error);
                setTimeout(loadStories, 5000);
            }
        }

        function renderStories() {
            const searchTerm = document.getElementById('search').value.toLowerCase();
            const filtered = allStories.filter(story => {
                const matchesFilter = currentFilter === 'all' || story.category === currentFilter;
                const matchesSearch = story.title.toLowerCase().includes(searchTerm) || story.excerpt.toLowerCase().includes(searchTerm);
                return matchesFilter && matchesSearch;
            });

            const html = filtered.map(story => \`
                <a href="\${story.link}" target="_blank" class="news-card">
                    <div class="news-tag">\${story.category.charAt(0).toUpperCase() + story.category.slice(1)}</div>
                    <div class="news-headline">\${story.title}</div>
                    <div class="news-excerpt">\${story.excerpt}...</div>
                    <div class="news-footer">
                        <span class="news-source">\${story.source}</span>
                        <span class="news-time">\${story.age}</span>
                    </div>
                </a>
            \`).join('');

            document.getElementById('stories').innerHTML = html || '<div class="loading">No stories found.</div>';
        }

        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                renderStories();
            });
        });

        document.getElementById('search').addEventListener('input', renderStories);
        loadStories();
        setInterval(loadStories, 15 * 60 * 1000);
        setInterval(async () => {
            try {
                await fetch('/api/refresh', { method: 'POST' });
            } catch (error) {}
        }, 60 * 60 * 1000);
    </script>
</body>
</html>
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/stories') {
      try {
        await ensureTableExists(env.DB);
        const result = await env.DB.prepare(
          `SELECT * FROM stories ORDER BY timestamp DESC LIMIT 50`
        ).all();
        
        const stories = (result.results || []).map((row: any) => ({
          ...row,
          age: formatAge(row.timestamp),
        }));
        
        return new Response(JSON.stringify(stories || []), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (error) {
        console.error('Stories error:', error);
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (url.pathname === '/api/refresh' && request.method === 'POST') {
      try {
        await fetchAndCacheStories(env.DB);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Refresh error:', error);
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  },
  
  async scheduled(event: ScheduledEvent, env: Env) {
    await fetchAndCacheStories(env.DB);
  },
};
