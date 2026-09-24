/* ============================================================
   X战力镜 · data.js
   词库 / 段位表 / 特称规则 / 失败文案
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
  { min: 105, label: '某车企老板' },
  { min: 97,  label: '大V' },
  { min: 87,  label: '中V' },
  { min: 72,  label: '小有名气' },
  { min: 55,  label: '圈子熟脸' },
  { min: 32,  label: '街区名人' },
  { min: 18,  label: '普通居民' },
  { min: 0,   label: '新号' }
];

/* ---------- 主称号词库 ---------- */
XPM.WORDS = {
  volume: ['巷口摊', '街区', '城南', '广场', '城门', '半座城'],      // 体量词
  style:  ['段子手', '复读机', '夜猫子', '广告贩', '教科书', '嘴替', '潜水员'], // 气味词
  play:   ['哑火', '冷枪', '对线', '抬杠', '开麦', '广播', '转发中枢'],        // 打法词
  struct: ['来而不往', '广结善缘', '互粉专业户', '高台喊话']                   // 结构词
};

/* ---------- 特称规则（命中即替换/前置） ---------- */
XPM.SPECIALS = [
  { id: 'pocket_powder',   cond: r => r.burstHigh && r.lowFollowers,            title: '袖珍火药桶' },
  { id: 'empty_horn',      cond: r => r.highFollowers && r.deadBurst,           title: '空城大喇叭' },
  { id: 'social_worker',   cond: r => r.following > r.followers * 3,            title: '社交勤务兵' },
  { id: 'hibernator',      cond: r => r.silentDays >= 14,                       title: '冬眠户' },
  { id: 'relay_station',   cond: r => r.retweetRatio >= 0.8,                    title: '搬运站长' },
  { id: 'reply_committee', cond: r => r.replyRatio >= 0.5,                      title: '评论区居委会' },
  { id: 'metronome',       cond: r => r.metronome,                              title: '值班机器人' },
  { id: 'cold_bench',      cond: r => r.verified && r.deadBurst,                title: '认证冷板凳' },
  { id: 'instant_boom',    cond: r => r.newAccount && r.burstHigh,              title: '落地即爆' },
  { id: 'antique_idle',    cond: r => r.oldAccount && r.lowStatuses,            title: '古董闲置号' }
];

/* ---------- 失败文案 ---------- */
XPM.FAILS = {
  not_found:  { title: '这个账号不存在', desc: '可能改名了，或者手滑输错。' },
  private:    { title: '他关了门', desc: '只能看到门口的牌子，战力拼不完整。' },
  rate_limit: { title: '今天打的人太多', desc: '过一会儿再来，缓存里的结果还能看。' },
  fetch:      { title: '档案出来了，近况还没打上', desc: '先用档案战力顶上，稍后刷新可补全。' }
};

  return XPM;
});
