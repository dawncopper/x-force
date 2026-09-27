/* ============================================================
   X战力镜 · data.js
   词库 / 段位表 / 特称规则 / 稀有度 / 彩蛋 / 失败文案（中英双语）
   浏览器：挂 window.XPM；Node：module.exports = XPM
   第 3 项（称号盲盒）与第 2 项（彩蛋）的静态数据均在此维护
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports && typeof window === 'undefined') {
    module.exports = factory();
  } else {
    root.XPM = root.XPM || {};
    factory(root.XPM);
  }
})(typeof self !== 'undefined' ? self : this, function (XPM) {
  'use strict';

  XPM = XPM || {};

/* ---------- 段位表（8 档，按战力） ---------- */
XPM.TIERS = [
  { min: 105, label: { zh: '某车企老板', en: 'Auto Mogul' } },
  { min: 97,  label: { zh: '大V', en: 'Mega Influencer' } },
  { min: 87,  label: { zh: '中V', en: 'Rising Influencer' } },
  { min: 72,  label: { zh: '小有名气', en: 'Well-Known' } },
  { min: 55,  label: { zh: '圈子熟脸', en: 'Circle Regular' } },
  { min: 32,  label: { zh: '街区名人', en: 'Local Celebrity' } },
  { min: 18,  label: { zh: '普通居民', en: 'Ordinary Resident' } },
  { min: 0,   label: { zh: '新号', en: 'Newbie' } }
];

/* ---------- 五档稀有度（称号盲盒） ---------- */
XPM.RARITIES = [
  { id: 'common',    zh: '普通', en: 'Common',    color: '#8e8e93' },
  { id: 'uncommon',  zh: '罕见', en: 'Uncommon',  color: '#34c759' },
  { id: 'rare',      zh: '稀有', en: 'Rare',      color: '#0a84ff' },
  { id: 'epic',      zh: '史诗', en: 'Epic',      color: '#a060ff' },
  { id: 'legendary', zh: '传说', en: 'Legendary', color: '#ff9f0a' }
];

/* 稀有度权重（百分比，按段位弱关联：段位越高高稀有度概率越大） */
XPM.rarityWeights = function (score) {
  if (score >= 105) return [8, 12, 20, 28, 32];
  if (score >= 97)  return [12, 18, 25, 25, 20];
  if (score >= 87)  return [18, 24, 26, 20, 12];
  if (score >= 72)  return [28, 28, 24, 13, 7];
  if (score >= 55)  return [38, 30, 18, 9, 5];
  if (score >= 32)  return [48, 30, 14, 6, 2];
  return [60, 26, 10, 3, 1];
};

