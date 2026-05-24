/* ═══════════════════════════════════════════════════════════════
   BLACK CAT CALCULATOR  ·  main.js
═══════════════════════════════════════════════════════════════ */

"use strict";

/* ── History Store ─────────────────────────────────────────── */
const history = [];
let histCount = 0;

function addHistory(category, formula) {
  history.unshift({ category, formula, time: new Date().toLocaleTimeString("id-ID") });
  if (history.length > 50) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const count = document.getElementById("hist-count");
  count.textContent = history.length;

  if (history.length === 0) {
    list.innerHTML = '<li class="hist-empty">Belum ada riwayat perhitungan</li>';
    return;
  }
  list.innerHTML = history.map(h => `
    <li class="hist-item">
      <div class="hist-cat">${h.category}</div>
      <div class="hist-formula">${escHtml(h.formula)}</div>
      <div class="hist-meta">${h.time}</div>
    </li>
  `).join("");
}

document.getElementById("clearHistory").addEventListener("click", () => {
  history.length = 0;
  renderHistory();
});

/* ── Utils ─────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showResult(displayId, value, isError = false) {
  const el = document.getElementById(displayId);
  el.innerHTML = escHtml(String(value));
  el.classList.remove("has-result", "error");
  if (isError) el.classList.add("error");
  else el.classList.add("has-result");
}

function showFormula(id, text) {
  const el = document.getElementById(id);
  if (!text) { el.classList.remove("show"); return; }
  el.innerHTML = `<strong>Formula:</strong> ${escHtml(text)}`;
  el.classList.add("show");
}

function showSteps(id, stepsArr) {
  const el = document.getElementById(id);
  if (!stepsArr || !stepsArr.length) { el.classList.remove("show"); return; }
  el.innerHTML = `
    <div class="steps-box-header">Langkah-langkah</div>
    <ol>${stepsArr.map(s => `<li>${escHtml(s)}</li>`).join("")}</ol>
  `;
  el.classList.add("show");
}

async function apiPost(path, payload) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

function setLoading(btn, on) {
  if (on) btn.classList.add("loading");
  else btn.classList.remove("loading");
}

/* ══════════════════════════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════════════════════════ */
const htmlEl = document.documentElement;
const themeBtn = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("bc-theme") || "dark";
htmlEl.setAttribute("data-theme", savedTheme);

themeBtn.addEventListener("click", () => {
  const cur = htmlEl.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  htmlEl.setAttribute("data-theme", next);
  localStorage.setItem("bc-theme", next);
});

/* ══════════════════════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════════════════════ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

/* ══════════════════════════════════════════════════════════════
   CONVERSION SUB-TABS
══════════════════════════════════════════════════════════════ */
document.querySelectorAll(".conv-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".conv-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".conv-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`conv-${btn.dataset.conv}`).classList.add("active");
  });
});

/* ══════════════════════════════════════════════════════════════
   ARITHMETIC
══════════════════════════════════════════════════════════════ */
let arithOp = "add";
const needsB = new Set(["add","sub","mul","div","pow","mod","floordiv"]);

document.querySelectorAll("#tab-arithmetic .op-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tab-arithmetic .op-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    arithOp = btn.dataset.op;
    const bGroup = document.getElementById("arith-b-group");
    bGroup.style.display = needsB.has(arithOp) ? "block" : "none";
  });
});

document.getElementById("arith-calc").addEventListener("click", async () => {
  const btn = document.getElementById("arith-calc");
  const a = document.getElementById("arith-a").value;
  const b = document.getElementById("arith-b").value;

  if (a === "") { showResult("arith-result-display", "Masukkan nilai A!", true); return; }
  if (needsB.has(arithOp) && b === "") { showResult("arith-result-display", "Masukkan nilai B!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/arithmetic", { a, b: needsB.has(arithOp) ? b : null, op: arithOp });
    setLoading(btn, false);
    if (data.error) {
      showResult("arith-result-display", data.error, true);
    } else {
      showResult("arith-result-display", data.result);
      showFormula("arith-formula", data.formula);
      showSteps("arith-steps", data.steps);
      addHistory("Aritmatika", data.formula);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("arith-result-display", "Terjadi kesalahan.", true);
  }
});

/* Enter key shortcut */
["arith-a","arith-b"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("arith-calc").click();
  });
});

/* ══════════════════════════════════════════════════════════════
   LOGIC / BITWISE
══════════════════════════════════════════════════════════════ */
let logicOp = "and";
const logicNoB = new Set(["not"]);

document.querySelectorAll("#tab-logic .op-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tab-logic .op-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    logicOp = btn.dataset.op;
    const bGroup = document.getElementById("logic-b-group");
    bGroup.style.display = logicNoB.has(logicOp) ? "none" : "block";
  });
});

