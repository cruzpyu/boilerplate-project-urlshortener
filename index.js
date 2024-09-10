require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlParser = require('url');

const app = express();

const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db('url_shortener');
const urls = db.collection('urls');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  dns.lookup(urlParser.parse(originalUrl).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: 'Invalid URL' });
    } else {
      const urlCount = await urls.countDocuments({});

      const urlDoc = {
        url: originalUrl,
        short_url: urlCount,
      };

      const result = await urls.insertOne(urlDoc);

      console.log(result);

      res.json({ original_url: originalUrl, short_url: urlCount });
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = parseInt(req.params.short_url, 10); // Convert short_url to an integer
  try {
    const urlDoc = await urls.findOne({ short_url: shortUrl });
    console.log(urlDoc.url);

    if (!urlDoc) {
      return res.status(404).json({ error: 'No short URL found' });
    }

    res.redirect(urlDoc.url);
  } catch (error) {
    console.error('Error finding URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
