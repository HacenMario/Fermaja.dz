require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
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
// verifier is attached after helper declaration below

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
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

// ========== نقاط النهاية العامة ==========

// ===== المصادقة الإدارية =====
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.createHash('sha256')
  .update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:${process.env.MONGODB_URI || 'fermaja'}`)
  .digest('hex');

function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({
    role: 'admin',
    iat: Date.now()
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(parts[0]).digest('base64url');
  if (parts[1].length !== expected.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return payload.role === 'admin' && Date.now() - payload.iat < 12 * 60 * 60 * 1000;
  } catch (_) {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ success: false, message: 'غير مصرح' });
  }
  next();
}

app.set('verifyAdminToken', verifyAdminToken);

// تسجيل الدخول
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token: createAdminToken()
      });
    }
    return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
  } catch (error) {
    console.error('❌ خطأ في /api/login:', error);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  }
});

// فحص صحة الخدمة
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ({0:'disconnected',1:'connected',2:'connecting',3:'disconnecting'})[dbState] || 'unknown';
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
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
const subscriptions = new Map();

app.post('/api/subscribe', (req, res) => {
  try {
    const sub = req.body || {};
    if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return res.status(400).json({ error: 'اشتراك Web Push غير صالح' });
    }
    subscriptions.set(sub.endpoint, sub);
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify', requireAdmin, async (req, res) => {
  try {
    const payload = req.body.payload || 'إشعار جديد!';
    const options = { TTL: 60 };
    const results = [];
    for (const [endpoint, sub] of subscriptions.entries()) {
      try {
        await webpush.sendNotification(sub, payload, options);
        results.push({ endpoint, success: true });
      } catch (err) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          subscriptions.delete(endpoint);
        }
        results.push({ endpoint, success: false });
      }
    }
    res.json({ message: 'Notifications sent.', sent: results.filter(x => x.success).length });
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

  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const isAdminClient = verifyAdminToken(token);
  res.locals.isAdminClient = isAdminClient;
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

const sseHeartbeat = setInterval(() => {
  clients.slice().forEach(client => {
    try { client.write(': heartbeat\\n\\n'); } catch (_) {}
  });
}, 25000);

function sendSSEEvent(data) {
  console.log(`📤 إرسال حدث SSE للـ ${clients.length} عميل:`, data);
  clients.slice().forEach((client, index) => {
    try {
      const safeData = client.locals && client.locals.isAdminClient
        ? data
        : { type: data && data.type ? data.type : 'event' };
      client.write(`data: ${JSON.stringify(safeData)}\n\n`);
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
