/* ============================================================
   X战力镜 · engine.js
   浏览器侧引擎：账号解析 / 取数（本地 mock 或真实后端） / 缓存 / 配额
   纯算分逻辑见 core.js（前后端共用）
   对外按开发文档 21 节字段输出 result 对象

   接入真实数据：
   1) 在 index.html 的 CONFIG 里设置 apiBase（留空=本地 mock 演示模式）
   2) 后端实现 POST {apiBase}/api/scan，body {q: handle}
      返回 { ok, from_cache, quota_left, result }，result 字段对齐 core.buildResult
   ============================================================ */
'use strict';

(function () {
  const XPM = window.XPM;
  const core = XPM.core;
  const E = window.XPM.engine = {};

  /* ---------- 配置：apiBase 留空=本地 mock；填后端地址=真实取数 ---------- */
  const CONFIG = (window.XPM && window.XPM.CONFIG) || {};
  E.apiBase = (CONFIG.apiBase || '').replace(/\/+$/, '');

  /* ---------- 基础能力转发（与 core 同源） ---------- */
  E.parseHandle = core.parseHandle;
  E.seeded = core.seeded;
  E.fmtCount = core.fmtCount;
  E.compute = core.compute;
  E.tierOf = core.tierOf;
  E.buildTitle = core.buildTitle;
  E.specialOf = core.specialOf;
  E.buildComment = core.buildComment;
  E.shareText = core.shareText;
  E.buildResult = core.buildResult;

  /* ---------- 本地演示取数（mock，真实后端接入后不再走到此分支） ---------- */
  E.fetchProfile = function (handle) {
    const rnd = E.seeded('profile:' + handle.toLowerCase());
    const rnd2 = E.seeded('posts:' + handle.toLowerCase());

    const seg = rnd();
    let followers;
    if (seg < 0.16) followers = Math.floor(60 + rnd() * 900);
    else if (seg < 0.46) followers = Math.floor(1000 + rnd() * 49000);
    else if (seg < 0.76) followers = Math.floor(50000 + rnd() * 450000);
    else followers = Math.floor(500000 + rnd() * 4500000);
    const following = Math.floor(followers * (0.06 + rnd() * 1.6));
    const createdDays = Math.floor(20 + rnd() * 6200);
    const statusesCount = Math.max(1, Math.floor(followers * (0.1 + rnd() * 2.2) + rnd() * 2000));
    const verified = rnd() < 0.08;

    const silentDays = rnd() < 0.2 ? Math.floor(1 + rnd() * 60) : 0;
    const activeRecent = silentDays < 14;
    const posts = [];
    const zombie = followers <= 5000 && rnd2() < 0.3;
    const popBoost = followers > 500000 && rnd2() < 0.4 ? (5 + rnd2() * 10) : 1;
    for (let i = 0; i < 20; i++) {
      const base = zombie
        ? rnd() * 4
        : (2 + Math.pow(Math.max(followers, 1), 0.7) * (0.15 + rnd() * 0.9)) * popBoost;
      const likes = Math.max(0, Math.floor(base * (0.5 + rnd())));
      const rt = Math.max(0, Math.floor(base * (0.05 + rnd() * 0.4)));
      const rep = Math.max(0, Math.floor(base * (0.03 + rnd() * 0.3)));
      const kind = rnd();
      posts.push({ likes, rt, rep, isRt: kind < 0.35, isReply: kind > 0.82 });
    }

    if (silentDays >= 14) posts.length = Math.min(posts.length, 3);

    return {
      handle,
      name: makeName(rnd),
      avatarHue: Math.floor(rnd() * 360),
      followers,
      following,
      createdDays,
      statusesCount,
      verified,
      silentDays,
      posts,
      isPrivate: false,
      lock: silentDays >= 14 && rnd() < 0.1
    };
  };

  const NAMES = ['北岸', '阿澈', '软糖', '远山', '老白', '南瓜', '青柠', '朔风', '板栗', '阿肆',
    '渡鸦', '盐汽水', '小满', '木鱼', '白泽', '熬夜冠军', '半糖', '陈皮', '晚风', '铁柱'];
  function makeName(rnd) {
    const a = pick(rnd, NAMES);
    const b = pick(rnd, ['同学', '酱', '君', '子', '先森', '少女', '本尊', '的账号', '频道', '日常']);
    return a + b;
  }
  function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

  /* ---------- 前端缓存（仅本地 mock 模式使用；真实模式由后端缓存） ---------- */
  const CACHE_TTL = 12 * 3600 * 1000;

  E.getCache = function (handle) {
    try {
      const raw = localStorage.getItem('xpm:' + handle.toLowerCase());
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (Date.now() - o.ts > CACHE_TTL) return null;
      return o.result;
    } catch (e) { return null; }
  };

  E.setCache = function (handle, result) {
    try {
      localStorage.setItem('xpm:' + handle.toLowerCase(), JSON.stringify({ ts: Date.now(), result }));
    } catch (e) { /* 存不下就算了 */ }
  };

  /* ---------- 每日配额：本地 mock 用 localStorage；真实模式以后端返回为准 ---------- */
  E._quotaLeft = -1;   // -1 = 未知，用本地
  E.quotaLeft = function () {
    if (E._quotaLeft >= 0) return E._quotaLeft;
    try {
      const day = new Date().toISOString().slice(0, 10);
      const used = parseInt(localStorage.getItem('xpm:q:' + day) || '0', 10);
      return Math.max(0, 5 - used);
    } catch (e) { return 5; }
  };
  E.consumeQuota = function () {
    try {
      const day = new Date().toISOString().slice(0, 10);
      const used = parseInt(localStorage.getItem('xpm:q:' + day) || '0', 10) + 1;
      localStorage.setItem('xpm:q:' + day, String(used));
    } catch (e) { /* 忽略 */ }
  };

  /* ---------- 完整 scan：真实模式走后端，本地模式走 mock ---------- */
  E.scan = function (handle) {
    if (E.apiBase) return E.scanRemote(handle);
    return E.scanLocal(handle);
  };

  /* ---------- 真实后端取数 ----------
     POST {apiBase}/api/scan  {q: handle}
     -> { ok: true, from_cache, quota_left, result } 或 { ok: false, fail, result: null } */
  E.scanRemote = function (handle) {
    return fetch(E.apiBase + '/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: handle })
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (body) {
      if (body && body.ok) {
        if (typeof body.quota_left === 'number') E._quotaLeft = body.quota_left;
        return { ok: true, fromCache: !!body.from_cache, result: body.result };
      }
      return { ok: false, fail: (body && body.fail) || 'fetch', result: null };
    }).catch(function () {
      return { ok: false, fail: 'fetch', result: null };
    });
  };

  /* ---------- 本地 mock 测算（含缓存/配额/延迟模拟） ---------- */
  E.scanLocal = function (handle) {
    const cached = E.getCache(handle);
    if (cached) return Promise.resolve({ ok: true, fromCache: true, result: cached });

    const p = E.fetchProfile(handle);
    if (p.lock) {
      return new Promise(res => setTimeout(() =>
        res({ ok: false, fail: 'private', result: null }), 1400));
    }
    const result = core.buildResult(p, { shareBase: location.origin + location.pathname });
    E.setCache(handle, result);
    return new Promise(res => setTimeout(() => res({ ok: true, fromCache: false, result }), 1500 + Math.random() * 1800));
  };

  /* ---------- 手填后门 ---------- */
  E.scanManual = function (handle, m) {
    const p = {
      handle: handle || 'manual', name: '手填选手', avatarHue: 210,
      followers: m.followers, following: m.following,
      createdDays: m.created, statusesCount: m.statuses,
      verified: false, silentDays: 0,
      posts: [{ likes: 10, rt: 2, rep: 4, isRt: false, isReply: false },
              { likes: 8, rt: 1, rep: 3, isRt: false, isReply: false },
              { likes: 12, rt: 2, rep: 5, isRt: false, isReply: false }],
      isPrivate: false, lock: false
    };
    return core.buildResult(p, { shareBase: location.origin + location.pathname, partial: true });
  };
})();
