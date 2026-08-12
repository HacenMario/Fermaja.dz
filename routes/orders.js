const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

const ALLOWED_STATUSES = ['جديد', 'مقبول', 'مرفوض', 'مكتمل', 'ملغى', 'قيد التحضير', 'قيد التوصيل'];

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const verify = req.app.get('verifyAdminToken');
  if (!verify || !verify(token)) return res.status(401).json({ success: false, message: 'غير مصرح' });
  next();
}


// POST - إنشاء طلب جديد
router.post('/', async (req, res) => {
  try {
    const { name, phone, sandwich, supplements, dessert, drink, commune, deliveryFee, totalPrice } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanSandwich = typeof sandwich === 'string' ? sandwich.trim() : '';
    const cleanCommune = typeof commune === 'string' ? commune.trim() : '';
    const safeSupplements = Array.isArray(supplements) ? supplements.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean) : [];
    const safeDessert = typeof dessert === 'string' ? dessert.trim() : '';
    const safeDrink = typeof drink === 'string' ? drink.trim() : '';
    const numericDelivery = Number(deliveryFee);
    const numericTotal = Number(totalPrice);

    if (!cleanName || !cleanPhone || !cleanSandwich || !cleanCommune) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    }
    if (cleanName.length > 120 || cleanPhone.length > 30 || cleanSandwich.length > 200 || cleanCommune.length > 120) {
      return res.status(400).json({ error: 'بيانات الطلب غير صالحة' });
    }
    if (!Number.isFinite(numericDelivery) || numericDelivery < 0 || !Number.isFinite(numericTotal) || numericTotal < 0) {
      return res.status(400).json({ error: 'السعر غير صالح' });
    }

    if (!name || !phone || !sandwich || !commune) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    }
    const newOrder = new Order({
      name: cleanName,
      phone: cleanPhone,
      sandwich: cleanSandwich,
      supplements: safeSupplements,
      dessert: safeDessert,
      drink: safeDrink,
      commune: cleanCommune,
      deliveryFee: numericDelivery,
      totalPrice: numericTotal,
      status: 'جديد'
    });
    await newOrder.save();
    console.log('✅ تم حفظ طلب جديد:', newOrder);

    // ===== إرسال إشعار SSE =====
    const sendSSE = req.app.get('sendSSEEvent');
    if (sendSSE) {
      console.log('📤 جاري إرسال SSE للطلب الجديد...');
      sendSSE({ type: 'newOrder', data: newOrder });
      console.log('✅ تم إرسال SSE');
    }

    // ===== إرسال البريد الإلكتروني =====
    const transporter = req.app.get('transporter');
    if (transporter) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailContent = `
          🧀 طلب جديد من فرماجة! 🧀

          📋 تفاصيل الطلب:
          ─────────────────────
          👤 الاسم: ${escapeHtml(name)}
          📱 الهاتف: ${escapeHtml(phone)}
          🧀 الساندويش: ${escapeHtml(sandwich)}
          🧂 الإضافات: ${escapeHtml(supplements && supplements.length ? supplements.join(', ') : 'لا يوجد')}
          🍰 التحلية: ${escapeHtml(dessert || 'لا يوجد')}
          🥤 المشروب: ${escapeHtml(drink || 'لا يوجد')}
          📍 البلدية: ${escapeHtml(commune)}
          🚚 رسوم التوصيل: ${escapeHtml(deliveryFee)} DA
          💰 السعر الإجمالي: ${escapeHtml(totalPrice)} DA
          📅 تاريخ الطلب: ${new Date().toLocaleString('ar-DZ')}
          ─────────────────────
          🔗 رابط الطلب: ${process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`}/admin.html
        `;

        const mailOptions = {
          from: `"فرماجة" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          subject: `🧀 طلب جديد من ${escapeHtml(name)} - ${escapeHtml(sandwich)}`,
          text: emailContent,
          html: `
            <div dir="rtl" style="font-family: 'Cairo', sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef9f0; border-radius: 20px; border: 2px solid #e6a800;">
              <h1 style="color: #2b5e2b; text-align: center;">🧀 طلب جديد من فرماجة!</h1>
              <div style="background: #fff; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h3 style="color: #e6a800;">📋 تفاصيل الطلب:</h3>
                <p><strong>👤 الاسم:</strong> ${escapeHtml(name)}</p>
                <p><strong>📱 الهاتف:</strong> ${escapeHtml(phone)}</p>
                <p><strong>🧀 الساندويش:</strong> ${escapeHtml(sandwich)}</p>
                <p><strong>🧂 الإضافات:</strong> ${escapeHtml(supplements && supplements.length ? supplements.join(', ') : 'لا يوجد')}</p>
                <p><strong>🍰 التحلية:</strong> ${escapeHtml(dessert || 'لا يوجد')}</p>
                <p><strong>🥤 المشروب:</strong> ${escapeHtml(drink || 'لا يوجد')}</p>
                <p><strong>📍 البلدية:</strong> ${escapeHtml(commune)}</p>
                <p><strong>🚚 رسوم التوصيل:</strong> ${escapeHtml(deliveryFee)} DA</p>
                <p style="font-size: 1.4rem; font-weight: 800; color: #e6a800;"><strong>💰 السعر الإجمالي:</strong> ${escapeHtml(totalPrice)} DA</p>
                <p><strong>📅 تاريخ الطلب:</strong> ${new Date().toLocaleString('ar-DZ')}</p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`}/admin.html" style="background: #2b5e2b; color: #fff; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: 700;">📊 عرض الطلب في لوحة التحكم</a>
              </div>
              <p style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8rem;">© فرماجة 2026</p>
            </div>
          `
        };

        try {
          transporter.sendMail(mailOptions)
            .then(() => console.log(`✅ تم إرسال البريد الإلكتروني إلى ${adminEmail}`))
            .catch(emailError => console.error('❌ فشل إرسال البريد الإلكتروني:', emailError));
        } catch (emailError) {
          console.error('❌ فشل إرسال البريد الإلكتروني:', emailError);
          // لا نوقف الـ response، فقط نسجل الخطأ
        }
      } else {
        console.warn('⚠️ ADMIN_EMAIL غير مضبوط في ملف .env');
      }
    } else {
      console.warn('⚠️ transporter غير متوفر');
    }

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('❌ خطأ في إنشاء الطلب:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - جلب جميع الطلبات
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10) || 100, 1), 500);
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - تحديث حالة طلب
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !ALLOWED_STATUSES.includes(status)) return res.status(400).json({ error: 'حالة الطلب غير صالحة' });
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;