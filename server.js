import express from 'express';
import axios from 'axios';
import *cheerio from 'cheerio';
import fs from 'fs';
import { Feed } from 'feed';

const app = express();
const PORT = process.env.PORT || 3000;

const readUrlsFromFile = () => {
  const filePath = './urls.txt';
  if (!fs.existsSync(filePath)) return [];
  const urls = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  return urls;
};

const fetchAndParse = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title = $('title').text() || 'No title';
    const description = $('meta[name="description"]').attr('content') || 'No description';
    const paragraphs = $('p').map((_, el) => $(el).text()).get().join(' ');
    return { url, title, description, content: paragraphs };
  } catch (err) {
    return { url, title: 'Error', description: '', content: `Could not fetch: ${err.message}` };
  }
};

app.get('/rss', async (req, res) => {
  const urls = readUrlsFromFile();
  const feed = new Feed({
    title: 'Generated RSS Feed',
    description: 'RSS for non-feed sites',
    id: 'https://rss-gen.jonathan-harris.online',
    link: 'https://rss-gen.jonathan-harris.online',
    language: 'en',
    updated: new Date(),
    author: { name: 'Jonathan Harris' }
  });

  const results = await Promise.all(urls.map(fetchAndParse));
  results.forEach(item => {
    feed.addItem({
      title: item.title,
      id: item.url,
      link: item.url,
      description: item.description,
      content: item.content,
      date: new Date()
    });
  });

  res.set('Content-Type', 'application/rss+xml');
  res.send(feed.rss2());
});

app.listen(PORT, () => {
  console.log(`RSS feed generator running on port ${PORT}`);
});