document.getElementById("logic-calc").addEventListener("click", async () => {
  const btn = document.getElementById("logic-calc");
  const a = document.getElementById("logic-a").value;
  const b = document.getElementById("logic-b").value;

  if (a === "") { showResult("logic-result-display", "Masukkan nilai A!", true); return; }
  if (!logicNoB.has(logicOp) && b === "") { showResult("logic-result-display", "Masukkan nilai B!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/logic", { a, b: logicNoB.has(logicOp) ? null : b, op: logicOp });
    setLoading(btn, false);
    if (data.error) {
      showResult("logic-result-display", data.error, true);
    } else {
      showResult("logic-result-display", data.result);
      showFormula("logic-formula", data.formula);
      showSteps("logic-steps", data.steps);
      addHistory("Logika/Bitwise", data.formula);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("logic-result-display", "Terjadi kesalahan.", true);
  }
});

/* ══════════════════════════════════════════════════════════════
   BASE CONVERSION
══════════════════════════════════════════════════════════════ */
document.getElementById("base-calc").addEventListener("click", async () => {
  const btn = document.getElementById("base-calc");
  const number = document.getElementById("base-number").value;
  const from_base = document.getElementById("base-from").value;
  const to_base = document.getElementById("base-to").value;

  if (!number) { showResult("base-result-display", "Masukkan angka!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/convert/base", { number, from_base, to_base });
    setLoading(btn, false);
    if (data.error) {
      showResult("base-result-display", data.error, true);
    } else {
      showResult("base-result-display", data.result);
      showFormula("base-formula", data.formula);
      showSteps("base-steps", data.steps);
      addHistory("Konversi Basis", data.formula);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("base-result-display", "Terjadi kesalahan.", true);
  }
});

/* ══════════════════════════════════════════════════════════════
   TEMPERATURE CONVERSION
══════════════════════════════════════════════════════════════ */
document.getElementById("temp-calc").addEventListener("click", async () => {
  const btn = document.getElementById("temp-calc");
  const value = document.getElementById("temp-value").value;
  const from_unit = document.getElementById("temp-from").value;
  const to_unit = document.getElementById("temp-to").value;

  if (value === "") { showResult("temp-result-display", "Masukkan nilai suhu!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/convert/temperature", { value, from_unit, to_unit });
    setLoading(btn, false);
    if (data.error) {
      showResult("temp-result-display", data.error, true);
    } else {
      showResult("temp-result-display", data.result + "°");
      showFormula("temp-formula", data.formula);
      showSteps("temp-steps", data.steps);
      addHistory("Konversi Suhu", data.formula);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("temp-result-display", "Terjadi kesalahan.", true);
  }
});

/* ══════════════════════════════════════════════════════════════
   CURRENCY CONVERSION
══════════════════════════════════════════════════════════════ */
document.getElementById("cur-calc").addEventListener("click", async () => {
  const btn = document.getElementById("cur-calc");
  const value = document.getElementById("cur-value").value;
  const from_currency = document.getElementById("cur-from").value;
  const to_currency = document.getElementById("cur-to").value;

  if (value === "") { showResult("cur-result-display", "Masukkan jumlah!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/convert/currency", { value, from_currency, to_currency });
    setLoading(btn, false);
    if (data.error) {
      showResult("cur-result-display", data.error, true);
    } else {
      showResult("cur-result-display", data.result.toLocaleString("id-ID", { maximumFractionDigits: 6 }));
      showFormula("cur-formula", data.formula);
      showSteps("cur-steps", data.steps);
      addHistory("Konversi Mata Uang", data.formula);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("cur-result-display", "Terjadi kesalahan.", true);
  }
});

/* ══════════════════════════════════════════════════════════════
   FACTORIAL
══════════════════════════════════════════════════════════════ */
document.getElementById("fact-calc").addEventListener("click", async () => {
  const btn = document.getElementById("fact-calc");
  const n = document.getElementById("fact-n").value;

  if (n === "") { showResult("fact-result-display", "Masukkan nilai n!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/factorial", { n });
    setLoading(btn, false);
    if (data.error) {
      showResult("fact-result-display", data.error, true);
    } else {
      // Large numbers displayed with notation
      const res = BigInt(data.result).toLocaleString("id-ID");
      showResult("fact-result-display", data.result > 1e15 ? `${n}! = (besar)` : res);
      showFormula("fact-formula", data.formula);
      showSteps("fact-steps", data.steps);
      addHistory("Faktorial", `${n}! = ${data.result}`);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("fact-result-display", "Terjadi kesalahan.", true);
  }
});

document.getElementById("fact-n").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("fact-calc").click();
});

/* ══════════════════════════════════════════════════════════════
   FIBONACCI
══════════════════════════════════════════════════════════════ */
document.getElementById("fib-calc").addEventListener("click", async () => {
  const btn = document.getElementById("fib-calc");
  const n = document.getElementById("fib-n").value;

  if (n === "") { showResult("fib-result-display", "Masukkan nilai n!", true); return; }

  setLoading(btn, true);
  try {
    const data = await apiPost("/api/fibonacci", { n });
    setLoading(btn, false);
    if (data.error) {
      showResult("fib-result-display", data.error, true);
    } else {
      showResult("fib-result-display", `F(${parseInt(n)-1}) = ${data.result}`);
      showFormula("fib-formula", data.formula);
      showSteps("fib-steps", data.steps);

      // Render badges
      const seqEl = document.getElementById("fib-sequence");
      seqEl.innerHTML = data.sequence
        .map((v, i) => `<span class="fib-badge" style="animation-delay:${i*18}ms">${v}</span>`)
        .join("");

      addHistory("Fibonacci", `${n} suku pertama, F(${parseInt(n)-1})=${data.result}`);
    }
  } catch (e) {
    setLoading(btn, false);
    showResult("fib-result-display", "Terjadi kesalahan.", true);
  }
});

document.getElementById("fib-n").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("fib-calc").click();
});
