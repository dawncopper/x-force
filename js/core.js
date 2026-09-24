/* ============================================================
   X战力镜 · core.js  （前后端共用纯逻辑，无 DOM / localStorage 依赖）
   浏览器：<script src="js/data.js"> 后加载，挂 window.XPM.core
   Node  ：const XPM = require('./data.js'); const core = require('./core.js');
   包含：账号解析 / 确定性随机 / 数值格式化 / 四维算分 / 段位 / 主称号 / 特称 / 评语 / 分享文案
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports && typeof window === 'undefined') {
    const XPM = require('./data.js');
    module.exports = factory(XPM);
  } else {
    root.XPM = root.XPM || {};
    root.XPM.core = factory(root.XPM);
  }
})(typeof self !== 'undefined' ? self : this, function (XPM) {
  'use strict';

  const C = {};

  /* ---------- 账号解析：@name / name / https://x.com/name ---------- */
  C.parseHandle = function (input) {
    if (!input) return null;
    let s = String(input).trim();
    if (!s) return null;
    const m = s.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
    if (m) return m[1];
    s = s.replace(/^@/, '').trim();
    if (/^[A-Za-z0-9_]{1,15}$/.test(s)) return s;
    return null;
  };

  /* ---------- 确定性随机（同名同结果） ---------- */
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  C.seeded = function (key) { return mulberry32(hashSeed(key)); };
  function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- 数值展示 ---------- */
  C.fmtCount = function (n) {
    if (n == null) return '—';
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + ' 亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + ' 万';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + ' 千';
    return String(n);
  };

  /* ---------- 四维算分 ----------
     p: { followers, following, createdDays, statusesCount, verified, silentDays, posts }
     posts[i]: { likes, rt, rep, isRt, isReply }  （近 20 帖） ---------- */
  C.compute = function (p) {
    const { followers, following, createdDays, statusesCount, verified, silentDays, posts } = p;

    // 体量 25%：粉丝对数（100→0，1万→0.5，100万→1）+ 总帖微加成
    const logF = Math.log10(Math.max(followers, 1));
    const volBase = clamp((logF - 2) / 4, 0, 1);
    const vol = clamp(volBase * 0.92 + Math.min(statusesCount / 5e5, 0.08), 0, 1);

    // 结构 20%：粉关比 + 认证 + 年限
    const ratio = followers / Math.max(following, 1);
    let struct = 0;
    if (ratio >= 3) struct += 0.55;
    else if (ratio >= 1) struct += 0.4;
    else if (ratio >= 0.5) struct += 0.25;
    else struct += 0.1;
    struct += verified ? 0.15 : 0;
    if (createdDays >= 365) struct += 0.25;
    else if (createdDays >= 30) struct += 0.12;
    else struct -= 0.08;
    struct = clamp(struct, 0, 1);

    // 爆发 35%：近 20 帖去极值后中位互动 / 粉丝
    const interactions = posts.map(x => x.likes + 2 * x.rt + 3 * x.rep).sort((a, b) => a - b);
    let burst = 0;
    if (interactions.length >= 3) {
      const trimmed = interactions.slice(1, -1);
      const med = trimmed[Math.floor(trimmed.length / 2)];
      const perF = med / Math.max(followers, 1);
      const t = Math.log10(perF + 1e-4);
      burst = clamp((t + 4.2) / 4.6, 0.02, 1);
    } else if (interactions.length > 0) {
      burst = 0.2 * clamp((interactions[0] / Math.max(followers, 1)) * 50, 0, 1);
    }

    // 活性 20%：近 14 天在场 + 原创比 - 机器节拍
    let act = 0;
    if (silentDays < 14) act += 0.55;
    else if (silentDays < 30) act += 0.25;
    else act += 0.05;
    const rtRatio = posts.length ? posts.filter(x => x.isRt).length / posts.length : 1;
    const origRatio = 1 - rtRatio;
    act += origRatio * 0.3;
    if (silentDays >= 7) act -= 0.12;
    const intervalEven = Math.abs(origRatio - 0.5) < 0.05;
    if (intervalEven) act -= 0.08;
    act = clamp(act, 0, 1);

    const score = Math.round((vol * 0.25 + struct * 0.20 + burst * 0.35 + act * 0.20) * 1000) / 10;

    const highFollowers = followers >= 50000;
    const lowFollowers = followers < 1500;
    const burstHigh = burst >= 0.62;
    const deadBurst = burst < 0.12;
    const retweetRatio = posts.length ? posts.filter(x => x.isRt).length / posts.length : 0;
    const replyRatio = posts.length ? posts.filter(x => x.isReply).length / posts.length : 0;
    const newAccount = createdDays < 30;
    const oldAccount = createdDays > 3000;
    const lowStatuses = statusesCount < 200;
    const metronome = posts.length >= 10 && intervalEven && origRatio > 0.7;

    return {
      score,
      dims: { volume: vol, structure: struct, burst, activity: act },
      features: { highFollowers, lowFollowers, burstHigh, deadBurst, retweetRatio,
                  replyRatio, newAccount, oldAccount, lowStatuses, metronome,
                  silentDays, verified, followers, following }
    };
  };

  /* ---------- 段位 ---------- */
  C.tierOf = function (score) {
    for (const t of XPM.TIERS) if (score >= t.min) return t.label;
    return '新号';
  };

  /* ---------- 主称号拼接 ---------- */
  C.buildTitle = function (p, c) {
    const f = c.features;
    const rnd = C.seeded('title:' + p.handle.toLowerCase() + ':' + Math.floor(c.score / 8));
    const W = XPM.WORDS;

    const volW = f.highFollowers ? W.volume[4 + Math.floor(rnd() * 2)] : W.volume[Math.floor(rnd() * 3)];
    const styleW = pick(rnd, W.style);
    const playW = pick(rnd, W.play);
    const structW = pick(rnd, W.struct);

    const rtHigh = f.retweetRatio >= 0.5;
    const repHigh = f.replyRatio >= 0.4;
    const silent = f.silentDays >= 7;
    const ratioLow = f.following > f.followers;

    const parts = [];
    if (rtHigh) parts.push('转发中枢');
    else if (repHigh) parts.push('对线');
    else if (silent) parts.push('哑火');
    else parts.push(playW);

    if (ratioLow) parts.push('来而不往');
    else if (f.verified) parts.push('高台喊话');
    else parts.push(styleW);

    if (c.score >= 87) parts.unshift(volW);

    return parts.length > 3 ? parts.slice(0, 3).join('·') : parts.join('·');
  };

  /* ---------- 特称 ---------- */
  C.specialOf = function (p, c) {
    const r = Object.assign({}, c.features, {
      burstHigh: c.features.burstHigh,
      deadBurst: c.features.deadBurst
    });
    for (const s of XPM.SPECIALS) {
      try { if (s.cond(r)) return { id: s.id, title: s.title }; } catch (e) { /* 忽略单条异常 */ }
    }
    return null;
  };

  /* ---------- 评语保底（规则生成，AI 未接入时使用） ---------- */
  C.buildComment = function (p, c) {
    const f = c.features;
    const fs = C.fmtCount(f.followers);
    let style, tail;

    if (f.silentDays >= 14) { style = '熄火'; tail = '老号正在冬眠'; }
    else if (f.retweetRatio >= 0.8) { style = '转发比说话多'; tail = '像个中转站'; }
    else if (f.replyRatio >= 0.5) { style = '赞少评狠'; tail = '主场在评论区'; }
    else if (f.following > f.followers * 1.2) { style = '关注比粉丝多'; tail = '社交比输出勤快'; }
    else if (f.burstHigh) { style = '互动带感'; tail = '低粉也能出圈'; }
    else if (f.deadBurst) { style = '大号哑火'; tail = '近帖没什么水花'; }
    else if (f.silentDays >= 7) { style = '一周没动静'; tail = '正在歇口气'; }
    else { style = '节奏稳定'; tail = '在持续输出'; }

    const alias = makeAlias(p, c);
    const shareClause = `${fs}粉，${style}，${tail}`;
    return { comment: `${fs}粉，${style}，${tail}。`, alias, share_clause: shareClause };
  };

  function makeAlias(p, c) {
    const f = c.features;
    if (f.silentDays >= 14) return '三点后出没';
    if (f.replyRatio >= 0.5) return '评论区常驻';
    if (f.retweetRatio >= 0.8) return '赛博搬运工';
    if (f.burstHigh && f.lowFollowers) return '小钢炮本炮';
    if (f.deadBurst && f.highFollowers) return '关注不互动';
    const pool = ['深夜出没', '话痨本痨', '潜水冠军', '转发狂魔', '对线小能手', '冷场克星'];
    return pool[Math.floor(C.seeded('alias:' + p.handle)() * pool.length)];
  }

  /* ---------- 从原始档案+近帖组装 scan 结果（后端与浏览器 mock 共用） ----------
     raw: { handle, name, avatar|null, avatarHue|null, followers, following, createdDays,
            statusesCount, verified, silentDays, posts:[{likes,rt,rep,isRt,isReply}] }
     partial: 是否残局（近况未计入） ---------- */
  C.buildResult = function (raw, opts) {
    const p = Object.assign({ handle: raw.handle || 'manual', name: raw.name || '手填选手',
      avatar: raw.avatar || null, avatarHue: raw.avatarHue != null ? raw.avatarHue : 210 }, raw);
    const c = C.compute(p);
    const special = C.specialOf(p, c);
    const title = special ? special.title : C.buildTitle(p, c);
    const ai = C.buildComment(p, c);
    const partial = !!(opts && opts.partial);
    const base = (opts && opts.shareBase) || '';

    return {
      username: p.handle,
      name: p.name,
      avatar: p.avatar,
      avatarHue: p.avatarHue,
      followers: p.followers,
      following: p.following,
      created_days: p.createdDays,
      statuses_count: p.statusesCount,
      score: c.score,
      tier: C.tierOf(c.score),
      title,
      alias: ai.alias,
      comment: ai.comment,
      share_clause: ai.share_clause,
      dims: { volume: Math.round(c.dims.volume * 100), structure: Math.round(c.dims.structure * 100),
              burst: Math.round(c.dims.burst * 100), activity: Math.round(c.dims.activity * 100) },
      special_title: special ? special.title : null,
      special_id: special ? special.id : null,
      partial,
      share_url: base + '#/u/' + p.handle
    };
  };

  /* ---------- 分享文案 ---------- */
  C.shareText = function (result, forSelf) {
    const who = forSelf ? '我的' : '@' + result.username + ' 的';
    return `${who}X战力是 ${result.score}（${result.tier}·${result.title}）。${result.share_clause}。你也来测：${result.share_url}`;
  };

  return C;
});