/* ---------- 主称号词库（每条带 rarity，缺省按普通） ---------- */
XPM.WORDS = {
  volume: [
    { zh: '巷口摊', en: 'Corner Booth', rarity: 'common' },
    { zh: '街区',   en: 'Block Star', rarity: 'common' },
    { zh: '城南',   en: 'South Town', rarity: 'common' },
    { zh: '广场',   en: 'Plaza', rarity: 'uncommon' },
    { zh: '城门',   en: 'City Gate', rarity: 'rare' },
    { zh: '半座城', en: 'Half the City', rarity: 'epic' }
  ],
  style: [
    { zh: '段子手', en: 'Meme King', rarity: 'common' },
    { zh: '复读机', en: 'Repeater', rarity: 'common' },
    { zh: '夜猫子', en: 'Night Owl', rarity: 'common' },
    { zh: '潜水员', en: 'Lurker', rarity: 'common' },
    { zh: '广告贩', en: 'Ad Peddler', rarity: 'uncommon' },
    { zh: '教科书', en: 'Textbook', rarity: 'uncommon' },
    { zh: '嘴替',   en: 'Spokesperson', rarity: 'rare' }
  ],
  play: [
    { zh: '哑火',     en: 'Misfire', rarity: 'common' },
    { zh: '冷枪',     en: 'Sniper', rarity: 'common' },
    { zh: '对线',     en: 'Duelist', rarity: 'common' },
    { zh: '转发中枢', en: 'Retweet Hub', rarity: 'uncommon' },
    { zh: '抬杠',     en: "Devil's Advocate", rarity: 'uncommon' },
    { zh: '开麦',     en: 'Mic Dropper', rarity: 'rare' },
    { zh: '广播',     en: 'Broadcaster', rarity: 'rare' },
    { zh: '世纪对线', en: 'Duel of the Century', rarity: 'epic' },
    { zh: '降维打击', en: 'Dimensional Strike', rarity: 'epic' }
  ],
  struct: [
    { zh: '来而不往',   en: 'No Reciprocity', rarity: 'common' },
    { zh: '广结善缘',   en: 'Friend Maker', rarity: 'common' },
    { zh: '互粉专业户', en: 'Follow-Farm Pro', rarity: 'uncommon' },
    { zh: '高台喊话',   en: 'Sermonizer', rarity: 'rare' },
    { zh: '阳谋大师',   en: 'Master Strategist', rarity: 'epic' }
  ],
  legend: [
    { zh: '赛博帝王', en: 'Cyber Sovereign', rarity: 'legendary' },
    { zh: '舆论君主', en: 'Opinion Monarch', rarity: 'legendary' },
    { zh: '全城心跳', en: 'Heartbeat of the City', rarity: 'legendary' },
    { zh: '万人之上', en: 'Above Ten Thousand', rarity: 'legendary' }
  ]
};

/* ---------- 特称规则（命中即替换/前置；带稀有度） ---------- */
XPM.SPECIALS = [
  { id: 'pocket_powder',   cond: r => r.burstHigh && r.lowFollowers,            title: { zh: '袖珍火药桶', en: 'Pocket Cannon' },   rarity: 'rare' },
  { id: 'empty_horn',      cond: r => r.highFollowers && r.deadBurst,           title: { zh: '空城大喇叭', en: 'Empty Megaphone' }, rarity: 'epic' },
  { id: 'social_worker',   cond: r => r.following > r.followers * 3,            title: { zh: '社交勤务兵', en: 'Social Butterfly' }, rarity: 'uncommon' },
  { id: 'hibernator',      cond: r => r.silentDays >= 14,                       title: { zh: '冬眠户', en: 'Hibernator' },           rarity: 'common' },
  { id: 'relay_station',   cond: r => r.retweetRatio >= 0.8,                    title: { zh: '搬运站长', en: 'Relay Station' },     rarity: 'uncommon' },
  { id: 'reply_committee', cond: r => r.replyRatio >= 0.5,                      title: { zh: '评论区居委会', en: 'Reply Committee' }, rarity: 'rare' },
  { id: 'metronome',       cond: r => r.metronome,                              title: { zh: '值班机器人', en: 'Bot on Duty' },      rarity: 'rare' },
  { id: 'cold_bench',      cond: r => r.verified && r.deadBurst,                title: { zh: '认证冷板凳', en: 'Verified Benchwarmer' }, rarity: 'epic' },
  { id: 'instant_boom',    cond: r => r.newAccount && r.burstHigh,              title: { zh: '落地即爆', en: 'Instant Boom' },       rarity: 'epic' },
  { id: 'antique_idle',    cond: r => r.oldAccount && r.lowStatuses,            title: { zh: '古董闲置号', en: 'Antique Idle' },     rarity: 'rare' }
];

/* ---------- 隐藏彩蛋（第 2 项：特定账号 + 特定关键词 + 随机小概率） ----------
   触发：账号命中 handles，且用户输入（raw 原文）命中 keywords 任一，再 roll 小概率
   解锁后前端收集进图鉴 */
