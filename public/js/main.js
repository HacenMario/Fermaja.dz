document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 main.js: DOM loaded');

  // ===== التحقق من حالة تسجيل الدخول =====
  function isAdmin() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  }

  // ===== الإشعارات الفورية (SSE) =====
  function playNotificationSound() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => console.log('⚠️ تعذر تشغيل الصوت'));
  }

  function createOrderModal(order) {
    console.log('🟢 createOrderModal تم استدعاؤها مع:', order);

    if (!isAdmin()) {
      console.log('⛔ المستخدم ليس أدمن، لن يتم عرض المودال');
      return;
    }

    const oldModal = document.getElementById('orderModal');
    if (oldModal) oldModal.remove();

    if (!order || !order._id) {
      console.error('❌ بيانات الطلب غير مكتملة:', order);
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'orderModal';
    modal.style.cssText = `
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.6);
      display: flex; justify-content: center; align-items: center;
      z-index: 10000; animation: fadeIn 0.3s;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: var(--card-bg, #fff);
      max-width: 600px; width: 92%;
      padding: 30px; border-radius: 22px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative; max-height: 90vh; overflow-y: auto;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute; top: 12px; left: 16px;
      background: none; border: none;
      font-size: 1.8rem; cursor: pointer;
      color: var(--text, #333);
    `;
    closeBtn.onclick = () => modal.remove();

    const content = document.createElement('div');
    content.innerHTML = `
      <h2 style="color: var(--secondary, #2b5e2b); margin-bottom: 16px;">📩 طلب جديد</h2>
      <p><strong>الاسم:</strong> ${order.name || 'غير معروف'}</p>
      <p><strong>الهاتف:</strong> ${order.phone || 'غير معروف'}</p>
      <p><strong>الساندويش:</strong> ${order.sandwich || 'غير معروف'}</p>
      <p><strong>الإضافات:</strong> ${order.supplements && order.supplements.length ? order.supplements.join(', ') : 'لا يوجد'}</p>
      <p><strong>التحلية:</strong> ${order.dessert || 'لا يوجد'}</p>
      <p><strong>المشروب:</strong> ${order.drink || 'لا يوجد'}</p>
      <p><strong>البلدية:</strong> ${order.commune || 'غير معروف'}</p>
      <p><strong>رسوم التوصيل:</strong> ${order.deliveryFee || 0} DA</p>
      <p><strong>السعر الإجمالي:</strong> <span style="font-weight:800;color:var(--primary, #e6a800);">${order.totalPrice || 0} DA</span></p>
      <p><strong>الحالة:</strong> <span id="orderStatusLabel">${order.status || 'جديد'}</span></p>
    `;

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = '✅ قبول الطلب';
    acceptBtn.style.cssText = `
      display: block; width: 100%; margin-top: 18px; padding: 13px;
      background: var(--secondary, #2b5e2b); color: #fff;
      border: none; border-radius: 50px;
      font-size: 1.1rem; font-weight: 700;
      cursor: pointer; transition: 0.3s;
    `;
    acceptBtn.onclick = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${order._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'مقبول' })
        });
        const result = await res.json();
        if (result.success) {
          const statusLabel = document.getElementById('orderStatusLabel');
          if (statusLabel) statusLabel.textContent = 'مقبول';
          acceptBtn.disabled = true;
          acceptBtn.textContent = '✅ تم القبول';
          acceptBtn.style.background = '#888';
        } else {
          alert('حدث خطأ أثناء قبول الطلب');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالخادم');
        console.error(err);
      }
    };

    card.appendChild(closeBtn);
    card.appendChild(content);
    card.appendChild(acceptBtn);
    modal.appendChild(card);
    document.body.appendChild(modal);
    console.log('✅ تم عرض المودال');
    playNotificationSound();
  }

  // ===== اتصال SSE =====
  let eventSource = null;

  function connectSSE() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    try {
      const sseUrl = `${API_BASE}/api/events`;
      eventSource = new EventSource(sseUrl);
      console.log(`🔄 main.js: جاري الاتصال بـ SSE (${sseUrl})...`);

      eventSource.onopen = () => {
        console.log('✅ main.js: اتصال SSE ناجح');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 main.js: استلام حدث:', data);

          if (data.type === 'newOrder') {
            if (isAdmin()) {
              console.log('👤 أدمن - سيتم عرض المودال');
              setTimeout(() => {
                createOrderModal(data.data);
              }, 150);

              // toast
              const toast = document.createElement('div');
              toast.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: var(--secondary, #2b5e2b); color: #fff;
                padding: 14px 24px; border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                z-index: 9999; font-weight: 700;
                animation: slideIn 0.4s ease;
              `;
              toast.textContent = `📩 طلب جديد من ${data.data.name || 'زبون'}`;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 5000);
            } else {
              console.log('👤 مستخدم عادي - لن يتم عرض المودال');
            }
          }
        } catch (e) {
          console.error('❌ main.js: خطأ في معالجة الحدث:', e);
        }
      };

      eventSource.onerror = (event) => {
        console.warn(`⚠️ main.js: خطأ في SSE، إعادة محاولة الاتصال خلال 3 ثوان... (${sseUrl})`);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        setTimeout(connectSSE, 3000);
      };
    } catch (error) {
      console.error('❌ main.js: فشل إنشاء اتصال SSE:', error);
      setTimeout(connectSSE, 3000);
    }
  }

  // ===== بدء الاتصال =====
  connectSSE();

// ===== زر العودة إلى الأعلى =====
(function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  // زر العودة إلى الأعلى
  btn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // إظهار/إخفاء الزر بناءً على التمرير
  let lastScrollY = 0;
  let ticking = false;

  function handleScroll() {
    const currentScrollY = window.scrollY || window.pageYOffset;
    const triggerPoint = 300; // يظهر بعد 300px من التمرير

    if (currentScrollY > triggerPoint) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  // استخدام requestAnimationFrame لتحسين الأداء
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // التحقق عند التحميل (في حال تم تحميل الصفحة مع تمرير)
  handleScroll();
})();
