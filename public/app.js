function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

async function processVideo() {
  const url = document.getElementById('youtubeUrl').value.trim();
  if (!url) return showToast('❌ ادخل لينك يوتيوب');
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return showToast('❌ لازم يكون لينك يوتيوب');
  }

  showScreen('processing');
  animateProgress();

  try {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('السيرفر رجّع رد غير متوقع');
    }

    if (!res.ok) {
      throw new Error(data.error || 'حصل خطأ');
    }

    completeProgress();
    setTimeout(() => displayResults(data.shorts || []), 600);
  } catch (e) {
    showScreen('home');
    showToast('❌ ' + (e.message || 'حصل خطأ'));
  }
}

function animateProgress() {
  const steps = [
    { p: 20, t: 'تحميل الفيديو...' },
    { p: 45, t: 'تحليل المحتوى...' },
    { p: 70, t: 'اختيار أفضل اللحظات...' },
    { p: 90, t: 'تجهيز الشورتات...' }
  ];
  let i = 0;
  window._progressTimer = setInterval(() => {
    if (i >= steps.length) return clearInterval(window._progressTimer);
    document.getElementById('progressFill').style.width = steps[i].p + '%';
    document.getElementById('processingStep').textContent = steps[i].t;
    i++;
  }, 700);
}

function completeProgress() {
  if (window._progressTimer) clearInterval(window._progressTimer);
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('processingStep').textContent = 'تم! ✨';
  document.getElementById('processingTitle').textContent = 'جاهز!';
}

function displayResults(shorts) {
  const list = document.getElementById('shortsList');
  list.innerHTML = '';

  if (!shorts || !shorts.length) {
    list.innerHTML = '<p style="text-align:center">لا توجد نتائج</p>';
    showScreen('results');
    return;
  }

  shorts.forEach((s, i) => {
    const score = s.viralScore || 0;
    const cls = score >= 80 ? 'score-high' : score >= 60 ? 'score-mid' : 'score-low';
    const icon = score >= 80 ? '🔥' : score >= 60 ? '✅' : '⚠️';

    const card = document.createElement('div');
    card.className = 'short-card';
    card.innerHTML = `
      <div class="short-header">
        <div class="short-title">${s.title || 'شورت'}</div>
        <div class="score-badge ${cls}">${icon} ${score}%</div>
      </div>
      <div class="short-time">⏱ ${s.start || '00:00'} → ${s.end || '00:45'}</div>
      <div class="short-reason">${s.reason || ''}</div>
      <div class="short-actions">
        <button class="btn-action btn-download" onclick="showToast('⏳ التحميل الحقيقي المرحلة الجاية')">⬇️ تحميل</button>
        <button class="btn-action btn-share" onclick="shareShort(${i})">🔗 مشاركة</button>
      </div>
    `;
    list.appendChild(card);
  });

  window.currentShorts = shorts;
  showScreen('results');
}

async function shareShort(i) {
  const s = window.currentShorts[i];
  const text = `${s.title}\n⏱ ${s.start} → ${s.end}\n📊 ${s.viralScore}%\n\n🎬 One Touch`;
  if (navigator.share) {
    try { await navigator.share({ title: s.title, text }); } catch (e) {}
  } else {
    try {
      await navigator.clipboard.writeText(text);
      showToast('✅ تم النسخ');
    } catch (e) {
      showToast(text);
    }
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
                                      }
