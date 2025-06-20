require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors());
app.use(express.json());

let db, newsCollection, adsCollection;

client.connect().then(() => {
  db = client.db("newsplus");
  newsCollection = db.collection("news");
  adsCollection = db.collection("ads");
  console.log("✅ Connected to MongoDB");
});

// ====== الأخبار ======
app.get('/api/news', async (req, res) => {
  const news = await newsCollection.find().sort({ date: -1 }).toArray();
  res.json(news);
});

app.post('/api/news', async (req, res) => {
  const news = req.body;
  news.date = new Date().toLocaleDateString('ar-SA');
  news.views = 0;
  const result = await newsCollection.insertOne(news);
  res.json(result);
});

// ====== الإعلانات ======
app.get('/api/ads', async (req, res) => {
  const ads = await adsCollection.find().sort({ date: -1 }).toArray();
  res.json(ads);
});

app.post('/api/ads', async (req, res) => {
  const ad = req.body;
  ad.date = new Date().toLocaleDateString('ar-SA');
  ad.views = 0;
  const result = await adsCollection.insertOne(ad);
  res.json(result);
});

app.delete('/api/ads/:id', async (req, res) => {
  const result = await adsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json(result);
});

// زيادة المشاهدات
app.patch('/api/ads/views/:id', async (req, res) => {
  await adsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $inc: { views: 1 } }
  );
  res.json({ message: 'View count incremented.' });
});

const ADMIN_KEY = process.env.ADMIN_KEY;
app.patch('/api/ads/views-admin/:id', async (req, res) => {
  const { adminKey } = req.body;
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  await adsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $inc: { views: 10 } }
  );
  res.json({ message: 'Admin view boost successful.' });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
