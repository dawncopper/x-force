/* ============================================================
   X战力镜 · core.js  （前后端共用纯逻辑，无 DOM / localStorage 依赖）
   浏览器：<script src="js/data.js"> 后加载，挂 window.XPM.core
   Node  ：const XPM = require('./data.js'); const core = require('./core.js');
   包含：账号解析 / 确定性随机 / 数值格式化 / 四维算分 / 段位 / 主称号(盲盒稀有度) /
         特称 / 彩蛋 / 海报主题 / 评语 / 分享文案
   多语言：core.setLang('zh' | 'en') 切换输出语言；默认 zh
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
  let LANG = 'zh';

  /* ---------- 语言切换 ---------- */
  C.setLang = function (l) { if (l === 'en' || l === 'zh') LANG = l; };
  C.getLang = function () { return LANG; };

  /* 取当前语言文案：兼容 {zh,en} 对象与纯字符串 */
  function L(v) {
    if (v && typeof v === 'object') return v[LANG] || v.zh || '';
    return v == null ? '' : String(v);
  }

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
    if (LANG === 'en') {
      if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + 'M';
      if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + 'K';
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return String(n);
    }
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + ' 亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + ' 万';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + ' 千';
    return String(n);
  };

  /* ---------- 四维算分 ----------
     p: { followers, following, createdDays, statusesCount, verified, silentDays, posts }
     posts[i]: { likes, rt, rep, isRt, isReply }  （近 20 帖） ---------- */
  C.compute = function (p, opts) {
    const partial = !!(opts && opts.partial);
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
    if (partial) {
      // 近况未计入：爆发维数据缺失，按中性 0.5 计分，不参与爆发类模板
      burst = 0.5;
    } else if (interactions.length >= 3) {
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
    const burstHigh = !partial && burst >= 0.62;
    const deadBurst = !partial && burst < 0.12;
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
                  silentDays, verified, followers, following, partial }
    };
  };

  /* ---------- 段位 ---------- */
  C.tierOf = function (score) {
    for (const t of XPM.TIERS) if (score >= t.min) return L(t.label);
    return L({ zh: '新号', en: 'Newbie' });
  };

  /* ---------- 稀有度（称号盲盒 · 第 3 项） ---------- */
  C.rarityOf = function (id) {
    for (const r of XPM.RARITIES || []) if (r.id === id) return r;
    return (XPM.RARITIES || [])[0];
  };
  C.rollRarity = function (rnd, score) {
    const w = XPM.rarityWeights(score);
    let r = rnd() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return (XPM.RARITIES || [])[i]; }
    return (XPM.RARITIES || [])[0];
  };
  /* 从五档词库按稀有度抽一个梗词条（附带来源分类） */
  C.rollGag = function (rnd, rarity) {
    const pool = [];
    if (rarity.id === 'legendary') {
      for (const it of (XPM.WORDS.legend || [])) pool.push({ text: it, kind: 'legend' });
      if (pool.length) return pool[Math.floor(rnd() * pool.length)];
    }
    const cats = ['volume', 'style', 'play', 'struct'];
    for (const cat of cats) {
      for (const it of (XPM.WORDS[cat] || [])) {
        if ((it.rarity || 'common') === rarity.id) pool.push({ text: it, kind: cat });
      }
    }
    if (!pool.length) {
      for (const cat of cats) {
        for (const it of (XPM.WORDS[cat] || [])) {
          if ((it.rarity || 'common') === 'common') pool.push({ text: it, kind: cat });
        }
      }
    }
    return pool[Math.floor(rnd() * pool.length)];
  };

  /* ---------- 主称号拼接（盲盒版，可 reroll） ---------- */
  const FRAG = {
    '转发中枢': { zh: '转发中枢', en: 'Retweet Hub' },
    '对线':     { zh: '对线', en: 'Duelist' },
    '哑火':     { zh: '哑火', en: 'Misfire' },
    '来而不往': { zh: '来而不往', en: 'No Reciprocity' },
    '高台喊话': { zh: '高台喊话', en: 'Sermonizer' }
  };
  C.buildTitleFull = function (p, c, opts) {
    const f = c.features || {};
    const salt = (opts && opts.reroll) ? (':' + opts.reroll) : '';
    const rnd = C.seeded('title:' + p.handle.toLowerCase() + ':' + Math.floor(c.score / 8) + salt);
    const rarity = C.rollRarity(rnd, c.score);
    const gag = C.rollGag(rnd, rarity);
    const W = XPM.WORDS;

    const volW = L(f.highFollowers ? W.volume[4 + Math.floor(rnd() * 2)] : W.volume[Math.floor(rnd() * 3)]);
    const styleW = L(pick(rnd, W.style));
    const playW = L(pick(rnd, W.play));

    const rtHigh = f.retweetRatio >= 0.5;
    const repHigh = f.replyRatio >= 0.4;
    const silent = f.silentDays >= 7;
    const ratioLow = f.following > f.followers;

    const parts = [];
    // 核心梗：gag 为 play 类直接打头，否则沿用行为分支
    if (gag.kind === 'play') parts.push(L(gag.text));
    else if (rtHigh) parts.push(L(FRAG['转发中枢']));
    else if (repHigh) parts.push(L(FRAG['对线']));
    else if (silent) parts.push(L(FRAG['哑火']));
    else parts.push(playW);

    // 第二段：style / struct 类 gag 优先，否则沿用关系分支
    if (gag.kind === 'style' || gag.kind === 'struct') parts.push(L(gag.text));
    else if (ratioLow) parts.push(L(FRAG['来而不往']));
    else if (f.verified) parts.push(L(FRAG['高台喊话']));
    else parts.push(styleW);

    // 首位：volume / legend 类 gag 置顶，大号补体量词
    if (gag.kind === 'volume' || gag.kind === 'legend') parts.unshift(L(gag.text));
    else if (c.score >= 87) parts.unshift(volW);

    return {
      title: (parts.length > 3 ? parts.slice(0, 3) : parts).join(LANG === 'en' ? ' · ' : '·'),
      rarity: rarity.id,
      gag: L(gag.text)
    };
  };
  /* 兼容旧调用：仅返回标题字符串 */
  C.buildTitle = function (p, c) {
    return C.buildTitleFull(p, c, {}).title;
  };
  /* 换梗（盲盒 reroll）：基于已有 result 重新 roll 一个称号 */
  C.rerollTitle = function (result, salt) {
    const f = result._features || {};
    const fakeP = { handle: result.username || 'x' };
    const fakeC = { score: result.score, features: f };
    return C.buildTitleFull(fakeP, fakeC, { reroll: salt || 'x' });
  };

  /* ---------- 特称 ---------- */
  C.specialOf = function (p, c) {
    const r = Object.assign({}, c.features, {
      burstHigh: c.features.burstHigh,
      deadBurst: c.features.deadBurst
    });
    for (const s of XPM.SPECIALS) {
      try { if (s.cond(r)) return { id: s.id, title: L(s.title), rarity: s.rarity || 'rare' }; } catch (e) { /* 忽略单条异常 */ }
    }
    return null;
  };

  /* ---------- 隐藏彩蛋（第 2 项：账号 + 关键词 + 小概率） ---------- */
  C.eggOf = function (handle, keyword) {
    const h = String(handle || '').toLowerCase();
    const kw = String(keyword || '').toLowerCase();
    if (!kw) return null;   // 彩蛋必须「账号 + 关键词」同时满足，无关键词不判定
    const eggs = XPM.EGGS || [];
    for (const e of eggs) {
      if (!e.handles || e.handles.indexOf(h) < 0) continue;
      if (e.keywords && e.keywords.length) {
        let hit = false;
        for (const k of e.keywords) {
          if (kw.indexOf(String(k).toLowerCase()) >= 0) { hit = true; break; }
        }
        if (!hit) continue;
      }
      if (Math.random() >= (e.chance || 0.05)) continue;
      return { id: e.id, title: L(e.title), badge: L(e.badge), rarity: e.rarity || 'rare' };
    }
    return null;
  };

  /* ---------- 海报主题（第 5 项：段位配色 + 彩蛋/稀有度联动 + 限定随机） ---------- */
  C.posterTheme = function (r) {
    const s = r.score;
    const tiers = [
      { min: 105, bg: ['#1a1005', '#3a2408'], accent: '#ffd60a', name: { zh: '传说·鎏金', en: 'Legend Gold' } },
      { min: 97,  bg: ['#0d1230', '#1d1a4e'], accent: '#8ecbff', name: { zh: '大V·星蓝', en: 'Mega Blue' } },
      { min: 87,  bg: ['#101c36', '#122a52'], accent: '#5ac8fa', name: { zh: '中V·靛蓝', en: 'Rising Indigo' } },
      { min: 72,  bg: ['#0d2b26', '#0f3d33'], accent: '#40e0d0', name: { zh: '名气·青碧', en: 'Known Teal' } },
      { min: 55,  bg: ['#0f2413', '#143318'], accent: '#30d158', name: { zh: '熟脸·青绿', en: 'Regular Green' } },
      { min: 32,  bg: ['#261505', '#33200a'], accent: '#ff9f0a', name: { zh: '街区·暖橙', en: 'Local Orange' } },
      { min: 18,  bg: ['#1c1c22', '#26262e'], accent: '#8e8e93', name: { zh: '居民·雾灰', en: 'Resident Gray' } },
      { min: 0,   bg: ['#17171c', '#202027'], accent: '#6e6e73', name: { zh: '新号·碳灰', en: 'Newbie Charcoal' } }
    ];
    let t = tiers.find(x => s >= x.min) || tiers[tiers.length - 1];
    let theme = { bg0: t.bg[0], bg1: t.bg[1], accent: t.accent, name: t.name, limited: false, label: null };

    // 彩蛋联动 > 稀有度联动 > 段位
    if (r.egg_id) {
      theme = { bg0: '#2b0a0a', bg1: '#5a1a06', accent: '#ffd60a', name: { zh: '彩蛋·鎏金', en: 'Egg Gold' }, limited: false, label: null };
    } else if (r.rarity === 'legendary') {
      theme = { bg0: '#241402', bg1: '#4a2a05', accent: '#ffd60a', name: { zh: '传说·鎏金', en: 'Legend Gold' }, limited: false, label: null };
    } else if (r.rarity === 'epic') {
      theme = { bg0: '#140a24', bg1: '#2a1248', accent: '#bf5af2', name: { zh: '史诗·紫夜', en: 'Epic Night' }, limited: false, label: null };
    }

    // 限定随机（每天一换，偶尔出现，增加收集感）
    const rnd = C.seeded('poster:' + String(r.username || '').toLowerCase() + ':' + new Date().toISOString().slice(0, 10));
    if (s >= 72 && rnd() < 0.06) {
      const limited = [
        { bg0: '#1a0533', bg1: '#3d0a5e', accent: '#ff375f', name: { zh: '限定·霓虹', en: 'Limited Neon' }, label: { zh: '限定皮肤 · 霓虹', en: 'Limited Skin · Neon' } },
        { bg0: '#001a1f', bg1: '#00343c', accent: '#30d0d0', name: { zh: '限定·赛博青', en: 'Limited Cyber' }, label: { zh: '限定皮肤 · 赛博青', en: 'Limited Skin · Cyber' } },
        { bg0: '#1f0f02', bg1: '#4a2406', accent: '#ff9f0a', name: { zh: '限定·黄昏', en: 'Limited Dusk' }, label: { zh: '限定皮肤 · 黄昏', en: 'Limited Skin · Dusk' } },
        { bg0: '#06201f', bg1: '#103a38', accent: '#64d2ff', name: { zh: '限定·极光', en: 'Limited Aurora' }, label: { zh: '限定皮肤 · 极光', en: 'Limited Skin · Aurora' } }
      ];
      theme = Object.assign({}, limited[Math.floor(rnd() * limited.length)], { limited: true });
    }
    return theme;
  };

  /* ---------- 评语保底（规则生成，AI 未接入时使用） ---------- */
  const CMT = {
    '档案顶住':       { zh: '档案顶住', en: 'profile holds' },
    '近况待补':       { zh: '近况待补', en: 'recent activity pending' },
    '熄火':           { zh: '熄火', en: 'quiet' },
    '老号正在冬眠':   { zh: '老号正在冬眠', en: 'an old account in hibernation' },
    '转发比说话多':   { zh: '转发比说话多', en: 'retweets more than it talks' },
    '像个中转站':     { zh: '像个中转站', en: 'like a relay station' },
    '赞少评狠':       { zh: '赞少评狠', en: 'few likes, sharp replies' },
    '主场在评论区':   { zh: '主场在评论区', en: 'home field is the replies' },
    '关注比粉丝多':   { zh: '关注比粉丝多', en: 'follows more than followed' },
    '社交比输出勤快': { zh: '社交比输出勤快', en: 'socializing beats posting' },
    '互动带感':       { zh: '互动带感', en: 'engaging presence' },
    '低粉也能出圈':   { zh: '低粉也能出圈', en: 'can break out with few followers' },
    '大号哑火':       { zh: '大号哑火', en: 'big account misfiring' },
    '近帖没什么水花': { zh: '近帖没什么水花', en: 'recent posts barely ripple' },
    '一周没动静':     { zh: '一周没动静', en: 'silent for a week' },
    '正在歇口气':     { zh: '正在歇口气', en: 'catching its breath' },
    '节奏稳定':       { zh: '节奏稳定', en: 'steady rhythm' },
    '在持续输出':     { zh: '在持续输出', en: 'consistently posting' }
  };
  C.buildComment = function (p, c) {
    const f = c.features;
    const fs = C.fmtCount(f.followers);
    let style, tail;

    if (f.partial) { style = CMT['档案顶住']; tail = CMT['近况待补']; }
    else if (f.silentDays >= 14) { style = CMT['熄火']; tail = CMT['老号正在冬眠']; }
    else if (f.retweetRatio >= 0.8) { style = CMT['转发比说话多']; tail = CMT['像个中转站']; }
    else if (f.replyRatio >= 0.5) { style = CMT['赞少评狠']; tail = CMT['主场在评论区']; }
    else if (f.following > f.followers * 1.2) { style = CMT['关注比粉丝多']; tail = CMT['社交比输出勤快']; }
    else if (f.burstHigh) { style = CMT['互动带感']; tail = CMT['低粉也能出圈']; }
    else if (f.deadBurst) { style = CMT['大号哑火']; tail = CMT['近帖没什么水花']; }
    else if (f.silentDays >= 7) { style = CMT['一周没动静']; tail = CMT['正在歇口气']; }
    else { style = CMT['节奏稳定']; tail = CMT['在持续输出']; }

    const alias = makeAlias(p, c);
    const s = L(style), t = L(tail);
    let shareClause, comment;
    if (LANG === 'en') {
      shareClause = fs + ' followers, ' + s + ', ' + t;
      comment = shareClause + '.';
    } else {
      shareClause = fs + '粉，' + s + '，' + t;
      comment = shareClause + '。';
    }
    return { comment, alias, share_clause: shareClause };
  };

  const ALIAS = {
    '三点后出没':   { zh: '三点后出没', en: 'active after 3am' },
    '评论区常驻':   { zh: '评论区常驻', en: 'lives in the replies' },
    '赛博搬运工':   { zh: '赛博搬运工', en: 'cyber porter' },
    '小钢炮本炮':   { zh: '小钢炮本炮', en: 'a literal pocket cannon' },
    '关注不互动':   { zh: '关注不互动', en: 'follows, never engages' },
    '深夜出没':     { zh: '深夜出没', en: 'night wanderer' },
    '话痨本痨':     { zh: '话痨本痨', en: 'certified chatterbox' },
    '潜水冠军':     { zh: '潜水冠军', en: 'lurker champion' },
    '转发狂魔':     { zh: '转发狂魔', en: 'retweet maniac' },
    '对线小能手':   { zh: '对线小能手', en: 'duel specialist' },
    '冷场克星':     { zh: '冷场克星', en: 'awkward-silence killer' }
  };
  function makeAlias(p, c) {
    const f = c.features;
    if (f.silentDays >= 14) return L(ALIAS['三点后出没']);
    if (f.replyRatio >= 0.5) return L(ALIAS['评论区常驻']);
    if (f.retweetRatio >= 0.8) return L(ALIAS['赛博搬运工']);
    if (f.burstHigh && f.lowFollowers) return L(ALIAS['小钢炮本炮']);
    if (f.deadBurst && f.highFollowers) return L(ALIAS['关注不互动']);
    const pool = ['深夜出没', '话痨本痨', '潜水冠军', '转发狂魔', '对线小能手', '冷场克星'];
    return L(ALIAS[pool[Math.floor(C.seeded('alias:' + p.handle)() * pool.length)]]);
  }

  /* ---------- 擦边值（娱乐向账号画像测试 · B画像为主 A词表为辅） ----------
     输入 p: { bio, name, avatar, followers, following, createdDays, statusesCount, verified, handle }
     A 词表扫描 bio+name（重/中/轻三档加权，封顶 60）
     B 画像信号（引流链/无头像/新号/异常涨粉/粉关比/认证/体量，-20 ~ +32）
     输出 { score(0-100), tier, verdict, hint } ---------- */
  // 擦边算法版本：词表/画像信号调整后 bump，旧缓存（edgy_v 不一致）自动失效重算
  C.EDGY_VERSION = 2;
  const EDGY_WORDS = {
    heavy: ['约炮', '裸聊', '裸照', '全裸', '涩图', '色图', '福利姬', '原味', '丝袜', '内衣', '私房照', '大尺度', '私密', '擦边', 'nsfw', 'onlyfans', 'lewd', 'explicit', 'porn', 'nude'],
    mid: ['撩', '暗示', '欲', '性感', '身材', '写真', '福利', '诱惑', '深夜', '晚安', '唇', '腿', '私信', '想擦', '求夸', '同城', 'seductive', 'flirty', 'teasing', 'thirst', 'baddie', 'spicy'],
    light: ['心动', '可爱', '甜', '糖', '萌', '夸夸', 'crush', 'vibes', 'mood', 'lil', 'doll', 'babygirl', 'snack']
  };
  const EDGY_TIERS = [
    { max: 15, label: { zh: '清水', en: 'Pure' } },
    { max: 35, label: { zh: '微醺', en: 'Tipsy' } },
    { max: 55, label: { zh: '欲说还休', en: 'Hinting' } },
    { max: 75, label: { zh: '擦边大师', en: 'Edgy Pro' } },
    { max: 100, label: { zh: '全网皆擦', en: 'Fully Edgy' } }
  ];
  const EDGY_VERDICTS = [
    [
      { zh: '干净得像刚注册的账号，X 欠你一面锦旗。', en: 'Cleaner than a fresh account; X owes you a medal.' },
      { zh: '你的主页自带圣光，擦边这个词跟你无缘。', en: 'Your profile radiates purity; "edgy" is not in your dictionary.' },
      { zh: '全网都在擦，只有你在认真上班。', en: 'Everyone is edging, and you are just clocking in.' }
    ],
    [
      { zh: '有点氛围感，但还差临门一脚，建议多打几个擦边球。', en: 'Some vibe, but not quite there; a few more near-misses would help.' },
      { zh: '嘴上说着清纯，字里行间全是暗示，老演员了。', en: 'Claims innocence, drips hints — quite the actor.' },
      { zh: '擦边擦到一半刹车，吊胃口第一名。', en: 'Edges halfway then brakes — the master of teasing.' }
    ],
    [
      { zh: '这 bio 是懂流量的，擦得精准又不至于被封号。', en: 'That bio knows traffic — edgy enough without getting banned.' },
      { zh: '建议 X 给你颁发“擦边学位”，专业对口。', en: 'X should award you an honorary Edgy Degree.' },
      { zh: '欲说还休四个字被你玩明白了。', en: 'You have mastered the art of saying everything by saying nothing.' }
    ],
    [
      { zh: '擦边大师本师，评论区里都是慕名而来的。', en: 'The edgy pro himself; the replies came for the show.' },
      { zh: '这账号是懂流量的，擦得精准又不至于被封号。', en: 'Knows exactly how far to go — precise edging without the ban.' },
      { zh: '建议 X 给你颁发“擦边学位”，专业对口。', en: 'X should award you an honorary Edgy Degree with distinction.' }
    ],
    [
      { zh: '兄弟，你这账号擦得全网皆知，小心被限流。', en: 'Bro, your whole profile is known for this — watch out for shadowbans.' },
      { zh: '你的 bio 已经不是擦边了，是明着来。', en: 'Your bio is not edging anymore — it is just straight up.' },
      { zh: '全网皆擦，你擦出了高度，擦出了风格。', en: 'Fully edgy — with height, with style.' }
    ]
  ];
  C.edgyOf = function (p, opts) {
    const bio = String(p.bio || '');
    const text = (bio + ' ' + String(p.name || '')).toLowerCase();
    let a = 0;
    for (const w of EDGY_WORDS.heavy) if (text.indexOf(w) >= 0) a += 16;
    for (const w of EDGY_WORDS.mid) if (text.indexOf(w) >= 0) a += 9;
    for (const w of EDGY_WORDS.light) if (text.indexOf(w) >= 0) a += 4;
    a = Math.min(a, 60);
    let b = 0;
    const hasLink = /(https?:\/\/|t\.me\/|instagram\.com|onlyfans|patreon)/i.test(bio);
    if (hasLink) b += 8;
    if (!(opts && opts.manual) && !p.avatar) b += 6;
    if (p.createdDays >= 0 && p.createdDays < 30) b += 8;
    if (p.statusesCount < 100 && p.followers >= 1000) b += 6;
    if (p.followers / Math.max(p.following, 1) < 0.3) b += 4;
    if (p.verified) b -= 10;
    if (p.followers >= 50000) b -= 6;
    b = Math.max(b, -20);
    const score = Math.max(0, Math.min(100, Math.round(a + b)));
    let tier = EDGY_TIERS[0];
    for (const t of EDGY_TIERS) if (score <= t.max) { tier = t; break; }
    const idx = EDGY_TIERS.indexOf(tier);
    const rnd = C.seeded('edgy:' + String(p.handle || '').toLowerCase() + ':' + Math.floor(score / 10));
    const verdict = EDGY_VERDICTS[idx][Math.floor(rnd() * EDGY_VERDICTS[idx].length)];
    return { score, tier: L(tier.label), verdict: L(verdict), hint: hasLink };
  };

  /* ---------- 从原始档案+近帖组装 scan 结果（后端与浏览器 mock 共用） ----------
     raw: { handle, name, avatar|null, avatarHue|null, followers, following, createdDays,
            statusesCount, verified, silentDays, posts:[{likes,rt,rep,isRt,isReply}] }
     opts: { partial, shareBase, keyword }  keyword 为原始输入，用于彩蛋判定 ---------- */
  C.buildResult = function (raw, opts) {
    opts = opts || {};
    const p = Object.assign({ handle: raw.handle || 'manual', name: raw.name || L({ zh: '手填选手', en: 'Manual Player' }),
      avatar: raw.avatar || null, avatarHue: raw.avatarHue != null ? raw.avatarHue : 210 }, raw);
    const c = C.compute(p, opts);
    const special = C.specialOf(p, c);
    const egg = C.eggOf(p.handle, opts.keyword);
    const hd = C.buildTitleFull(p, c, {});
    const rarity = egg ? egg.rarity : (special ? special.rarity : hd.rarity);
    const title = egg ? egg.title : (special ? special.title : hd.title);
    const ai = C.buildComment(p, c);
    const partial = !!(opts && opts.partial);
    const base = (opts && opts.shareBase) || '';

    const result = {
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
      rarity,
      gag: egg ? null : (special ? null : hd.gag),
      alias: ai.alias,
      comment: ai.comment,
      share_clause: ai.share_clause,
      dims: { volume: Math.round(c.dims.volume * 100), structure: Math.round(c.dims.structure * 100),
              burst: Math.round(c.dims.burst * 100), activity: Math.round(c.dims.activity * 100) },
      special_title: special ? special.title : null,
      special_id: special ? special.id : null,
      egg_id: egg ? egg.id : null,
      egg_title: egg ? egg.title : null,
      egg_badge: egg ? egg.badge : null,
      egg_rarity: egg ? egg.rarity : null,
      partial,
      share_url: base + '#/u/' + p.handle,
      _features: c.features
    };
    result.edgy = C.edgyOf(p, opts);
    result.edgy_v = C.EDGY_VERSION;
    result.theme = C.posterTheme(result);
    return result;
  };

  /* ---------- 分享文案 ---------- */
  C.shareText = function (result, forSelf) {
    const badge = result.egg_badge ? ' · ' + result.egg_badge : '';
    const edgy = (result.edgy && typeof result.edgy.score === 'number')
      ? (LANG === 'en' ? ' Edgy ' + result.edgy.score + ' (' + result.edgy.tier + ').'
                       : ' 擦边值 ' + result.edgy.score + '（' + result.edgy.tier + '）。')
      : '';
    if (LANG === 'en') {
      const who = forSelf ? 'My' : '@' + result.username + "'s";
      return who + ' X Power is ' + result.score + ' (' + result.tier + ' · ' + result.title + badge + '). ' +
             result.share_clause + '.' + edgy + ' Try yours: ' + result.share_url;
    }
    const who = forSelf ? '我的' : '@' + result.username + ' 的';
    return `${who}X战力是 ${result.score}（${result.tier}·${result.title}${badge}）。${result.share_clause}。${edgy}你也来测：${result.share_url}`;
  };

  return C;
});
