const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST - إنشاء طلب جديد
router.post('/', async (req, res) => {
  try {
    const { name, phone, sandwich, supplements, dessert, drink, commune, deliveryFee, totalPrice } = req.body;
    if (!name || !phone || !sandwich || !commune) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    }
    const newOrder = new Order({
      name,
      phone,
      sandwich,
      supplements: supplements || [],
      dessert: dessert || '',
      drink: drink || '',
      commune,
      deliveryFee,
      totalPrice,
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
          👤 الاسم: ${name}
          📱 الهاتف: ${phone}
          🧀 الساندويش: ${sandwich}
          🧂 الإضافات: ${supplements && supplements.length ? supplements.join(', ') : 'لا يوجد'}
          🍰 التحلية: ${dessert || 'لا يوجد'}
          🥤 المشروب: ${drink || 'لا يوجد'}
          📍 البلدية: ${commune}
          🚚 رسوم التوصيل: ${deliveryFee} DA
          💰 السعر الإجمالي: ${totalPrice} DA
          📅 تاريخ الطلب: ${new Date().toLocaleString('ar-DZ')}
          ─────────────────────
          🔗 رابط الطلب: http://localhost:${process.env.PORT || 5000}/admin.html
        `;

        const mailOptions = {
          from: `"فرماجة" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          subject: `🧀 طلب جديد من ${name} - ${sandwich}`,
          text: emailContent,
          html: `
            <div dir="rtl" style="font-family: 'Cairo', sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef9f0; border-radius: 20px; border: 2px solid #e6a800;">
              <h1 style="color: #2b5e2b; text-align: center;">🧀 طلب جديد من فرماجة!</h1>
              <div style="background: #fff; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h3 style="color: #e6a800;">📋 تفاصيل الطلب:</h3>
                <p><strong>👤 الاسم:</strong> ${name}</p>
                <p><strong>📱 الهاتف:</strong> ${phone}</p>
                <p><strong>🧀 الساندويش:</strong> ${sandwich}</p>
                <p><strong>🧂 الإضافات:</strong> ${supplements && supplements.length ? supplements.join(', ') : 'لا يوجد'}</p>
                <p><strong>🍰 التحلية:</strong> ${dessert || 'لا يوجد'}</p>
                <p><strong>🥤 المشروب:</strong> ${drink || 'لا يوجد'}</p>
                <p><strong>📍 البلدية:</strong> ${commune}</p>
                <p><strong>🚚 رسوم التوصيل:</strong> ${deliveryFee} DA</p>
                <p style="font-size: 1.4rem; font-weight: 800; color: #e6a800;"><strong>💰 السعر الإجمالي:</strong> ${totalPrice} DA</p>
                <p><strong>📅 تاريخ الطلب:</strong> ${new Date().toLocaleString('ar-DZ')}</p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="http://localhost:${process.env.PORT || 5000}/admin.html" style="background: #2b5e2b; color: #fff; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: 700;">📊 عرض الطلب في لوحة التحكم</a>
              </div>
              <p style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8rem;">© فرماجة 2026</p>
            </div>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`✅ تم إرسال البريد الإلكتروني إلى ${adminEmail}`);
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
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - تحديث حالة طلب
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'الحالة مطلوبة' });
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