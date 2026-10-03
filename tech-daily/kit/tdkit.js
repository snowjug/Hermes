/* tech-daily runtime: builds the one paused GSAP timeline from window.TD_DATA and data-anim attributes.
 * Deterministic: every tween sits at an absolute time computed at build time; no clocks, no randomness. */
(function () {
  var D = window.TD_DATA;
  var tl = gsap.timeline({ paused: true });
  var T = D.duration;

  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function q(sel) { return document.querySelector(sel); }

  // ---------- element presets (data-anim="name" data-at="seconds" [data-dur] ...) ----------
  var P = {
    slam: function (el, t) {
      tl.fromTo(el, { scale: 2.4, opacity: 0, rotation: -3 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.3, ease: "power4.out" }, t);
    },
    pop: function (el, t) {
      tl.fromTo(el, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.38, ease: "back.out(2.2)" }, t);
    },
    rise: function (el, t) {
      tl.fromTo(el, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, t);
    },
    drop: function (el, t) {
      tl.fromTo(el, { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: "back.out(1.6)" }, t);
    },
    whip: function (el, t) {
      tl.fromTo(el, { x: 520, opacity: 0, filter: "blur(18px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.34, ease: "power3.out" }, t);
    },
    fade: function (el, t) {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, t);
    },
    show: function (el, t) {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t);
    },
    wipe: function (el, t) {
      tl.fromTo(el, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.inOut" }, t);
    },
    grow: function (el, t, ds) {
      tl.fromTo(el, { scaleX: 0 }, { scaleX: num(ds.to, 1), duration: num(ds.dur, 0.8), ease: "power3.out" }, t);
    },
    kenburns: function (el, t, ds) {
      tl.fromTo(el, { scale: 1.0, y: 0 }, { scale: num(ds.scale, 1.12), y: num(ds.y, 0), duration: num(ds.dur, 3), ease: "none" }, t);
    },
    scroll: function (el, t, ds) {
      tl.fromTo(el, { y: 0 }, { y: -num(ds.dist, 300), duration: num(ds.dur, 3), ease: "power1.inOut" }, t);
    },
    count: function (el, t, ds) {
      var to = num(ds.to, 0), dec = parseInt(ds.dec || "0", 10), pre = ds.pre || "", suf = ds.suf || "";
      var o = { v: 0 };
      el.textContent = pre + (0).toFixed(dec) + suf;
      tl.to(o, { v: to, duration: num(ds.dur, 0.9), ease: "power2.out",
        onUpdate: function () { el.textContent = pre + o.v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suf; } }, t);
    },
    ring: function (el, t) {
      tl.fromTo(el, { scale: 0.5, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.7, ease: "power2.out" }, t);
    },
    flash: function (el, t) {
      tl.fromTo(el, { opacity: 0 }, { opacity: 0.75, duration: 0.05 }, t).to(el, { opacity: 0, duration: 0.25 }, t + 0.05);
    },
    stamp: function (el, t) {
      tl.fromTo(el, { scale: 3, opacity: 0, rotation: 12 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.25, ease: "power4.out" }, t);
    },
    strike: function (el, t) {
      tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, t);
    },
    out: function (el, t) {
      tl.to(el, { opacity: 0, y: -24, duration: 0.22, ease: "power2.in" }, t);
    },
    punch: function (el, t) {
      tl.fromTo(el, { scale: 1 }, { scale: 1.07, duration: 0.12, ease: "power2.out" }, t).to(el, { scale: 1, duration: 0.35, ease: "power2.inOut" }, t + 0.12);
    },
    shake: function (el, t) {
      tl.fromTo(el, { x: 0 }, { x: 14, duration: 0.04, repeat: 5, yoyo: true, ease: "none" }, t).set(el, { x: 0 }, t + 0.25);
    },
    riseSoft: function (el, t) {
      tl.fromTo(el, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, t);
    },
    fadeSlow: function (el, t) {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: "power1.inOut" }, t);
    },
    fadeOut: function (el, t) {
      tl.to(el, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, t);
    },
    pushin: function (el, t, ds) {
      tl.fromTo(el, { scale: 1.0 }, { scale: num(ds.scale, 1.06), duration: num(ds.dur, 4), ease: "none" }, t);
    },
    bob: function (el, t, ds) {
      var dur = num(ds.dur, 3), cyc = 1.2;
      tl.fromTo(el, { y: 0 }, { y: -12, duration: cyc / 2, yoyo: true, repeat: Math.max(0, Math.floor(dur / (cyc / 2)) - 1), ease: "sine.inOut" }, t);
    }
  };

  document.querySelectorAll("[data-anim]").forEach(function (el) {
    el.dataset.anim.split(" ").forEach(function (name, i) {
      var at = (el.dataset.at || "0").split(" ");
      var fn = P[name];
      if (fn) fn(el, num(at[i] !== undefined ? at[i] : at[0], 0), el.dataset);
    });
  });

  // ---------- captions: highlight each word while it is spoken ----------
  document.querySelectorAll(".cw").forEach(function (w) {
    var s = num(w.dataset.s, 0), e = num(w.dataset.e, s + 0.2);
    tl.fromTo(w, { opacity: 0.001, y: 18, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.12, ease: "back.out(2)" }, Math.max(0, s - 0.06));
    tl.fromTo(w, { color: D.theme.capText }, { color: w.classList.contains("em") ? D.theme.accent2 : D.theme.accent, scale: 1.12, duration: 0.07 }, s);
    tl.to(w, { color: w.classList.contains("em") ? D.theme.accent2 : D.theme.capText, scale: 1, duration: 0.12 }, e);
  });

  // ---------- documentary subtitles: each word brightens as it is spoken ----------
  document.querySelectorAll(".dw").forEach(function (w) {
    tl.fromTo(w, { opacity: 0.38 }, { opacity: 1, duration: 0.14, ease: "power1.out" }, num(w.dataset.s, 0));
  });

  // ---------- mascot ----------
  var M = D.mascot;
  if (M && q("#bit")) {
    var O = M.origins;
    var parts = { armL: "#bit-armL", foreL: "#bit-foreL", armR: "#bit-armR", foreR: "#bit-foreR", head: "#bit-head",
                  browL: "#bit-browL", browR: "#bit-browR", body: "#bit-body" };
    // Idle bob for the whole piece (finite repeat count).
    var cyc = 1.6;
    tl.fromTo("#bit-body", { y: 0 }, { y: -7, duration: cyc / 2, yoyo: true, ease: "sine.inOut",
      repeat: Math.max(0, Math.floor(T / (cyc / 2)) - 1) }, 0);
    // Blinks.
    M.blinks.forEach(function (t) {
      tl.to(["#bit-eyeL", "#bit-eyeR"], { scaleY: 0.1, svgOrigin: "200 135", duration: 0.05 }, t)
        .to(["#bit-eyeL", "#bit-eyeR"], { scaleY: 1, svgOrigin: "200 135", duration: 0.07 }, t + 0.06);
    });
    // Poses.
    M.poses.forEach(function (p) {
      Object.keys(p.rot).forEach(function (k) {
        tl.to(parts[k], { rotation: p.rot[k], svgOrigin: O[k], duration: p.d || 0.28, ease: p.ease || "back.out(1.7)" }, p.t);
      });
      if (p.jump) tl.fromTo("#bit-jump", { y: 0 }, { y: -40, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, p.t);
      if (p.fx) tl.fromTo(p.fx, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(3)", svgOrigin: "0 0" }, p.t)
        .to(p.fx, { opacity: 0, duration: 0.2 }, p.t + (p.fxHold || 1.2));
      if (p.bulb) tl.fromTo("#bit-bulb", { fill: D.theme.accent }, { fill: "#fff6a8", duration: 0.1, yoyo: true, repeat: 3 }, p.t);
    });
    // Mouth follows the voice envelope.
    M.mouth.forEach(function (seg) {
      var step = 1 / seg.fps;
      seg.v.forEach(function (v, i) {
        tl.set("#bit-mouth", { scaleY: 0.12 + 0.88 * v, svgOrigin: "200 178" }, seg.t + i * step);
      });
      tl.set("#bit-mouth", { scaleY: 0.12, svgOrigin: "200 178" }, seg.t + seg.v.length * step);
    });
  }

  tl.to({}, { duration: T }, 0);
  window.__timelines["main"] = tl;
})();
