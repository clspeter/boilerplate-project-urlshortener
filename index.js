const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
var bodyParser = require('body-parser')
const shortid = require('shortid');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

const shortUrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.post("/api/shorturl", async function (req, res) {
  try {
    const url = req.body.url;
    console.log(url);
    const match = url.match('^(?:http[s]?:\/\/)([a-zA-Z0-9.-]+)');
    if (!match) {
      throw new Error('invalid url');
    }
    const hostname = match[1];
    const dnsLookup = await dns.promises.lookup(hostname);
    console.log(dnsLookup);
    const findExistUrl = await ShortUrl.findOne({ original_url: url }).exec();
    console.log(findExistUrl);
    if (findExistUrl) {
      res.json({
        original_url: findExistUrl.original_url,
        short_url: findExistUrl.short_url,
      });
    } else {
      const data = new ShortUrl({
        original_url: url,
        short_url: shortid.generate(),
      });
      await data.save();
      res.json({ original_url: data.original_url, short_url: data.short_url });
    }
  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});

app.get("/api/shorturl/:short_url", async function (req, res) {
  try {
    const shortUrl = req.params.short_url;
    const foundUrl = await ShortUrl.findOne({ short_url: shortUrl }).exec();
    if (foundUrl) {
      console.log(foundUrl.original_url)
      res.redirect(foundUrl.original_url);
    }
    else {
      res.json({ error: "invalid short url" })
    }
  }
  catch (error) {
    console.log(error)
    res.json({ error: "invalid short url" })
  }
});



