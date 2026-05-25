/* ═══════════════════════════════════════════════════════════════
   BLACK CAT CALCULATOR — Cat Paw Numpad
   Features: 3D press effects · Web Audio cat sounds · Ripple
═══════════════════════════════════════════════════════════════ */
"use strict";

(function () {

  /* ── DOM refs ─────────────────────────────────────────────── */
  const overlay      = document.getElementById("numpadOverlay");
  const toggleBtn    = document.getElementById("numpadToggle");
  const closeBtn     = document.getElementById("numpadClose");
  const soundBtn     = document.getElementById("soundToggle");
  const displayEl    = document.getElementById("numpadDisplay");
  const targetLabel  = document.getElementById("numpadTargetLabel");
  const purrText     = document.getElementById("purrText");

  /* ── State ───────────────────────────────────────────────── */
  let isOpen    = false;
  let soundOn   = true;
  let activeInp = null;   // the focused <input>
  let audioCtx  = null;   // lazy-init AudioContext

  /* ═════════════════════════════════════════════════════════
     WEB AUDIO — Cat sounds synthesised with oscillators
     Each "sound" is a short envelope-shaped tone cluster
     that mimics a cat vocalisation.
  ═════════════════════════════════════════════════════════ */
  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  /* Basic tone helper */
  function tone(freq, type, startTime, duration, gain, ctx) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /* Meow — for digit keys */
  function soundMeow() {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    // Formant 1 — rising pitch "me"
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.connect(g1); g1.connect(ctx.destination);
    o1.type = "sawtooth";
    o1.frequency.setValueAtTime(380, t);
    o1.frequency.linearRampToValueAtTime(560, t + 0.08);
    o1.frequency.exponentialRampToValueAtTime(320, t + 0.22);
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.12, t + 0.015);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o1.start(t); o1.stop(t + 0.3);
    // Harmonic shimmer
    tone(760, "sine", t, 0.2, 0.04, ctx);
  }

  /* Purr click — short soft tap */
  function soundClick() {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    tone(280, "sine",     t,        0.08, 0.09, ctx);
    tone(560, "triangle", t,        0.05, 0.04, ctx);
    tone(140, "sine",     t + 0.01, 0.06, 0.06, ctx);
  }

  /* Hiss — for backspace/clear */
  function soundHiss() {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    const flt = ctx.createBiquadFilter();
    const env = ctx.createGain();
    src.buffer = buf;
    flt.type = "bandpass"; flt.frequency.value = 3200; flt.Q.value = 0.8;
    src.connect(flt); flt.connect(env); env.connect(ctx.destination);
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.start(t);
    // low growl underneath
    tone(80, "sawtooth", t, 0.1, 0.06, ctx);
  }

  /* Enter meow — triumphant */
  function soundEnter() {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    // rising two-note "mrrow"
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(300, t);
    o.frequency.linearRampToValueAtTime(480, t + 0.1);
    o.frequency.setValueAtTime(360, t + 0.13);
    o.frequency.linearRampToValueAtTime(520, t + 0.24);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.42);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.start(t); o.stop(t + 0.5);
    tone(600, "sine", t + 0.05, 0.3, 0.05, ctx);
  }

  /* Open panel sound */
  function soundOpen() {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    [320, 420, 540].forEach((f, i) => tone(f, "sine", t + i * 0.06, 0.14, 0.08, ctx));
  }

  function playSound(type) {
    if (!soundOn) return;
    try {
      if      (type === "digit")     soundMeow();
      else if (type === "del")       soundHiss();
      else if (type === "enter")     soundEnter();
      else if (type === "open")      soundOpen();
      else                           soundClick();
    } catch(e) {}
  }

  /* ═══════════════════════════════════════════════════════
     OPEN / CLOSE
  ═══════════════════════════════════════════════════════ */
  function openPanel() {
    isOpen = true;
    overlay.classList.add("open");
    toggleBtn.classList.add("active");
    updateDisplay();
    playSound("open");
  }
  function closePanel() {
    isOpen = false;
    overlay.classList.remove("open");
    toggleBtn.classList.remove("active");
  }

  toggleBtn.addEventListener("click", () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener("click", closePanel);

  /* Close on outside click */
  document.addEventListener("pointerdown", e => {
    if (!isOpen) return;
    if (!overlay.contains(e.target) && !toggleBtn.contains(e.target)) closePanel();
  });

  /* ═══════════════════════════════════════════════════════
     SOUND TOGGLE
  ═══════════════════════════════════════════════════════ */
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? "🔊" : "🔇";
    soundBtn.classList.toggle("muted", !soundOn);
  });

  /* ═══════════════════════════════════════════════════════
     TRACK ACTIVE INPUT
  ═══════════════════════════════════════════════════════ */
  document.querySelectorAll("input[type='number'], input[type='text']").forEach(inp => {
    inp.addEventListener("focus", () => {
      activeInp = inp;
      updateDisplay();
      updateLabel(inp);
      if (!isOpen) openPanel();
    });
  });

  function updateDisplay() {
    if (!activeInp) {
      displayEl.innerHTML = '<span class="numpad-hint">klik input dulu...</span>';
      displayEl.classList.remove("lit");
      return;
    }
    displayEl.classList.add("lit");
    displayEl.textContent = activeInp.value || "0";
  }

  function updateLabel(inp) {
    const prev = inp.previousElementSibling;
    const lbl = (prev && prev.tagName === "LABEL") ? prev.textContent : inp.id;
    targetLabel.textContent = lbl || inp.id;
  }

  /* Physical keyboard also refreshes display */
  document.addEventListener("keyup", () => {
    if (isOpen && activeInp) updateDisplay();
  });

  /* ═══════════════════════════════════════════════════════
     RIPPLE EFFECT
  ═══════════════════════════════════════════════════════ */
  function spawnRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const r = document.createElement("span");
    r.className = "paw-ripple";
    r.style.left = (e.clientX - rect.left) + "px";
    r.style.top  = (e.clientY - rect.top)  + "px";
    btn.appendChild(r);
    r.addEventListener("animationend", () => r.remove());
  }

  /* ═══════════════════════════════════════════════════════
     KEY LOGIC
  ═══════════════════════════════════════════════════════ */
  const purrSeq = ["zzz...", "purr~", "meow♪", "nyaa~", "≽^•ω•^≼", "mrrow~", "prrr..."];
  let purrIdx = 0;

  function cyclePurr(special) {
    if (special) { purrText.textContent = "✨ nyaa! ✨"; setTimeout(() => purrText.textContent = "purr~", 900); return; }
    purrIdx = (purrIdx + 1) % purrSeq.length;
    purrText.textContent = purrSeq[purrIdx];
  }

  function handleKey(val, btn, e) {
    if (!activeInp) return;

    /* Ripple */
    spawnRipple(btn, e);

    /* Tap bounce */
    btn.classList.remove("tapped");
    void btn.offsetWidth;
    btn.classList.add("tapped");
    btn.addEventListener("animationend", () => btn.classList.remove("tapped"), { once: true });

    let cur = activeInp.value;

    switch (val) {
      case "backspace":
        activeInp.value = cur.slice(0, -1);
        playSound("del");
        cyclePurr(false);
        break;

      case "clear":
        activeInp.value = "";
        playSound("del");
        purrText.textContent = "hisss~";
        setTimeout(() => purrText.textContent = "zzz...", 700);
        break;

      case "enter": {
        // find & click nearest .calc-btn
        const panel = activeInp.closest(".tab-panel, .conv-panel, .card");
        const calcBtn = panel && panel.querySelector(".calc-btn");
        if (calcBtn) { calcBtn.click(); cyclePurr(true); }
        playSound("enter");
        break;
      }

      case "negate":
        if (cur && cur !== "0") {
          activeInp.value = cur.startsWith("-") ? cur.slice(1) : "-" + cur;
        }
        playSound("click");
        cyclePurr(false);
        break;

      case ".":
        if (activeInp.type === "text") break;  // no decimals for base-conversion
        if (!cur.includes(".")) activeInp.value = (cur || "0") + ".";
        playSound("click");
        cyclePurr(false);
        break;

      default:
        // digit
        activeInp.value = (cur === "0" || cur === "") ? val : cur + val;
        playSound("digit");
        cyclePurr(false);
    }

    activeInp.dispatchEvent(new Event("input", { bubbles: true }));
    updateDisplay();
  }

  /* Attach listeners to all numpad keys */
  document.querySelectorAll(".paw-key").forEach(btn => {
    btn.addEventListener("click", e => {
      const val = btn.dataset.val;
      if (val) handleKey(val, btn, e);
    });
  });

  /* ═══════════════════════════════════════════════════════
     3D MOUSE TILT on panel (subtle parallax)
  ═══════════════════════════════════════════════════════ */
  const panel = document.querySelector(".numpad-panel");
  overlay.addEventListener("mousemove", e => {
    const rect = panel.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    panel.style.transform = `rotateY(${dx * 7}deg) rotateX(${-dy * 5}deg)`;
    panel.style.transition = "transform .1s";
  });
  overlay.addEventListener("mouseleave", () => {
    panel.style.transform = "rotateY(0) rotateX(0)";
    panel.style.transition = "transform .4s ease";
  });

})();