XPM.EGGS = [
  { id: 'mars_lord', handles: ['elonmusk'], keywords: ['火星', 'mars', 'musk', 'spacex'],
    chance: 0.08, rarity: 'legendary',
    title: { zh: '火星领主', en: 'Lord of Mars' },
    badge: { zh: '火星领主', en: 'Mars Lord' },
    desc:  { zh: '输入 @elonmusk 并提及"火星"或 "mars"，有概率解锁火星领主。', en: 'Type @elonmusk and mention "Mars" for a chance to unlock Lord of Mars.' } },
  { id: 'satoshi', handles: ['satoshi', 'satoshi_nakamoto'], keywords: ['btc', 'bitcoin', '比特币', '聪', 'satoshi'],
    chance: 0.10, rarity: 'legendary',
    title: { zh: '创世中本', en: 'Genesis Satoshi' },
    badge: { zh: '创世中本', en: 'Genesis Satoshi' },
    desc:  { zh: '输入中本聪相关账号并提及 "btc / 比特币"，有概率解锁创世中本。', en: 'Type a Satoshi-related account and mention "btc/bitcoin" for a chance to unlock.' } },
  { id: 'vitalik', handles: ['vitalikbuterin', 'vitalik'], keywords: ['eth', 'ethereum', '以太坊', 'v神', 'vitalik'],
    chance: 0.10, rarity: 'epic',
    title: { zh: '以太贤者', en: 'Ethereal Sage' },
    badge: { zh: '以太贤者', en: 'Ethereal Sage' },
    desc:  { zh: '输入 @vitalikbuterin 并提及 "eth / 以太坊"，有概率解锁以太贤者。', en: 'Type @vitalikbuterin and mention "eth/ethereum" for a chance to unlock.' } },
  { id: 'nasa', handles: ['nasa'], keywords: ['space', '太空', 'nasa', '登月', '月球'],
    chance: 0.12, rarity: 'rare',
    title: { zh: '深空传令官', en: 'Deep-Space Herald' },
    badge: { zh: '深空传令官', en: 'Deep-Space Herald' },
    desc:  { zh: '输入 @nasa 并提及 "space / 太空"，有概率解锁深空传令官。', en: 'Type @nasa and mention "space" for a chance to unlock.' } },
  { id: 'kanye', handles: ['kanyewest', 'ye'], keywords: ['ye', 'kanye', '侃爷', '椰子'],
    chance: 0.12, rarity: 'rare',
    title: { zh: '椰子球王', en: 'Yeezy Baller' },
    badge: { zh: '椰子球王', en: 'Yeezy Baller' },
    desc:  { zh: '输入 @kanyewest 并提及 "ye / kanye"，有概率解锁椰子球王。', en: 'Type @kanyewest and mention "ye/kanye" for a chance to unlock.' } },
  { id: 'taylor', handles: ['taylorswift13', 'taylorswift'], keywords: ['taylor', '霉霉', 'swift', '1989'],
    chance: 0.10, rarity: 'epic',
    title: { zh: '时代歌姬', en: 'Era Diva' },
    badge: { zh: '时代歌姬', en: 'Era Diva' },
    desc:  { zh: '输入 @taylorswift13 并提及 "taylor / 霉霉"，有概率解锁时代歌姬。', en: 'Type @taylorswift13 and mention "taylor" for a chance to unlock.' } }
];

/* ---------- 失败文案 ---------- */
XPM.FAILS = {
  not_found:  { title: { zh: '这个账号不存在', en: 'This account does not exist' },
                desc:  { zh: '可能改名了，或者手滑输错。', en: 'Maybe renamed, or a typo.' } },
  private:    { title: { zh: '他关了门', en: 'Account is private' },
                desc:  { zh: '只能看到门口的牌子，战力拼不完整。', en: 'Only the door plate is visible; score incomplete.' } },
  rate_limit: { title: { zh: '今天打的人太多', en: 'Too many scans today' },
                desc:  { zh: '过一会儿再来，缓存里的结果还能看。', en: 'Come back later; cached results still work.' } },
  fetch:      { title: { zh: '档案出来了，近况还没打上', en: 'Profile loaded, activity pending' },
                desc:  { zh: '先用档案战力顶上，稍后刷新可补全。', en: 'Using profile-based score; refresh later to complete.' } }
};

  return XPM;
});
