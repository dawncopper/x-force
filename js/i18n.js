/* ============================================================
   X战力镜 · i18n.js
   中英自动切换：浏览器语言检测 + 手动覆盖（自动 / 中 / EN）
   依赖 core.js（core.setLang / core.getLang）
   静态文案：元素加 data-i18n / data-i18n-ph / data-i18n-aria / data-i18n-title
   动态文案：XPM.i18n.t(key, params) / XPM.i18n.L({zh,en} 对象)
   切换后需重算当前结果时：XPM.i18n.onChange(cb)
   ============================================================ */
(function () {
  'use strict';
  const XPM = window.XPM = window.XPM || {};
  const core = XPM.core;

  const DICT = {
    zh: {
      'doc.title': 'X战力镜 · 输入账号，查看战力',
      'doc.desc': '输入一个 X 账号，8 秒内给出可晒的战力值、个性称号和一句短评。公开数据，仅供娱乐对线。',
      'brand.name': '战力镜',
      'theme.aria': '切换明暗模式',
      'theme.title': '切换明暗模式',
      'theme.mode.auto': '跟随系统',
      'theme.mode.dark': '深色',
      'theme.mode.light': '浅色',
      'theme.title.tpl': '明暗模式：{mode}',
      'lang.auto': '自动',
      'lang.aria': '界面语言 / Language',
      'hero.title1': '输入账号，',
      'hero.title2': '查看战力',
      'hero.sub': '8 秒出分 · 可晒的战力值 + 个性称号 + 一句短评',
      'scan.placeholder': 'X 账号，如 elonmusk',
      'scan.aria': 'X 账号',
      'scan.clear.aria': '清空输入',
      'scan.btn': '查看战力',
      'scan.note': '公开数据 · 仅供娱乐对线 · 不登录不授权不装插件',
      'status.parsing': '正在解析账号…',
      'status.fetching': '正在取公开档案与近帖…',
      'score.unit': '分',
      'result.partial': '近况未计入',
      'result.followers': '{f} 粉丝 · {g} 关注',
      'result.aliasWrap': '「{a}」',
      'result.specialPrefix': '已发现特称：',
      'dim.volume': '体量',
      'dim.structure': '结构',
      'dim.burst': '爆发',
      'dim.activity': '活性',
      'act.copy': '复制文案',
      'act.poster': '生成海报',
      'act.again': '再测一个',
      'act.vs': '拉出来对比',
      'toast.cached': '来自 12 小时缓存，结果已冻结',
      'toast.copied': '已复制，直接去 X 发帖',
      'vs.title': '拉出来对比',
      'vs.sub': '各测一次，看谁赢在爆发，谁赢在体量',
      'vs.placeholder': '再输一个 X 账号',
      'vs.aria': '对比账号',
      'vs.btn': '开测对比',
      'vs.back': '← 返回',
      'vs.quotaShort': '今日新测算配额不足（对比需 2 次），先测自己的缓存吧。',
      'vs.notFound': '没查到对方，换个号试试。',
      'vs.tie': '战力打平，谁也别说谁。',
      'vs.winBurst': '{u} 赢在爆发',
      'vs.winVolume': '{u} 赢在体量',
      'vs.winActivity': '{u} 赢在活性',
      'vs.winOverall': '{u} 综合略胜',
      'vs.join': '，',
      'vs.end': '。',
      'fail.back': '再试一次',
      'fail.manual': '取数失败了？手填四个数',
      'fail.notFoundTitle': '这个账号不存在',
      'fail.notFoundDesc': '可能改名了，或者手滑输错。',
      'manual.followers': '粉丝数',
      'manual.following': '关注数',
      'manual.created': '注册天数',
      'manual.statuses': '总帖数',
      'manual.followers.ph': '如 272',
      'manual.following.ph': '如 318',
      'manual.created.ph': '如 1560',
      'manual.statuses.ph': '如 4200',
      'manual.submit': '用手填数据测算',
      'foot.summary': '公式与数据来源',
      'foot.formula': '战力 = 体量 25% + 结构 20% + 爆发 35% + 活性 20%。体量按粉丝对数；爆发取近 20 帖去极值后的中位互动 / 粉丝；活性看近 14 天在场、原创比与发帖节奏。数据仅来自公开档案与公开近帖，不做任何非公开分析。',
      'foot.disclaimer': '娱乐战力，不是官方权重，不能当投放依据，不代表人品。',
      'poster.download': '发到 X',
      'poster.close': '关闭',
      'poster.canvasAria': '战力海报',
      'poster.brand': 'X 战力镜',
      'poster.tagline': 'X POWER MIRROR',
      'poster.scoreLabel': '战力值',
      'poster.tryYours': '你也来测：',
      'poster.disclaimer': '娱乐战力 · 不是官方权重',
      'toast.poster.exportBlocked': '图片导出被拦截，已打开发帖页',
      'toast.poster.saved': '图片已保存，请在发帖页添加图片后发布',
      'toast.poster.opened': '已打开发帖页，请粘贴文案后发布',
      'quota.tpl': '今日新测算剩余 {n} 次；同一账号回看不占次数',
      'nav.settings': '设置',
      'nav.leaderboard': '榜单',
      'nav.collection': '图鉴',
      'settings.title': '设置',
      'settings.sound': '音效',
      'settings.sound.desc': '揭晓动效音效',
      'settings.vibrate': '震动',
      'settings.vibrate.desc': '手机震动反馈',
      'rarity.common': '普通',
      'rarity.uncommon': '罕见',
      'rarity.rare': '稀有',
      'rarity.epic': '史诗',
      'rarity.legendary': '传说',
      'rarity.label': '稀有度：{r}',
      'reroll.title': '换一个梗',
      'reroll.hint': '点击换一个新梗文案',
      'reroll.done': '已换梗，新称号已生效',
      'egg.badgeLabel': '彩蛋徽章',
      'egg.unlocked': '解锁新彩蛋称号',
      'collection.title': '彩蛋图鉴',
      'collection.sub': '收集隐藏彩蛋称号',
      'collection.progress': '已收集 {a} / {b}',
      'collection.empty': '还没触发过彩蛋，去试试看',
      'collection.locked': '未解锁',
      'collection.unlocked': '已解锁',
      'challenge.title': '发起挑战',
      'challenge.sub': '把你的战力做成挑战链接，让对方应战',
      'challenge.placeholder': '被挑战账号，如 jack',
      'challenge.btn': '生成挑战链接',
      'challenge.linkTitle': '挑战链接',
      'challenge.copy': '复制',
      'challenge.copied': '挑战链接已复制',
      'challenge.my': '我的挑战',
      'challenge.empty': '还没发起过挑战',
      'challenge.pending': '等待应战',
      'challenge.responded': '已应战',
      'challenge.landing': '挑战',
      'challenge.from': '{u} 向你发起挑战',
      'challenge.theirScore': '对方战力',
      'challenge.yourScore': '你的战力',
      'challenge.acceptBtn': '接受挑战，回测我的账号',
      'challenge.acceptPh': '你的 X 账号',
      'vs.self': '不能挑战自己',
      'challenge.resultWin': '你赢了 {u}！',
      'challenge.resultLose': '你输给了 {u}',
      'challenge.resultTie': '和你打平了',
      'trend.title': '战力周报',
      'trend.sub': '同一账号历次测试趋势（跨设备同步）',
      'trend.empty': '还没有历史记录',
      'trend.record': '每次新测算自动记录',
      'trend.list': '历史记录',
      'trend.close': '关闭',
      'lb.title': '趣味榜单',
      'lb.sub': '全站热测账号，看谁被测最多',
      'lb.empty': '榜单还是空的，来测第一发',
      'lb.rank': '排名',
      'lb.account': '账号',
      'lb.scans': '测试次数',
      'lb.best': '最高战力',
      'lb.close': '关闭',
      'sound.on': '开',
      'sound.off': '关',
      'poster.limited': '限定',
      'sheet.close': '关闭'
    },
    en: {
      'doc.title': 'X Power Mirror · enter an account, see its power',
      'brand.name': 'Power Mirror',
      'theme.aria': 'Toggle light/dark mode',
      'theme.title': 'Toggle light/dark mode',
      'theme.mode.auto': 'Auto',
      'theme.mode.dark': 'Dark',
      'theme.mode.light': 'Light',
      'theme.title.tpl': 'Mode: {mode}',
      'lang.auto': 'Auto',
      'lang.aria': 'Language',
      'hero.title1': 'Enter an account,',
      'hero.title2': 'see its power',
      'hero.sub': 'Score in 8s · shareable power score + title + one-liner',
      'scan.placeholder': 'X account, e.g. elonmusk',
      'scan.aria': 'X account',
      'scan.clear.aria': 'Clear input',
      'scan.btn': 'Check power',
      'scan.note': 'Public data · for fun only · no login, no permission, no plugin',
      'status.parsing': 'Parsing account…',
      'status.fetching': 'Fetching public profile & recent posts…',
      'score.unit': '',
      'result.partial': 'Recent activity not counted',
      'result.followers': '{f} followers · {g} following',
      'result.aliasWrap': '"{a}"',
      'result.specialPrefix': 'Special title: ',
      'dim.volume': 'Volume',
      'dim.structure': 'Structure',
      'dim.burst': 'Burst',
      'dim.activity': 'Activity',
      'act.copy': 'Copy text',
      'act.poster': 'Poster',
      'act.again': 'Scan another',
      'act.vs': 'Compare',
      'toast.cached': 'From 12h cache; result frozen',
      'toast.copied': 'Copied — go post it on X',
      'vs.title': 'Compare',
      'vs.sub': 'Scan both to see who wins on burst vs volume',
      'vs.placeholder': 'Another X account',
      'vs.aria': 'Compare account',
      'vs.btn': 'Compare',
      'vs.back': '← Back',
      'vs.quotaShort': 'Not enough quota for a new scan (compare needs 2). Check your cached result first.',
      'vs.notFound': 'Could not find them. Try another account.',
      'vs.tie': 'A tie — neither side can brag.',
      'vs.winBurst': '{u} wins on burst',
      'vs.winVolume': '{u} wins on volume',
      'vs.winActivity': '{u} wins on activity',
      'vs.winOverall': '{u} wins overall',
      'vs.join': ', ',
      'vs.end': '. ',
      'fail.back': 'Try again',
      'fail.manual': 'Fetch failed? Enter four numbers',
      'fail.notFoundTitle': 'Account not found',
      'fail.notFoundDesc': 'Maybe renamed, or a typo.',
      'manual.followers': 'Followers',
      'manual.following': 'Following',
      'manual.created': 'Account age (days)',
      'manual.statuses': 'Total posts',
      'manual.followers.ph': 'e.g. 272',
      'manual.following.ph': 'e.g. 318',
      'manual.created.ph': 'e.g. 1560',
      'manual.statuses.ph': 'e.g. 4200',
      'manual.submit': 'Calculate with manual data',
      'foot.summary': 'Formula & data source',
      'foot.formula': 'Power = Volume 25% + Structure 20% + Burst 35% + Activity 20%. Volume uses log of followers; Burst uses median interaction/follower of recent 20 posts (trimmed); Activity looks at 14-day presence, originality ratio and posting rhythm. Data comes only from public profiles and public posts.',
      'foot.disclaimer': 'For fun only. Not an official weight, not for ads, not a judgment of character.',
      'poster.download': 'Share to X',
      'poster.close': 'Close',
      'poster.canvasAria': 'Power poster',
      'poster.brand': 'X POWER MIRROR',
      'poster.scoreLabel': 'POWER',
      'poster.tryYours': 'Try yours: ',
      'poster.disclaimer': 'For fun · not official',
      'toast.poster.exportBlocked': 'Image export blocked — opened the composer',
      'toast.poster.saved': 'Image saved — attach it in the composer',
      'toast.poster.opened': 'Composer opened — paste the text and post',
      'quota.tpl': '{n} fresh scans left today; re-checking the same account is free',
      'nav.settings': 'Settings',
      'nav.leaderboard': 'Leaderboard',
      'nav.collection': 'Collection',
      'settings.title': 'Settings',
      'settings.sound': 'Sound',
      'settings.sound.desc': 'Reveal sound effects',
      'settings.vibrate': 'Vibration',
      'settings.vibrate.desc': 'Phone vibration feedback',
      'rarity.common': 'Common',
      'rarity.uncommon': 'Uncommon',
      'rarity.rare': 'Rare',
      'rarity.epic': 'Epic',
      'rarity.legendary': 'Legendary',
      'rarity.label': 'Rarity: {r}',
      'reroll.title': 'Reroll',
      'reroll.hint': 'Click to roll a new gag line',
      'reroll.done': 'Rerolled — new title applied',
      'egg.badgeLabel': 'Egg badge',
      'egg.unlocked': 'Hidden egg title unlocked',
      'collection.title': 'Egg Collection',
      'collection.sub': 'Collect hidden egg titles',
      'collection.progress': '{a} of {b} collected',
      'collection.empty': 'No eggs yet — go try some',
      'collection.locked': 'Locked',
      'collection.unlocked': 'Unlocked',
      'challenge.title': 'Challenge',
      'challenge.sub': 'Turn your power into a duel link',
      'challenge.placeholder': 'Challenged account, e.g. jack',
      'challenge.btn': 'Create duel link',
      'challenge.linkTitle': 'Duel link',
      'challenge.copy': 'Copy',
      'challenge.copied': 'Duel link copied',
      'challenge.my': 'My duels',
      'challenge.empty': 'No duels yet',
      'challenge.pending': 'Waiting',
      'challenge.responded': 'Responded',
      'challenge.landing': 'Duel',
      'challenge.from': '{u} challenged you',
      'challenge.theirScore': 'Their power',
      'challenge.yourScore': 'Your power',
      'challenge.acceptBtn': 'Accept & scan my account',
      'challenge.acceptPh': 'Your X account',
      'vs.self': "You can't challenge yourself",
      'challenge.resultWin': 'You beat {u}!',
      'challenge.resultLose': 'You lost to {u}',
      'challenge.resultTie': "It's a tie with you",
      'trend.title': 'Power Trend',
      'trend.sub': 'Score history for this account (cross-device)',
      'trend.empty': 'No history yet',
      'trend.record': 'Recorded on each fresh scan',
      'trend.list': 'History',
      'trend.close': 'Close',
      'lb.title': 'Leaderboard',
      'lb.sub': 'Most-scanned accounts sitewide',
      'lb.empty': 'Nobody yet — be the first',
      'lb.rank': 'Rank',
      'lb.account': 'Account',
      'lb.scans': 'Scans',
      'lb.best': 'Best',
      'lb.close': 'Close',
      'sound.on': 'On',
      'sound.off': 'Off',
      'poster.limited': 'Limited',
      'sheet.close': 'Close'
    }
  };

  let LANG = 'zh';
  const listeners = [];

  function detect() {
    const saved = localStorage.getItem('xpm:lang');
    if (saved === 'zh' || saved === 'en') return saved;
    // auto / 未设置：跟随浏览器语言
    const nav = String(navigator.language || navigator.userLanguage || 'zh').toLowerCase();
    return nav.indexOf('en') === 0 ? 'en' : 'zh';
  }

  function t(key, params) {
    const cur = DICT[LANG] && DICT[LANG][key];
    const val = cur != null ? cur : (DICT.zh[key] != null ? DICT.zh[key] : key);
    if (!params) return val;
    return Object.keys(params).reduce((s, k) => s.replace('{' + k + '}', params[k]), val);
  }

  /* 取 {zh,en} 对象的当前语言值（供 FAILS 等数据对象使用） */
  function L(obj) {
    if (obj && typeof obj === 'object') return obj[LANG] || obj.zh || '';
    return obj == null ? '' : String(obj);
  }

  function apply() {
    document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); });
    document.querySelectorAll('[data-i18n-meta]').forEach(el => { el.setAttribute('content', t(el.getAttribute('data-i18n-meta'))); });

    // 切换控件高亮
    const saved = localStorage.getItem('xpm:lang') || 'auto';
    document.querySelectorAll('.lang-switch__btn').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === saved);
    });

    listeners.forEach(fn => { try { fn(); } catch (e) { /* 忽略单次回调异常 */ } });
  }

  function setLang(mode) {
    if (mode !== 'zh' && mode !== 'en' && mode !== 'auto') mode = 'auto';
    localStorage.setItem('xpm:lang', mode);
    const next = mode === 'auto' ? detect() : mode;
    LANG = next;
    core.setLang(LANG);
    apply();
  }

  function init() {
    LANG = detect();
    core.setLang(LANG);
    document.querySelectorAll('.lang-switch__btn').forEach(b => {
      b.addEventListener('click', () => setLang(b.getAttribute('data-lang')));
    });
    apply();
  }

  XPM.i18n = {
    init,
    setLang,
    getLang: () => LANG,
    t,
    L,
    onChange: fn => listeners.push(fn)
  };
})();
