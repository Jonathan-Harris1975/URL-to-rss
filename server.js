// rss-generator-from-urls/server.js import express from 'express'; import fs from 'fs/promises'; import axios from 'axios'; import cheerio from 'cheerio'; import { Feed } from 'feed';

const app = express(); const PORT = process.env.PORT || 3000;

const fetchArticleMeta = async (url) => { try { const { data } = await axios.get(url); const $ = cheerio.load(data);

const title = $('title').first().text() || 'No title';
const description = $('meta[name="description"]').attr('content') || 'No description';
const pubDate = new Date().toUTCString(); // fallback if none detected

return { title, description, pubDate, url };

} catch (err) { return { title: 'Error loading', description: err.message, pubDate: new Date().toUTCString(), url }; } };

app.get('/rss.xml', async (req, res) => { try { const urlsRaw = await fs.readFile('./urls.txt', 'utf-8'); const urls = urlsRaw.split('\n').filter(Boolean);

const items = await Promise.all(urls.map(fetchArticleMeta));

const feed = new Feed({
  title: 'Custom URL Feed',
  description: 'RSS feed from raw URLs',
  id: 'https://your-domain.com/rss.xml',
  link: 'https://your-domain.com/rss.xml',
  language: 'en',
  updated: new Date()
});

items.forEach(item => {
  feed.addItem({
    title: item.title,
    id: item.url,
    link: item.url,
    description: item.description,
    date: new Date(item.pubDate)
  });
});

res.set('Content-Type', 'application/rss+xml');
res.send(feed.rss2());

} catch (err) { res.status(500).send(RSS generation failed: ${err.message}); } });

app.listen(PORT, () => { console.log(✅ RSS Generator running on :${PORT}); });

