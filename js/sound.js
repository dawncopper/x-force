/* ============================================================
   X战力镜 · sound.js
   揭晓动效的音效 / 震动 / 偏好设置（设置面板开关，默认开）
   - 音效：WebAudio 合成短音（无需音频文件）
   - 震动：navigator.vibrate（仅移动端支持）
   - 偏好：localStorage 'xpm:pref' -> { sound: true, vibrate: true }
   ============================================================ */
'use strict';

(function () {
  const XPM = window.XPM = window.XPM || {};

  const KEY = 'xpm:pref';
  const DEFAULTS = { sound: true, vibrate: true };

  const pref = {
    get() {
      try {
        const o = JSON.parse(localStorage.getItem(KEY) || '{}');
        return { sound: o.sound !== false, vibrate: o.vibrate !== false };
      } catch (e) { return Object.assign({}, DEFAULTS); }
    },
    set(patch) {
      const next = Object.assign(this.get(), patch);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* 忽略 */ }
      return next;
    }
  };

  /* ---------- WebAudio 短音合成 ---------- */
  let AC = null;
  function ctx() {
    if (!AC) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      AC = new Ctor();
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(ac, freq, t0, dur, type, vol) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const KINDS = {
    // 揭晓：上行琶音，抽卡出货感
    reveal(ac, t0) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t0 + i * 0.09, 0.34, 'triangle', 0.16));
      tone(ac, 2093, t0 + 0.38, 0.5, 'sine', 0.07);
    },
    // 翻牌：短促滑音
    flip(ac, t0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(680, t0);
      o.frequency.exponentialRampToValueAtTime(260, t0 + 0.2);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(ac.destination);
      o.start(t0); o.stop(t0 + 0.24);
    },
    // 点击：极短滴答
    tap(ac, t0) {
      tone(ac, 880, t0, 0.05, 'square', 0.05);
    },
    // 彩蛋：金铃
    egg(ac, t0) {
      [1568, 2093, 2637].forEach((f, i) => tone(ac, f, t0 + i * 0.07, 0.5, 'sine', 0.12));
      tone(ac, 3136, t0 + 0.22, 0.7, 'sine', 0.05);
    }
  };

  const sound = {
    play(kind) {
      if (!pref.get().sound) return;
      const ac = ctx();
      if (!ac) return;
      try { (KINDS[kind] || KINDS.tap)(ac, ac.currentTime + 0.01); } catch (e) { /* 忽略 */ }
    },
    vibrate(pattern) {
      if (!pref.get().vibrate) return;
      try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* 忽略 */ }
    }
  };

  XPM.pref = pref;
  XPM.sound = sound;
})();
