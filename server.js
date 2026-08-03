require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const webpush = require('web-push');
const nodemailer = require('nodemailer');
const orderRoutes = require('./routes/orders');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== إعداد البريد الإلكتروني =====
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ فشل الاتصال بخادم البريد:', error);
  } else {
    console.log('✅ جاهز لإرسال البريد الإلكتروني');
  }
});
app.set('transporter', transporter);

// ===== إعداد VAPID =====
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.use(cors());
app.use(express.json());

// ===== تقديم الملفات الثابتة =====
// في Render، نستخدم مجلد public مباشرة
// في Vercel، سيتم التعامل مع الملفات الثابتة بشكل منفصل
app.use(express.static('public'));

// ========== نقاط النهاية العامة ==========

// تسجيل الدخول
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    return res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
  }
  return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
});

// مسارات الطلبات
app.use('/api/orders', orderRoutes);

// المفتاح العام لـ Web Push
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// اشتراكات Web Push
let subscriptions = [];
app.post('/api/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Subscription saved.' });
});

app.post('/api/notify', (req, res) => {
  const payload = req.body.payload || 'إشعار جديد!';
  const options = { TTL: 60 };
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, payload, options).catch(err => console.error(err));
  });
  res.json({ message: 'Notifications sent.' });
});

// ========== نقطة نهاية SSE ==========
const clients = [];

app.get('/api/events', (req, res) => {
  console.log('📡 عميل جديد يتصل بـ /api/events');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

  clients.push(res);
  console.log(`📡 عدد العملاء المتصلين: ${clients.length}`);

  req.on('close', () => {
    console.log('📡 عميل قطع الاتصال');
    const index = clients.indexOf(res);
    if (index > -1) clients.splice(index, 1);
    console.log(`📡 عدد العملاء المتصلين: ${clients.length}`);
  });
});

function sendSSEEvent(data) {
  console.log(`📤 إرسال حدث SSE للـ ${clients.length} عميل:`, data);
  clients.forEach((client, index) => {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error(`❌ فشل إرسال حدث للعميل ${index}:`, err);
      clients.splice(index, 1);
    }
  });
}
app.set('sendSSEEvent', sendSSEEvent);

// ========== الاتصال بقاعدة البيانات ==========
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ========== تشغيل الخادم ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ===== تصدير التطبيق لـ Vercel (Serverless) =====
module.exports = app;