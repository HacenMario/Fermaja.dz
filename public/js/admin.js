const API_BASE = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://fermaja-backend.onrender.com';


document.addEventListener('DOMContentLoaded', () => {
  // التحقق من تسجيل الدخول
  if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = '/login.html';
    return;
  }

  const tbody = document.getElementById('ordersBody');
  const filterDate = document.getElementById('filterDate');
  const filterLabel = document.getElementById('filterLabel');
  let allOrders = [];

  // عناصر الإحصائيات
  const totalOrdersEl = document.getElementById('totalOrders');
  const newOrdersEl = document.getElementById('newOrders');
  const acceptedOrdersEl = document.getElementById('acceptedOrders');
  const completedOrdersEl = document.getElementById('completedOrders');
  const sumWithDeliveryEl = document.getElementById('sumWithDelivery');
  const sumWithoutDeliveryEl = document.getElementById('sumWithoutDelivery');
  const deliveryTotalEl = document.getElementById('deliveryTotal');

  if (filterDate) {
    const today = new Date().toISOString().split('T')[0];
    filterDate.value = today;
  }

  // جلب الطلبات
  async function fetchOrders() {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem('isLoggedIn');
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        allOrders = result.data || [];
        applyFilter();
      } else {
        console.error('API returned error:', result.error);
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="13">حدث خطأ في تحميل الطلبات</td></tr>';
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="13">حدث خطأ في تحميل الطلبات</td></tr>';
      }
    }
  }

  // تطبيق الفلتر (مع استبعاد المرفوض)
  function applyFilter() {
    const date = filterDate ? filterDate.value : '';
    let filtered = [];

    // التأكد من أن allOrders مصفوفة
    if (!Array.isArray(allOrders)) {
      allOrders = [];
    }

    // استبعاد الطلبات المرفوضة من جميع القوائم
    const nonRejected = allOrders.filter(o => o.status !== 'مرفوض');

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filtered = nonRejected.filter(o => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
      });
      if (filterLabel) filterLabel.textContent = `📅 ${date}`;
    } else {
      filtered = [...nonRejected];
      if (filterLabel) filterLabel.textContent = 'عرض الكل (باستثناء المرفوض) - Afficher tout (hors rejetés)';
    }

    renderOrders(filtered);
    updateStats(filtered);
    updateSummary(filtered);
  }

  // عرض الطلبات
  function renderOrders(orders) {
    if (!tbody) return;
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="13" class="no-orders">لا توجد طلبات في هذا اليوم</td></tr>';
      return;
    }
    let html = '';
    orders.forEach((order, index) => {
      const statusClass = {
        'جديد': 'status-new',
        'مقبول': 'status-accepted',
        'مرفوض': 'status-rejected',
        'مكتمل': 'status-completed'
      }[order.status] || 'status-new';

      const priceWithoutDelivery = (order.totalPrice || 0) - (order.deliveryFee || 0);

      html += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${order.name || ''}</strong></td>
          <td>${order.phone || ''}</td>
          <td>${order.sandwich || ''}</td>
          <td>${order.supplements && order.supplements.length ? order.supplements.join(', ') : '-'}</td>
          <td>${order.dessert || '-'}</td>
          <td>${order.drink || '-'}</td>
          <td>${order.commune || ''}</td>
          <td>${priceWithoutDelivery} DA</td>
          <td>${order.deliveryFee || 0} DA</td>
          <td><strong>${order.totalPrice || 0} DA</strong></td>
          <td><span class="status-badge ${statusClass}">${order.status || ''}</span></td>
          <td class="no-print">
            ${order.status === 'جديد' ? `<button class="btn-status btn-accept" data-id="${order._id}" data-status="مقبول">قبول</button>` : ''}
            ${order.status === 'جديد' ? `<button class="btn-status btn-reject" data-id="${order._id}" data-status="مرفوض">رفض</button>` : ''}
            ${order.status === 'مقبول' ? `<button class="btn-status btn-complete" data-id="${order._id}" data-status="مكتمل">إكمال</button>` : ''}
            ${order.status === 'مرفوض' ? `<span style="color:#dc3545;font-weight:700;">❌ مرفوض</span>` : ''}
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;

    // أزرار تغيير الحالة
    document.querySelectorAll('.btn-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        try {
          const response = await fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          const result = await response.json();
          if (result.success) {
            fetchOrders();
          } else {
            alert('فشل تحديث الحالة');
          }
        } catch (err) {
          alert('خطأ في الاتصال');
          console.error(err);
        }
      });
    });
  }

  // تحديث الإحصائيات
  function updateStats(orders) {
    if (!orders || !Array.isArray(orders)) orders = [];
    const total = orders.length;
    const newCount = orders.filter(o => o.status === 'جديد').length;
    const acceptedCount = orders.filter(o => o.status === 'مقبول').length;
    const completedCount = orders.filter(o => o.status === 'مكتمل').length;

    if (totalOrdersEl) totalOrdersEl.textContent = total;
    if (newOrdersEl) newOrdersEl.textContent = newCount;
    if (acceptedOrdersEl) acceptedOrdersEl.textContent = acceptedCount;
    if (completedOrdersEl) completedOrdersEl.textContent = completedCount;
  }

  // تحديث ملخص المبالغ
  function updateSummary(orders) {
    if (!orders || !Array.isArray(orders)) orders = [];
    let sumWith = 0, sumWithout = 0, deliverySum = 0;
    orders.forEach(o => {
      const total = o.totalPrice || 0;
      const delivery = o.deliveryFee || 0;
      sumWith += total;
      sumWithout += (total - delivery);
      deliverySum += delivery;
    });
    if (sumWithDeliveryEl) sumWithDeliveryEl.textContent = sumWith.toLocaleString() + ' DA';
    if (sumWithoutDeliveryEl) sumWithoutDeliveryEl.textContent = sumWithout.toLocaleString() + ' DA';
    if (deliveryTotalEl) deliveryTotalEl.textContent = deliverySum.toLocaleString() + ' DA';
  }

  // إعادة ضبط الفلتر
  window.resetFilter = function() {
    if (filterDate) filterDate.value = '';
    applyFilter();
  };

  window.applyFilter = applyFilter;

  // الاستماع لـ SSE
  function connectSSE() {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'newOrder') {
          fetchOrders(); // تحديث الجدول والإحصائيات تلقائياً
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(() => {});
        }
      } catch (e) {}
    };
    eventSource.onerror = () => setTimeout(connectSSE, 3000);
  }

  // بدء التحميل
  fetchOrders();
  connectSSE();
});