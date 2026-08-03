document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 lead.js: DOM loaded (نموذج الطلب)');

  const form = document.getElementById('orderForm');
  const feedback = document.getElementById('formFeedback');

  const sandwichSelect = document.getElementById('sandwich');
  const supplementsCheckboxes = document.querySelectorAll('input[name="supplements"]');
  const dessertSelect = document.getElementById('dessert');
  const drinkSelect = document.getElementById('drink');
  const communeSelect = document.getElementById('commune');
  const totalDisplay = document.getElementById('totalPriceDisplay');

  // حساب السعر
  function calculateTotal() {
    let total = 0;

    const selectedSandwich = sandwichSelect.options[sandwichSelect.selectedIndex];
    if (selectedSandwich && selectedSandwich.dataset.price) {
      total += parseInt(selectedSandwich.dataset.price);
    }

    supplementsCheckboxes.forEach(cb => {
      if (cb.checked) total += parseInt(cb.dataset.price);
    });

    const selectedDessert = dessertSelect.options[dessertSelect.selectedIndex];
    if (selectedDessert && selectedDessert.dataset.price) {
      total += parseInt(selectedDessert.dataset.price);
    }

    const selectedDrink = drinkSelect.options[drinkSelect.selectedIndex];
    if (selectedDrink && selectedDrink.dataset.price) {
      total += parseInt(selectedDrink.dataset.price);
    }

    const selectedCommune = communeSelect.options[communeSelect.selectedIndex];
    let deliveryFee = 0;
    if (selectedCommune && selectedCommune.dataset.fee) {
      deliveryFee = parseInt(selectedCommune.dataset.fee);
      total += deliveryFee;
    }

    totalDisplay.textContent = total + ' DA';
    document.getElementById('deliveryFeeHidden').value = deliveryFee;
    document.getElementById('totalPriceHidden').value = total;
  }

  sandwichSelect.addEventListener('change', calculateTotal);
  supplementsCheckboxes.forEach(cb => cb.addEventListener('change', calculateTotal));
  dessertSelect.addEventListener('change', calculateTotal);
  drinkSelect.addEventListener('change', calculateTotal);
  communeSelect.addEventListener('change', calculateTotal);
  calculateTotal();

  // ===== إرسال النموذج =====
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // عرض رسالة "جاري الإرسال..."
    feedback.textContent = '⏳ جاري الإرسال...';
    feedback.className = 'feedback';
    feedback.style.color = '#333';
    feedback.style.backgroundColor = '#f0f0f0';

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const sandwich = sandwichSelect.value;
    const commune = communeSelect.value;
    const deliveryFee = parseInt(document.getElementById('deliveryFeeHidden').value) || 0;
    const totalPrice = parseInt(document.getElementById('totalPriceHidden').value) || 0;

    const supplements = [];
    supplementsCheckboxes.forEach(cb => { if (cb.checked) supplements.push(cb.value); });
    const dessert = dessertSelect.value;
    const drink = drinkSelect.value;

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !sandwich || !commune) {
      feedback.textContent = '❌ الرجاء ملء جميع الحقول المطلوبة.';
      feedback.className = 'feedback error';
      feedback.style.color = '#721c24';
      feedback.style.backgroundColor = '#f8d7da';
      return;
    }

    const orderData = { 
      name, 
      phone, 
      sandwich, 
      supplements, 
      dessert, 
      drink, 
      commune, 
      deliveryFee, 
      totalPrice 
    };

    try {
      console.log('📤 إرسال الطلب:', orderData);
      
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      console.log('📥 استجابة الخادم:', response.status, response.statusText);

      // محاولة قراءة الاستجابة حتى لو لم تكن JSON
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // إذا لم تكن JSON، نقرأها كنص
        const text = await response.text();
        console.warn('⚠️ استجابة غير JSON:', text);
        result = { success: false, error: 'استجابة غير متوقعة من الخادم' };
      }

      console.log('📦 نتيجة الطلب:', result);

      if (response.ok && result.success) {
        // ✅ رسالة النجاح المطلوبة
        feedback.textContent = '✅ تم قبول طلبك بنجاح، سنتصل بك في أقرب الأجال لتأكيد طلبيتك.';
        feedback.className = 'feedback success';
        feedback.style.color = '#155724';
        feedback.style.backgroundColor = '#d4edda';
        form.reset();
        setTimeout(calculateTotal, 100);
      } else {
        // ❌ رسالة الخطأ
        const errorMsg = result.error || result.message || 'حدث خطأ غير متوقع';
        feedback.textContent = `❌ ${errorMsg}`;
        feedback.className = 'feedback error';
        feedback.style.color = '#721c24';
        feedback.style.backgroundColor = '#f8d7da';
      }
    } catch (error) {
      console.error('❌ خطأ في الاتصال:', error);
      feedback.textContent = '❌ تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.';
      feedback.className = 'feedback error';
      feedback.style.color = '#721c24';
      feedback.style.backgroundColor = '#f8d7da';
    }
  });
});
