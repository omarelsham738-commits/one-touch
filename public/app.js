function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

async function processVideo() {
  const url = document.getElementById('youtubeUrl').value.trim();
  if (!url) return showToast('❌ ادخل لينك يوتيوب');
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) return showToast('❌ لازم يوتيوب');
  
  showScreen('processing');
  animateProgress();
  
  try {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    completeProgress();
    setTimeout(() => displayResults(data.shorts), 800);
  } catch (e) {
    showScreen('home');
    showToast('❌ ' + e.message);
  }
}

function animateProgress() {
  const steps = [
    { p: 20, t: 'تحميل الفيديو...' },
    { p: 40, t: 'تفريغ الصوت...' },
    { p: 60, t: 'تحليل بالذكاء الاصطناعي...' },
    { p: 80, t: 'اختيار أفضل اللحظات...' },
    { p: 95, t: 'تجهيز الشورتات...' }
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i >= steps.length) return clearInterval(interval);
    document.getElementById('progressFill').style.width = steps[i].p + '%';
    document.getElementById('processingStep').textContent = steps[i].t;
    i++;
  }, 1500);
}

function completeProgress() {
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('processingStep').textContent = 'تم! ✨';
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
        <div class="short-title">${s.title || 'بدون عنوان'}</div>
        <div class="score-badge ${cls}">${icon} ${score}%</div>
      </div>
      <div class="short-time">⏱ ${s.start} → ${s.end}</div>
      <div class="short-reason">${s.reason || ''}</div>
      <div class="short-actions">
        <button class="btn-action btn-download" onclick="showToast('⏳ قريباً')">⬇️ تحميل</button>
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
    try { await navigator.share({ title: s.title, text }); } catch(e) {}
  } else {
    navigator.clipboard.writeText(text);
    showToast('✅ تم النسخ');
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
