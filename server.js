require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const webpush = require('web-push');
const orderRoutes = require('./routes/orders');

// ===== محاولة استيراد nodemailer مع معالجة الخطأ =====
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('⚠️ nodemailer غير مثبت، سيتم تعطيل البريد الإلكتروني');
}

const app = express();
const PORT = process.env.PORT || 5000;

// ===== إعداد البريد الإلكتروني (مع التحقق من المتغيرات) =====
let transporter = null;
if (nodemailer) {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('✅ تم تهيئة البريد الإلكتروني بنجاح');
    } else {
      console.warn('⚠️ متغيرات EMAIL_USER أو EMAIL_PASS غير مضبوطة، سيتم تعطيل البريد الإلكتروني');
    }
  } catch (error) {
    console.error('❌ فشل تهيئة البريد الإلكتروني:', error.message);
  }
} else {
  console.warn('⚠️ nodemailer غير متوفر، تم تعطيل البريد الإلكتروني');
}
app.set('transporter', transporter);

// ===== إعداد VAPID =====
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ تم تهيئة VAPID بنجاح');
} else {
  console.warn('⚠️ متغيرات VAPID غير مضبوطة');
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ========== نقاط النهاية العامة ==========

// تسجيل الدخول
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      return res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    }
    return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
  } catch (error) {
    console.error('❌ خطأ في /api/login:', error);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  }
});

// مسارات الطلبات
app.use('/api/orders', orderRoutes);

// المفتاح العام لـ Web Push
app.get('/api/vapid-public-key', (req, res) => {
  try {
    if (process.env.VAPID_PUBLIC_KEY) {
      res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
    } else {
      res.status(500).json({ error: 'VAPID_PUBLIC_KEY غير مضبوط' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// اشتراكات Web Push
let subscriptions = [];
app.post('/api/subscribe', (req, res) => {
  try {
    subscriptions.push(req.body);
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify', (req, res) => {
  try {
    const payload = req.body.payload || 'إشعار جديد!';
    const options = { TTL: 60 };
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload, options).catch(err => console.error(err));
    });
    res.json({ message: 'Notifications sent.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGODB_URI غير مضبوط');
}

// ========== تشغيل الخادم ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ===== تصدير التطبيق لـ Vercel (Serverless) =====
module.exports = app;
