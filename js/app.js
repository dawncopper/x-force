/* ============================================================
   X战力镜 · app.js
   状态机 / 揭晓动效 / 复制 / 海报(canvas) / 对比 / hash 路由 / 主题 / 多语言联动
   ============================================================ */
'use strict';

(function () {
  const XPM = window.XPM;
  const E = window.XPM.engine;
  const I18N = window.XPM.i18n;
  const T = I18N.t;        // 动态文案（含 {param} 占位）
  const L = I18N.L;        // 取 {zh,en} 对象的当前语言值
  const $ = id => document.getElementById(id);
  const els = {
    home: $('screenHome'), result: $('screenResult'), compare: $('screenCompare'), fail: $('screenFail'),
    form: $('scanForm'), input: $('scanInput'), field: $('scanField'), clear: $('inputClear'),
    scanBtn: $('scanBtn'), status: $('scanStatus'), statusText: $('scanStatusText'), quota: $('quotaNote'),
    skeleton: $('resultSkeleton'), body: $('resultBody'), actions: $('resultActions'),
    rAvatar: $('rAvatar'), rName: $('rName'), rHandle: $('rHandle'), rTier: $('rTier'),
    rScore: $('rScore'), rFollowers: $('rFollowers'), rPartial: $('rPartial'),
    rTitle: $('rTitle'), rAlias: $('rAlias'), rSpecial: $('rSpecial'), rComment: $('rComment'),
    rRarity: $('rRarity'), rEggBadge: $('rEggBadge'), rerollBtn: $('rerollBtn'),
    copyBtn: $('copyBtn'), posterBtn: $('posterBtn'), againBtn: $('againBtn'), vsBtn: $('vsBtn'),
    challengeBtn: $('challengeBtn'), trendBtn: $('trendBtn'),
    copyToast: $('copyToast'),
    vsForm: $('vsForm'), vsInput: $('vsInput'), vsGrid: $('vsGrid'), vsVerdict: $('vsVerdict'), vsBack: $('vsBack'),
    failTitle: $('failTitle'), failDesc: $('failDesc'), failBack: $('failBack'), failManual: $('failManual'),
    manualForm: $('manualForm'), mFollowers: $('mFollowers'), mFollowing: $('mFollowing'),
    mCreated: $('mCreated'), mStatuses: $('mStatuses'),
    posterOverlay: $('posterOverlay'), posterCanvas: $('posterCanvas'),
    posterDownload: $('posterDownload'), posterClose: $('posterClose'), posterToast: $('posterToast'),
    confetti: $('confetti'), themeToggle: $('themeToggle'),
    settingsOverlay: $('settingsOverlay'), soundSwitch: $('soundSwitch'), vibrateSwitch: $('vibrateSwitch'),
    challengeOverlay: $('challengeOverlay'), challengeForm: $('challengeForm'),
    challengeTarget: $('challengeTarget'), challengeLinkBox: $('challengeLinkBox'),
    challengeLink: $('challengeLink'), challengeCopyBtn: $('challengeCopyBtn'),
    challengeMine: $('challengeMine'), challengeMineEmpty: $('challengeMineEmpty'),
    challengeLandingOverlay: $('challengeLandingOverlay'), challengeLandingBody: $('challengeLandingBody'),
    trendOverlay: $('trendOverlay'), trendChart: $('trendChart'), trendEmpty: $('trendEmpty'), trendList: $('trendList'),
    lbOverlay: $('lbOverlay'), lbList: $('lbList'), lbEmpty: $('lbEmpty'),
    collectionOverlay: $('collectionOverlay'), collectionGrid: $('collectionGrid'),
    collectionProgress: $('collectionProgress'), collectionEmpty: $('collectionEmpty'),
    lbBtn: $('lbBtn'), collectionBtn: $('collectionBtn'), settingsBtn: $('settingsBtn')
  };

  let current = null;        // 当前展示 result
  let vsBase = null;         // 对比基准（第一个号）
  let lastHandle = null;     // 最近一次测算的账号（语言切换时重算用）
  let lastManual = null;     // 最近一次手填输入（语言切换时重算用）
  let lastKeyword = null;    // 最近一次彩蛋关键词

  /* ---------- 主题：明 / 暗 / 跟随系统 ---------- */
  const THEMES = ['auto', 'light', 'dark'];
  const THEME_MODE_KEY = { auto: 'theme.mode.auto', dark: 'theme.mode.dark', light: 'theme.mode.light' };
  function applyTheme(mode) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const dark = mode === 'dark' || (mode === 'auto' && mq.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }
  function themeTitle() {
    const cur = localStorage.getItem('xpm:theme') || 'auto';
    els.themeToggle.title = T('theme.title.tpl', { mode: T(THEME_MODE_KEY[cur]) });
  }
  function cycleTheme() {
    const cur = localStorage.getItem('xpm:theme') || 'auto';
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    localStorage.setItem('xpm:theme', next);
    applyTheme(next);
    themeTitle();
  }
  els.themeToggle.addEventListener('click', cycleTheme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () =>
    applyTheme(localStorage.getItem('xpm:theme') || 'auto'));

  /* ---------- 屏幕切换 ---------- */
  function showScreen(name) {
    ['home', 'result', 'compare', 'fail'].forEach(s => els[s].classList.remove('is-active'));
    const map = { home: els.home, result: els.result, compare: els.compare, fail: els.fail };
    map[name].classList.add('is-active');
    window.scrollTo({ top: 0 });
  }

  /* ---------- 输入框 ---------- */
  els.input.addEventListener('input', () => {
    els.field.classList.toggle('has-value', els.input.value.length > 0);
  });
  els.clear.addEventListener('click', () => { els.input.value = ''; els.field.classList.remove('has-value'); els.input.focus(); });
  els.input.addEventListener('keydown', e => { if (e.key === 'Escape') els.clear.click(); });

  /* ---------- 渲染头像（本地引擎用色相，真实后端换 avatar URL） ---------- */
  function renderAvatar(el, r, size) {
    if (r.avatar) {
      el.style.background = `url(${r.avatar}) center/cover`;
      el.textContent = '';
      return;
    }
    const h = r.avatarHue || 210;
    el.style.background = `linear-gradient(135deg, hsl(${h} 82% 58%), hsl(${(h + 45) % 360} 74% 46%))`;
    el.textContent = (r.name || r.username || '?').charAt(0).toUpperCase();
  }

  /* ---------- 四维标签名 ---------- */
  const DIM_KEYS = ['volume', 'structure', 'burst', 'activity'];

  /* ---------- 揭晓流程：骨架 → 揭晓 → 完成 ---------- */
  function runScan(handle, opts = {}) {
    showScreen('result');
    els.body.hidden = true; els.actions.hidden = true; els.copyToast.hidden = true;
    els.skeleton.hidden = false;
    els.rScore.classList.remove('is-popping');
    els.rTitle.classList.remove('is-dropping');

    // 骨架里先铺头像、名字、粉丝（开发文档：1 秒内出现角色卡骨架）
    const skAvatar = els.skeleton.querySelector('.skeleton--avatar');
    if (opts.preview) renderAvatar(skAvatar, opts.preview, 'sm');
    setTimeout(() => {
      els.statusText.textContent = T('status.fetching');
    }, 400);

    E.scan(handle, { keyword: opts.keyword }).then(res => {
      els.skeleton.hidden = true;
      if (!res.ok) { showFail(res.fail); return; }
      current = res.result;
      if (!res.fromCache && opts.count) E.consumeQuota();
      reveal(res.result, res.fromCache);
      updateQuota();
    }).catch(() => {
      // 网络异常兜底：优先展示本地缓存结果，避免查询失败时一无所获
      const cached = E.getCache(handle);
      if (cached) { current = cached; reveal(cached, true); updateQuota(); return; }
      showFail('fetch');
    });
  }

  function reveal(r, fromCache) {
    els.body.hidden = false; els.actions.hidden = false;
    renderAvatar(els.rAvatar, r, 'lg');
    els.rName.textContent = r.name;
    els.rHandle.textContent = '@' + r.username;
    els.rTier.textContent = r.tier;
    els.rTier.classList.toggle('is-gold', !!r.special_title);
    els.rFollowers.textContent = T('result.followers', { f: E.fmtCount(r.followers), g: E.fmtCount(r.following) });
    els.rPartial.hidden = !r.partial;
    els.rTitle.textContent = r.title;
    els.rTitle.classList.toggle('is-special', !!r.special_title);
    els.rAlias.textContent = r.alias ? T('result.aliasWrap', { a: r.alias }) : '';
    els.rSpecial.hidden = !r.special_title;
    if (r.special_title) els.rSpecial.textContent = T('result.specialPrefix') + r.special_title;
    els.rComment.textContent = r.comment;

    // 稀有度徽章（第 3 项：盲盒换梗）
    const hasRarity = r.rarity && XPM.core.RARITIES[r.rarity];
    els.rRarity.hidden = !hasRarity;
    if (hasRarity) {
      els.rRarity.textContent = T('rarity.label', { r: T('rarity.' + r.rarity) });
      els.rRarity.className = 'rarity-pill rarity-pill--' + r.rarity;
    }

    // 彩蛋徽章（第 2 项：隐藏彩蛋称号）
    const hasEgg = !!r.egg_id;
    els.rEggBadge.hidden = !hasEgg;
    if (hasEgg) {
      els.rEggBadge.textContent = '✨ ' + r.egg_badge;
      if (!fromCache) unlockEgg(r.egg_id);
    }

    // 换梗按钮：仅普通盲盒梗可换，彩蛋锁定
    els.rerollBtn.hidden = !hasRarity || hasEgg;

    // 四维条
    DIM_KEYS.forEach((k, i) => {
      const row = els.body.querySelector('.dim[data-dim="' + k + '"]');
      const bar = row.querySelector('.dim__bar i');
      const val = row.querySelector('.dim__val');
      val.textContent = r.dims[k];
      setTimeout(() => { bar.style.width = r.dims[k] + '%'; }, 250 + i * 100); // 错开 100ms
    });

    // 分数跳动 900ms
    els.rScore.classList.add('is-popping');
    animateNumber(els.rScore, 0, r.score, 900, fromCache ? 260 : 900);

    // 称号砸出 + 抽卡翻牌动效（第 6 项：揭晓动效增强）
    setTimeout(() => {
      els.rTitle.classList.add('is-dropping');
      els.body.classList.add('is-card-flip');
      setTimeout(() => els.body.classList.remove('is-card-flip'), 520);
    }, fromCache ? 40 : 320);

    // 音效 + 震动（第 6 项，受设置开关控制）
    if (!fromCache) {
      XPM.sound.play('reveal');
      XPM.sound.vibrate([40, 50, 40]);
    }

    // 首次出分爆彩粒
    if (!fromCache) burstConfetti();
    if (fromCache) els.copyToast.textContent = T('toast.cached');
    else els.copyToast.textContent = T('toast.copied');
    els.copyToast.hidden = true;
  }

  /* 彩蛋解锁：记录到本地图鉴 */
  function unlockEgg(eggKey) {
    try {
      const list = JSON.parse(localStorage.getItem('xpm:eggs') || '[]');
      if (list.indexOf(eggKey) === -1) { list.push(eggKey); localStorage.setItem('xpm:eggs', JSON.stringify(list)); }
    } catch (e) { /* ignore */ }
  }
  function eggUnlocked(eggKey) {
    try { return (JSON.parse(localStorage.getItem('xpm:eggs') || '[]')).indexOf(eggKey) !== -1; } catch (e) { return false; }
  }

  function animateNumber(el, from, to, dur, delay = 0) {
    const t0 = performance.now() + delay;
    const step = now => {
      const t = Math.min(1, Math.max(0, (now - t0) / dur));
      const ease = 1 - Math.pow(1 - t, 4);
      el.textContent = (from + (to - from) * ease).toFixed(1);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = to.toFixed(1);
    };
    requestAnimationFrame(step);
  }

  /* ---------- 彩粒 ---------- */
  function burstConfetti() {
    const colors = ['#0a84ff', '#ff9f0a', '#34c759', '#ff453a', '#d4a017', '#a060ff'];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'confetti__p';
      p.style.left = (12 + Math.random() * 76) + 'vw';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
      p.style.animationDelay = (Math.random() * 0.35) + 's';
      els.confetti.appendChild(p);
      setTimeout(() => p.remove(), 2600);
    }
  }

  /* ---------- 提交 ---------- */
  els.form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = els.input.value.trim();
    const tokens = raw.split(/\s+/).filter(Boolean);
    const handle = E.parseHandle(tokens[0] || '');
    if (!handle) { els.field.style.borderColor = 'var(--danger)'; setTimeout(() => els.field.style.borderColor = '', 1200); return; }
    const keyword = tokens.slice(1).join(' ').trim() || undefined; // 彩蛋关键词：@账号 关键词
    // 配额仅作展示，不再前端拦截：本地记忆的 quotaLeft 可能失真（曾耗尽后死锁），
    // 请求始终发往后端，由后端返回真实结果与最新 quota_left（缓存命中免费）
    startScan(handle, keyword);
  });

  function startScan(handle, keyword) {
    lastHandle = handle;
    lastManual = null;
    lastKeyword = keyword;
    const cached = E.getCache(handle);
    if (cached) {
      current = cached;
      showScreen('result');
      els.body.hidden = true; els.actions.hidden = true;
      els.skeleton.hidden = false;
      els.skeleton.querySelector('.skeleton--avatar').style.background = 'none';
      setTimeout(() => { els.skeleton.hidden = true; reveal(cached, true); updateQuota(); }, 350);
      return;
    }
    els.status.hidden = false;
    els.statusText.textContent = T('status.parsing');
    els.scanBtn.classList.add('is-loading');
    els.scanBtn.disabled = true;
    setTimeout(() => {
      els.status.hidden = true;
      els.scanBtn.classList.remove('is-loading');
      els.scanBtn.disabled = false;
      runScan(handle, { count: true, keyword: keyword });
    }, 420);
  }

  /* ---------- 换梗（第 3 项：称号盲盒换梗） ---------- */
  els.rerollBtn.addEventListener('click', () => {
    if (!current || !current.rarity || current.egg_id) return;
    XPM.sound.play('tap');
    const oldRarity = current.rarity;
    const next = E.rerollTitle(current);
    current = next;
    els.rTitle.textContent = next.title;
    els.rTitle.classList.remove('is-dropping');
    void els.rTitle.offsetWidth;
    els.rTitle.classList.add('is-dropping');
    els.rComment.textContent = next.comment;
    if (next.rarity !== oldRarity) {
      els.rRarity.textContent = T('rarity.label', { r: T('rarity.' + next.rarity) });
      els.rRarity.className = 'rarity-pill rarity-pill--' + next.rarity;
    }
    XPM.sound.vibrate(20);
  });

  function showFail(type) {
    const f = XPM.FAILS[type] || XPM.FAILS.not_found;
    els.failTitle.textContent = L(f.title);
    els.failDesc.textContent = L(f.desc);
    els.failManual.hidden = type !== 'fetch';
    els.manualForm.hidden = true;
    showScreen('fail');
  }

  els.failBack.addEventListener('click', () => showScreen('home'));
  els.failManual.addEventListener('click', () => { els.manualForm.hidden = !els.manualForm.hidden; });

  els.manualForm.addEventListener('submit', e => {
    e.preventDefault();
    const m = {
      followers: Math.max(0, parseInt(els.mFollowers.value || '0', 10)),
      following: Math.max(0, parseInt(els.mFollowing.value || '0', 10)),
      created: Math.max(0, parseInt(els.mCreated.value || '0', 10)),
      statuses: Math.max(0, parseInt(els.mStatuses.value || '0', 10))
    };
    if (m.followers === 0 && m.statuses === 0) return;
    lastHandle = null;
    lastManual = m;
    current = E.scanManual('manual', m);
    showScreen('result');
    els.body.hidden = false; els.actions.hidden = false;
    els.skeleton.hidden = true;
    reveal(current, true);
  });

  /* ---------- 配额显示 ---------- */
  function updateQuota() {
    const left = E.quotaLeft();
    els.quota.hidden = left >= 5;
    els.quota.textContent = T('quota.tpl', { n: left });
  }

  /* ---------- 复制文案 ---------- */
  els.copyBtn.addEventListener('click', () => {
    if (!current) return;
    const text = E.shareText(current, true);
    copyText(text);
  });

  function copyText(text) {
    const done = () => { els.copyToast.textContent = T('toast.copied'); els.copyToast.hidden = false; setTimeout(() => els.copyToast.hidden = true, 2200); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); done();
  }

  /* ---------- 再测一个 ---------- */
  els.againBtn.addEventListener('click', () => { els.input.value = ''; els.field.classList.remove('has-value'); showScreen('home'); setTimeout(() => els.input.focus(), 60); });

  /* ---------- 对比 ---------- */
  els.vsBtn.addEventListener('click', () => {
    vsBase = current;
    els.vsInput.value = ''; els.vsGrid.hidden = true; els.vsVerdict.hidden = true;
    showScreen('compare');
    setTimeout(() => els.vsInput.focus(), 60);
  });
  els.vsBack.addEventListener('click', () => showScreen('result'));

  els.vsForm.addEventListener('submit', e => {
    e.preventDefault();
    const handle = E.parseHandle(els.vsInput.value);
    if (!handle || !vsBase) return;
    if (handle.toLowerCase() === vsBase.username.toLowerCase()) { els.vsInput.style.borderColor = 'var(--danger)'; setTimeout(() => els.vsInput.style.borderColor = '', 1200); return; }

    els.vsGrid.hidden = true; els.vsVerdict.hidden = true;
    const cached = E.getCache(handle);
    if (cached) { renderVs(cached); return; }
    if (E.quotaLeft() < 2) { els.vsVerdict.hidden = false; els.vsVerdict.textContent = T('vs.quotaShort'); return; }

    E.scan(handle).then(res => {
      if (res.ok) { renderVs(res.result); E.consumeQuota(); E.consumeQuota(); updateQuota(); }
      else { els.vsVerdict.hidden = false; els.vsVerdict.textContent = L((XPM.FAILS[res.fail] || {}).title) || T('vs.notFound'); }
    });
  });

  function renderVs(other) {
    const base = vsBase;
    els.vsGrid.innerHTML = '';
    [base, other].forEach((r, idx) => {
      const cell = document.createElement('div');
      cell.className = 'vs-cell';
      const win = (idx === 0 ? base.score : other.score) >= (idx === 0 ? other.score : base.score);
      if (win && base.score !== other.score) cell.classList.add('is-win');
      cell.innerHTML = '';
      const av = document.createElement('div');
      av.className = 'avatar avatar--sm';
      av.style.margin = '0 auto';
      renderAvatar(av, r, 'sm');
      const name = document.createElement('p'); name.className = 'vs-cell__name'; name.textContent = '@' + r.username;
      const score = document.createElement('p'); score.className = 'vs-cell__score'; score.textContent = r.score;
      const tier = document.createElement('p'); tier.className = 'vs-cell__tier'; tier.textContent = r.tier + ' · ' + r.title;
      cell.append(av, name, score, tier);
      els.vsGrid.appendChild(cell);
    });
    els.vsGrid.hidden = false;

    // 结论：谁赢在爆发，谁赢在体量
    let verdict;
    if (base.score === other.score) verdict = T('vs.tie');
    else {
      const winner = base.score > other.score ? base : other;
      const loser = winner === base ? other : base;
      const parts = [];
      if (winner.dims.burst > loser.dims.burst) parts.push(T('vs.winBurst', { u: winner.username }));
      if (winner.dims.volume > loser.dims.volume) parts.push(T('vs.winVolume', { u: winner.username }));
      if (winner.dims.activity > loser.dims.activity) parts.push(T('vs.winActivity', { u: winner.username }));
      if (!parts.length) parts.push(T('vs.winOverall', { u: winner.username }));
      verdict = parts.join(T('vs.join')) + T('vs.end') + winner.username + ': ' + winner.share_clause + '.';
    }
    els.vsVerdict.textContent = verdict;
    els.vsVerdict.hidden = false;
  }

  /* ---------- 海报：9:16 canvas ---------- */
  els.posterBtn.addEventListener('click', () => { if (current) drawPoster(current); });
  els.posterClose.addEventListener('click', () => { els.posterOverlay.hidden = true; });
  els.posterDownload.addEventListener('click', () => {
    if (!current) return;
    const text = E.shareText(current, true);
    els.posterToast.hidden = true;
    whenPosterReady(() => {
      try {
        els.posterCanvas.toBlob(blob => {
          if (!blob) { openTweetComposer(text, null); return; }
          const file = new File([blob], 'xpower-' + current.username + '.png', { type: 'image/png' });
          // 优先系统分享（可带图直发 X 新帖）
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], text: text })
              .then(() => { els.posterOverlay.hidden = true; })
              .catch(err => {
                if (err && err.name === 'AbortError') return; // 用户取消分享
                openTweetComposer(text, file);
              });
          } else {
            openTweetComposer(text, file);
          }
        }, 'image/png');
      } catch (e) {
        posterToast(T('toast.poster.exportBlocked'));
        openTweetComposer(text, null);
      }
    });
  });

  function posterToast(msg) {
    els.posterToast.textContent = msg;
    els.posterToast.hidden = false;
    setTimeout(() => { els.posterToast.hidden = true; }, 3200);
  }

  function openTweetComposer(text, file) {
    // 降级：下载图片 + 打开 X 发帖页（预填文案），图片需手动添加
    if (file) {
      const a = document.createElement('a');
      a.download = file.name;
      a.href = URL.createObjectURL(file);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    const url = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
    if (!window.open(url, '_blank')) location.href = url;
    posterToast(file ? T('toast.poster.saved') : T('toast.poster.opened'));
  }

  /* 海报头像：CORS 加载 + 占位降级，导出前等待绘制完成 */
  let posterAvatarPending = false;
  const posterAvatarWaiters = [];
  function drawPosterAvatarFallback(ctx, h, ax, ay, as, W, r) {
    const ag = ctx.createLinearGradient(ax, ay, ax + as, ay + as);
    ag.addColorStop(0, 'hsl(' + h + ' 82% 60%)');
    ag.addColorStop(1, 'hsl(' + ((h + 45) % 360) + ' 74% 46%)');
    ctx.fillStyle = ag; ctx.fillRect(ax, ay, as, as);
    ctx.fillStyle = '#fff';
    ctx.font = '800 84px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((r.name || r.username || '?').charAt(0).toUpperCase(), W / 2, ay + as / 2 + 4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  function posterAvatarDone() {
    posterAvatarPending = false;
    posterAvatarWaiters.splice(0).forEach(fn => fn());
  }
  function whenPosterReady(fn) {
    if (!posterAvatarPending) fn();
    else posterAvatarWaiters.push(fn);
  }

  function drawPoster(r) {
    const cv = els.posterCanvas;
    const ctx = cv.getContext('2d');
    const W = 810, H = 1440;
    posterAvatarPending = false;
    ctx.clearRect(0, 0, W, H);

    // 背景
    const g = ctx.createLinearGradient(0, 0, W, H);
    const h = r.avatarHue || 210;
    g.addColorStop(0, 'hsl(' + h + ' 60% 12%)');
    g.addColorStop(1, 'hsl(' + ((h + 50) % 360) + ' 55% 20%)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // 光斑
    ctx.save();
    ctx.globalAlpha = 0.25;
    const rg = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, 420);
    rg.addColorStop(0, 'hsla(' + h + ', 90%, 60%, 0.9)');
    rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 顶栏：品牌
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '700 30px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(T('poster.brand'), 60, 84);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '500 22px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(T('poster.tagline'), 60, 116);

    // 头像
    const ax = W / 2 - 92, ay = 210, as = 184;
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, ay + as / 2, as / 2, 0, Math.PI * 2); ctx.clip();
    if (r.avatar) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // CORS 加载，保证 canvas 可导出
      img.onload = () => { ctx.drawImage(img, ax, ay, as, as); posterAvatarDone(); };
      img.onerror = () => { drawPosterAvatarFallback(ctx, h, ax, ay, as, W, r); posterAvatarDone(); };
      img.src = r.avatar;
      posterAvatarPending = true;
    } else {
      drawPosterAvatarFallback(ctx, h, ax, ay, as, W, r);
    }
    ctx.restore();

    // 账号 + 段位
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 34px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('@' + r.username, W / 2, ay + as + 66);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '500 26px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(r.tier, W / 2, ay + as + 106);

    // 战力值（视觉中心）
    const scoreY = ay + as + 250;
    ctx.fillStyle = '#fff';
    ctx.font = '800 150px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(r.score, W / 2, scoreY);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 40px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(T('poster.scoreLabel'), W / 2, scoreY + 56);

    // 主称号（视觉中心大字，联动主题 accent）
    const titleColor = r.special_title ? '#ffd60a' : (th.accent || '#8ecbff');
    ctx.fillStyle = titleColor;
    ctx.font = '800 56px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(r.title, W / 2, scoreY + 180);

    // 短评
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 30px -apple-system, "PingFang SC", sans-serif';
    wrapText(ctx, r.comment, W / 2, scoreY + 248, W - 140, 44, true);

    // 底部短链 + 声明
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '500 24px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(T('poster.tryYours') + r.share_url.split('#')[0] + '#/u/' + r.username, W / 2, H - 110);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '500 20px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(T('poster.disclaimer'), W / 2, H - 64);
    ctx.textAlign = 'left';

    els.posterOverlay.hidden = false;
  }

  /* 断行：中文按字切，英文按词切 */
  function wrapText(ctx, text, cx, y, maxW, lh, center) {
    const isLatin = /[a-zA-Z]/.test(text) && !/[\u4e00-\u9fa5]/.test(text);
    const units = isLatin ? String(text).split(' ') : String(text).split('');
    let line = '', lines = [];
    for (const u of units) {
      const test = line ? line + (isLatin ? ' ' : '') + u : u;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = u; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((ln, i) => {
      if (center) ctx.textAlign = 'center';
      ctx.fillText(ln, cx, y + i * lh);
    });
    if (center) ctx.textAlign = 'left';
  }

  /* ---------- 语言切换后重算当前结果（不动配额） ---------- */
  I18N.onChange(() => {
    themeTitle();
    if (!current) return;
    const wasManual = lastManual !== null;
    const h = lastHandle;
    const screenNow = document.querySelector('.screen.is-active');
    if (wasManual) {
      current = E.scanManual('manual', lastManual);
      reveal(current, true);
    } else if (h) {
      runScan(h, { count: false, keyword: lastKeyword });
    }
    // 若当前在结果/对比屏则保持；runScan 会切到 result 屏
    if (screenNow && screenNow.id === 'screenCompare' && !wasManual) {
      // 对比屏无缓存重算入口，保持原位由用户重开对比
    }
  });

  /* ---------- 浮层通用开关 ---------- */
  function openOverlay(el) { if (el) el.hidden = false; }
  function closeOverlay(el) { if (el) el.hidden = true; }
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.hidden = true; // 点击遮罩关闭
    });
  });
  document.querySelectorAll('[data-close-overlay]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close-overlay');
      const ov = $('#' + id);
      if (ov) ov.hidden = true;
    });
  });

  /* ---------- 设置面板（第 6 项：音效/震动开关，默认开） ---------- */
  function syncSwitches() {
    const p = XPM.pref.get();
    els.soundSwitch.checked = p.sound;
    els.vibrateSwitch.checked = p.vibrate;
  }
  els.settingsBtn.addEventListener('click', () => { syncSwitches(); openOverlay(els.settingsOverlay); });
  els.soundSwitch.addEventListener('change', () => {
    XPM.pref.set({ sound: els.soundSwitch.checked });
    if (els.soundSwitch.checked) XPM.sound.play('tap');
  });
  els.vibrateSwitch.addEventListener('change', () => {
    XPM.pref.set({ vibrate: els.vibrateSwitch.checked });
    if (els.vibrateSwitch.checked) XPM.sound.vibrate(30);
  });

  /* ---------- 挑战链（第 1 项） ---------- */
  const CH_KEY = 'xpm:challenges';
  function chList() { try { return JSON.parse(localStorage.getItem(CH_KEY) || '[]'); } catch (e) { return []; } }
  function chSave(list) { localStorage.setItem(CH_KEY, JSON.stringify(list)); }
  function chLinkFor(id) {
    return location.origin + location.pathname + location.search + '#/challenge/' + id;
  }
  function chStatusLabel(s) {
    return s === 'done' ? T('challenge.responded') : T('challenge.pending');
  }
  function renderChMine() {
    const list = chList().slice().reverse();
    els.challengeMineEmpty.hidden = list.length > 0;
    els.challengeMine.innerHTML = '';
    list.forEach(it => {
      const row = document.createElement('div');
      row.className = 'ch-mine__item';
      const left = document.createElement('div');
      left.style.cssText = 'flex:1;min-width:0;';
      const a = document.createElement('a');
      a.href = chLinkFor(it.id);
      a.textContent = '@' + it.challenger + ' → @' + it.target;
      a.addEventListener('click', ev => {
        ev.preventDefault();
        location.hash = '#/challenge/' + it.id;
      });
      const time = document.createElement('div');
      time.style.cssText = 'font-size:11px;color:var(--text-tertiary,#98989d);margin-top:2px;';
      time.textContent = new Date(it.created_at).toLocaleString();
      left.append(a, time);
      const st = document.createElement('span');
      st.className = 'ch-mine__status ch-mine__status--' + it.status;
      st.textContent = chStatusLabel(it.status);
      row.append(left, st);
      els.challengeMine.appendChild(row);
    });
  }
  els.challengeBtn.addEventListener('click', () => {
    if (!current) return;
    els.challengeTarget.value = '';
    els.challengeLinkBox.hidden = true;
    renderChMine();
    openOverlay(els.challengeOverlay);
  });
  els.challengeForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!current) return;
    const target = E.parseHandle(els.challengeTarget.value);
    if (!target) { els.challengeTarget.style.borderColor = 'var(--danger)'; setTimeout(() => els.challengeTarget.style.borderColor = '', 1200); return; }
    const payload = {
      challenger: current.username,
      challenger_score: Math.round(current.score * 10) / 10,
      challenger_title: current.title,
      target: target
    };
    els.challengeBtn.disabled = true;
    E.apiChallengeCreate(payload).then(res => {
      els.challengeBtn.disabled = false;
      if (!res.ok) { return; }
      const it = { id: res.id, challenger: payload.challenger, target: payload.target, status: 'open', created_at: Date.now() };
      const list = chList(); list.push(it); chSave(list);
      renderChMine();
      els.challengeLinkBox.hidden = false;
      els.challengeLink.value = chLinkFor(res.id);
      XPM.sound.play('tap');
    }).catch(() => { els.challengeBtn.disabled = false; });
  });
  els.challengeCopyBtn.addEventListener('click', () => {
    if (!els.challengeLink.value) return;
    copyText(els.challengeLink.value);
  });

  /* 挑战落地：应战闭环 */
  let chLanding = null; // 当前落地挑战数据
  function showChallengeLanding(id) {
    els.challengeLandingBody.innerHTML = '';
    els.challengeLandingBody.appendChild(loadingNode());
    openOverlay(els.challengeLandingOverlay);
    E.apiChallengeGet(id).then(res => {
      if (!res.ok) {
        els.challengeLandingBody.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'sheet__empty';
        p.textContent = T('fail.not_found');
        els.challengeLandingBody.appendChild(p);
        return;
      }
      chLanding = res;
      renderChallengeLanding(res);
    }).catch(() => {
      els.challengeLandingBody.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'sheet__empty';
      p.textContent = T('fail.fetch');
      els.challengeLandingBody.appendChild(p);
    });
  }
  function loadingNode() {
    const p = document.createElement('p');
    p.className = 'sheet__empty';
    p.textContent = T('status.fetching');
    return p;
  }
  function renderChallengeLanding(ch) {
    const wrap = document.createElement('div');
    wrap.className = 'ch-land';
    const from = document.createElement('p');
    from.className = 'ch-land__from';
    from.textContent = T('challenge.from', { u: '@' + ch.challenger });
    const score = document.createElement('p');
    score.className = 'ch-land__score';
    score.textContent = ch.challenger_score;
    const title = document.createElement('p');
    title.className = 'ch-land__title';
    title.textContent = ch.challenger_title;
    wrap.append(from, score, title);

    if (ch.status === 'done') {
      const div = document.createElement('div');
      div.className = 'ch-land__divider';
      div.textContent = 'VS';
      const verdict = document.createElement('p');
      verdict.className = 'ch-land__verdict';
      const a = ch.challenger_score, b = ch.responder_score;
      verdict.textContent = a === b ? T('challenge.resultTie', { u: '@' + ch.challenger })
        : (b > a ? T('challenge.resultWin', { u: '@' + ch.challenger }) : T('challenge.resultLose', { u: '@' + ch.challenger }));
      const sub = document.createElement('p');
      sub.className = 'ch-land__sub';
      sub.textContent = '@' + ch.responder + ' · ' + ch.responder_title + ' · ' + b;
      wrap.append(div, verdict, sub);
    } else {
      const div = document.createElement('div');
      div.className = 'ch-land__divider';
      div.textContent = 'VS';
      const form = document.createElement('form');
      form.className = 'ch-land__form';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = T('challenge.acceptPh');
      input.autocomplete = 'off';
      input.setAttribute('data-i18n-ph', 'challenge.acceptPh');
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'btn btn--primary';
      btn.textContent = T('challenge.acceptBtn');
      const result = document.createElement('p');
      result.className = 'ch-land__result';
      form.append(input, btn, result);
      form.addEventListener('submit', ev => {
        ev.preventDefault();
        const handle = E.parseHandle(input.value);
        if (!handle) { input.style.borderColor = 'var(--danger)'; setTimeout(() => input.style.borderColor = '', 1200); return; }
        if (handle.toLowerCase() === ch.challenger.toLowerCase()) { result.textContent = T('vs.self'); return; }
        btn.disabled = true;
        result.textContent = T('status.fetching');
        E.scan(handle).then(scanRes => {
          if (!scanRes.ok) { btn.disabled = false; result.textContent = T('fail.fetch'); return; }
          const r = scanRes.result;
          E.apiChallengeRespond(ch.id, {
            responder: r.username,
            responder_score: Math.round(r.score * 10) / 10,
            responder_title: r.title
          }).then(resp => {
            btn.disabled = false;
            if (!resp.ok) { result.textContent = T('fail.fetch'); return; }
            // 更新本地发起记录状态
            const list = chList();
            const mine = list.find(x => x.id === ch.id);
            if (mine) { mine.status = 'done'; chSave(list); }
            result.textContent = '';
            renderChallengeLanding(Object.assign({}, ch, resp));
          }).catch(() => { btn.disabled = false; result.textContent = T('fail.fetch'); });
        }).catch(() => { btn.disabled = false; result.textContent = T('fail.fetch'); });
      });
      wrap.append(div, form);
    }
    els.challengeLandingBody.innerHTML = '';
    els.challengeLandingBody.appendChild(wrap);
  }

  /* ---------- 战力周报趋势（第 4 项） ---------- */
  function drawTrendChart(points) {
    const cv = els.trendChart;
    const ctx = cv.getContext('2d');
    const W = 560, H = 200, pad = 12;
    cv.width = W; cv.height = H;
    ctx.clearRect(0, 0, W, H);
    const scores = points.map(p => p.score);
    const min = Math.min.apply(null, scores);
    const max = Math.max.apply(null, scores);
    const range = Math.max(1, max - min);
    const dark = document.documentElement.dataset.theme === 'dark';
    const gridCol = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)';
    const lineCol = '#0a84ff';
    const fillCol = 'rgba(10,132,255,.16)';
    // 网格
    ctx.strokeStyle = gridCol; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (H - pad * 2) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }
    // 折线
    const n = points.length;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = pad + (W - pad * 2) * (n === 1 ? 0.5 : i / (n - 1));
      const y = pad + (H - pad * 2) * (1 - (p.score - min) / range);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineCol; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    // 面积
    ctx.lineTo(pad + (W - pad * 2) * (n === 1 ? 0.5 : (n - 1) / (n - 1)), H - pad);
    ctx.lineTo(pad + (W - pad * 2) * (n === 1 ? 0.5 : 0), H - pad);
    ctx.closePath();
    ctx.fillStyle = fillCol; ctx.fill();
    // 数据点
    points.forEach((p, i) => {
      const x = pad + (W - pad * 2) * (n === 1 ? 0.5 : i / (n - 1));
      const y = pad + (H - pad * 2) * (1 - (p.score - min) / range);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = lineCol; ctx.lineWidth = 2; ctx.stroke();
    });
  }
  els.trendBtn.addEventListener('click', () => {
    if (!current) return;
    els.trendChart.hidden = true;
    els.trendEmpty.hidden = true;
    els.trendList.hidden = true;
    els.trendList.innerHTML = '';
    openOverlay(els.trendOverlay);
    E.apiTrend(current.username).then(res => {
      if (!res.ok || !res.points || !res.points.length) { els.trendEmpty.hidden = false; return; }
      drawTrendChart(res.points);
      els.trendChart.hidden = false;
      const list = res.points.slice().reverse(); // 最新在前
      list.forEach(p => {
        const row = document.createElement('div');
        row.className = 'trend-item';
        const t = document.createElement('span');
        t.className = 'trend-item__time';
        t.textContent = new Date(p.t).toLocaleString();
        const s = document.createElement('span');
        s.className = 'trend-item__score';
        s.textContent = p.score;
        row.append(t, s);
        els.trendList.appendChild(row);
      });
      els.trendList.hidden = false;
    }).catch(() => { els.trendEmpty.hidden = false; });
  });

  /* ---------- 趣味榜单（第 7 项） ---------- */
  function renderLeaderboard(list) {
    els.lbList.innerHTML = '';
    els.lbEmpty.hidden = list.length > 0;
    list.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'lb-row';
      const rank = document.createElement('span');
      rank.className = 'lb-row__rank';
      rank.textContent = i + 1;
      const body = document.createElement('div');
      body.className = 'lb-row__body';
      const handle = document.createElement('p');
      handle.className = 'lb-row__handle';
      handle.textContent = '@' + it.username;
      const meta = document.createElement('p');
      meta.className = 'lb-row__meta';
      meta.textContent = T('lb.best') + ' ' + it.best + ' · ' + it.first_scanned;
      body.append(handle, meta);
      const count = document.createElement('span');
      count.className = 'lb-row__count';
      count.textContent = it.scans + '×';
      row.append(rank, body, count);
      els.lbList.appendChild(row);
    });
  }
  els.lbBtn.addEventListener('click', () => {
    els.lbList.innerHTML = '';
    els.lbEmpty.hidden = true;
    openOverlay(els.lbOverlay);
    E.apiLeaderboard().then(res => {
      if (!res.ok) { els.lbEmpty.hidden = false; return; }
      renderLeaderboard(res.list || []);
    }).catch(() => { els.lbEmpty.hidden = false; });
  });

  /* ---------- 彩蛋图鉴（第 2 项：收集展示） ---------- */
  function renderCollection() {
    const EGGS = XPM.EGGS || [];
    const total = EGGS.length;
    const got = EGGS.filter(e => eggUnlocked(e.id)).length;
    els.collectionProgress.textContent = T('collection.progress', { a: got, b: total });
    els.collectionEmpty.hidden = total > 0;
    els.collectionGrid.innerHTML = '';
    EGGS.forEach(e => {
      const cell = document.createElement('div');
      cell.className = 'egg-cell' + (eggUnlocked(e.id) ? ' egg-cell--got' : '');
      const emoji = document.createElement('div');
      emoji.className = 'egg-cell__emoji';
      emoji.textContent = eggUnlocked(e.id) ? (e.emoji || '🥚') : '🔒';
      const name = document.createElement('p');
      name.className = 'egg-cell__name';
      name.textContent = eggUnlocked(e.id) ? L(e.badge) : T('collection.locked');
      const acc = document.createElement('p');
      acc.className = 'egg-cell__acc';
      acc.textContent = eggUnlocked(e.id) ? '@' + (e.handles[0] || '?') : '???';
      const state = document.createElement('p');
      state.className = 'egg-cell__state';
      state.textContent = eggUnlocked(e.id) ? T('collection.unlocked') : T('collection.locked');
      cell.append(emoji, name, acc, state);
      els.collectionGrid.appendChild(cell);
    });
  }
  els.collectionBtn.addEventListener('click', () => {
    renderCollection();
    openOverlay(els.collectionOverlay);
  });

  /* ---------- hash 路由：#/u/{username} 与 #/challenge/{id} ---------- */
  function route() {
    const cm = location.hash.match(/^#\/challenge\/([A-Za-z0-9_-]+)$/i);
    if (cm) {
      showChallengeLanding(cm[1]);
      return;
    }
    const m = location.hash.match(/^#\/u\/([A-Za-z0-9_]{1,15})$/i);
    if (m) {
      const handle = m[1];
      const cached = E.getCache(handle);
      if (cached) {
        current = cached;
        showScreen('result');
        els.body.hidden = false; els.actions.hidden = false; els.skeleton.hidden = true;
        reveal(cached, true);
        return;
      }
      // 未缓存：自动测算（分享链接打开即见结果，不回空白输入框）
      startScan(handle);
      return;
    }
    if (location.hash && location.hash !== '#/') { location.hash = ''; }
    if (!document.querySelector('.screen.is-active')) showScreen('home');
  }
  window.addEventListener('hashchange', route);

  /* ---------- 初始化 ---------- */
  I18N.init();                                   // 语言检测 + 静态文案 + 控件绑定
  applyTheme(localStorage.getItem('xpm:theme') || 'auto');
  themeTitle();
  updateQuota();
  route();
  setTimeout(() => { if (location.hash.indexOf('#/u/') !== 0) els.input.focus(); }, 120);
})();
