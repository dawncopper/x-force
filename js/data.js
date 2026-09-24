/* ============================================================
   X战力镜 · data.js
   词库 / 段位表 / 特称规则 / 失败文案（中英双语）
   浏览器：挂 window.XPM；Node：module.exports = XPM
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

/* ---------- 主称号词库 ---------- */
XPM.WORDS = {
  volume: [
    { zh: '巷口摊', en: 'Corner Booth' },
    { zh: '街区',   en: 'Block Star' },
    { zh: '城南',   en: 'South Town' },
    { zh: '广场',   en: 'Plaza' },
    { zh: '城门',   en: 'City Gate' },
    { zh: '半座城', en: 'Half the City' }
  ],
  style: [
    { zh: '段子手', en: 'Meme King' },
    { zh: '复读机', en: 'Repeater' },
    { zh: '夜猫子', en: 'Night Owl' },
    { zh: '广告贩', en: 'Ad Peddler' },
    { zh: '教科书', en: 'Textbook' },
    { zh: '嘴替',   en: 'Spokesperson' },
    { zh: '潜水员', en: 'Lurker' }
  ],
  play: [
    { zh: '哑火',     en: 'Misfire' },
    { zh: '冷枪',     en: 'Sniper' },
    { zh: '对线',     en: 'Duelist' },
    { zh: '抬杠',     en: "Devil's Advocate" },
    { zh: '开麦',     en: 'Mic Dropper' },
    { zh: '广播',     en: 'Broadcaster' },
    { zh: '转发中枢', en: 'Retweet Hub' }
  ],
  struct: [
    { zh: '来而不往',   en: 'No Reciprocity' },
    { zh: '广结善缘',   en: 'Friend Maker' },
    { zh: '互粉专业户', en: 'Follow-Farm Pro' },
    { zh: '高台喊话',   en: 'Sermonizer' }
  ]
};

/* ---------- 特称规则（命中即替换/前置） ---------- */
XPM.SPECIALS = [
  { id: 'pocket_powder',   cond: r => r.burstHigh && r.lowFollowers,            title: { zh: '袖珍火药桶', en: 'Pocket Cannon' } },
  { id: 'empty_horn',      cond: r => r.highFollowers && r.deadBurst,           title: { zh: '空城大喇叭', en: 'Empty Megaphone' } },
  { id: 'social_worker',   cond: r => r.following > r.followers * 3,            title: { zh: '社交勤务兵', en: 'Social Butterfly' } },
  { id: 'hibernator',      cond: r => r.silentDays >= 14,                       title: { zh: '冬眠户', en: 'Hibernator' } },
  { id: 'relay_station',   cond: r => r.retweetRatio >= 0.8,                    title: { zh: '搬运站长', en: 'Relay Station' } },
  { id: 'reply_committee', cond: r => r.replyRatio >= 0.5,                      title: { zh: '评论区居委会', en: 'Reply Committee' } },
  { id: 'metronome',       cond: r => r.metronome,                              title: { zh: '值班机器人', en: 'Bot on Duty' } },
  { id: 'cold_bench',      cond: r => r.verified && r.deadBurst,                title: { zh: '认证冷板凳', en: 'Verified Benchwarmer' } },
  { id: 'instant_boom',    cond: r => r.newAccount && r.burstHigh,              title: { zh: '落地即爆', en: 'Instant Boom' } },
  { id: 'antique_idle',    cond: r => r.oldAccount && r.lowStatuses,            title: { zh: '古董闲置号', en: 'Antique Idle' } }
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
