/**
 * CalcMaster Pro — script.js
 * Features: Standard, Arithmetic, Bitwise, Conversion, Factorial, Fibonacci
 * Themes: Light, Dark, Black Cat
 */

"use strict";

/* ════════════════════════════════════════════
   THEME MANAGEMENT
   ════════════════════════════════════════════ */
const THEMES = ["light", "dark", "black-cat"];
let currentThemeIdx = 0;
let catMode = false;

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const catToggle = document.getElementById("catToggle");
const ICONS = { light: "☀", dark: "🌙", "black-cat": "✦" };

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = ICONS[theme] || "☀";
  localStorage.setItem("calcmaster-theme", theme);
}

themeToggle.addEventListener("click", () => {
  if (catMode) return;
  currentThemeIdx = (currentThemeIdx + 1) % 2; // cycle light/dark only
  applyTheme(THEMES[currentThemeIdx]);
});

catToggle.addEventListener("click", () => {
  catMode = !catMode;
  if (catMode) {
    applyTheme("black-cat");
    catToggle.style.background = "var(--accent)";
  } else {
    applyTheme(THEMES[currentThemeIdx]);
    catToggle.style.background = "";
  }
});

// Restore saved theme
(function () {
  const saved = localStorage.getItem("calcmaster-theme");
  if (saved === "black-cat") { catMode = true; catToggle.style.background = "var(--accent)"; }
  if (saved === "dark") { currentThemeIdx = 1; }
  applyTheme(saved || "light");
})();

/* ════════════════════════════════════════════
   MODE NAVIGATION
   ════════════════════════════════════════════ */
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".calc-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.mode).classList.add("active");
  });
});

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */
function formatNum(n) {
  if (!isFinite(n)) return String(n);
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString("id-ID");
  return parseFloat(n.toPrecision(12)).toString();
}

function setResult(elId, text, isError = false) {
  const el = document.getElementById(elId);
  el.textContent = text;
  el.style.color = isError ? "#ff4d6d" : "";
}

function setSteps(elId, lines) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  if (!lines || lines.length === 0) return;
  lines.forEach(l => {
    const div = document.createElement("div");
    div.className = "step-line";
    div.textContent = l;
    el.appendChild(div);
  });
}

/* ════════════════════════════════════════════
   STANDARD CALCULATOR
   ════════════════════════════════════════════ */
const StdCalc = (() => {
  let display = "0";
  let expression = "";
  let operator = null;
  let prevValue = null;
  let shouldReset = false;

  const dMain = document.getElementById("std-display");
  const dExpr = document.getElementById("std-expr");

  function updateDisplay() {
    const d = display.length > 10
      ? parseFloat(display).toExponential(4)
      : display;
    dMain.textContent = d || "0";
    if (dMain.textContent.length > 9) dMain.style.fontSize = "1.8rem";
    else if (dMain.textContent.length > 7) dMain.style.fontSize = "2.2rem";
    else dMain.style.fontSize = "";
    dExpr.textContent = expression || "\u00a0";
  }

  function inputDigit(n) {
    if (shouldReset) { display = String(n); shouldReset = false; }
    else display = display === "0" ? String(n) : display + n;
    updateDisplay();
  }

  function inputDot() {
    if (shouldReset) { display = "0."; shouldReset = false; }
    else if (!display.includes(".")) display += ".";
    updateDisplay();
  }

  function clear() {
    display = "0"; expression = ""; operator = null; prevValue = null; shouldReset = false;
    updateDisplay();
  }

  function negate() {
    display = String(parseFloat(display) * -1);
    updateDisplay();
  }

  function percent() {
    display = String(parseFloat(display) / 100);
    updateDisplay();
  }

  function opMap(op) { return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] || op; }

  function setOp(op) {
    if (operator && !shouldReset) {
      equals(true);
    }
    prevValue = parseFloat(display);
    operator = op;
    expression = `${prevValue} ${opMap(op)}`;
    shouldReset = true;
    updateDisplay();
  }

  function equals(chain = false) {
    if (operator === null || prevValue === null) return;
    const cur = parseFloat(display);
    let res;
    switch (operator) {
      case "+": res = prevValue + cur; break;
      case "-": res = prevValue - cur; break;
      case "*": res = prevValue * cur; break;
      case "/":
        if (cur === 0) { display = "Error"; expression = "Pembagian oleh nol"; operator = null; prevValue = null; updateDisplay(); return; }
        res = prevValue / cur;
        break;
      default: return;
    }
    if (!chain) {
      expression = `${prevValue} ${opMap(operator)} ${cur} =`;
    }
    display = String(parseFloat(res.toPrecision(12)));
    operator = null;
    prevValue = null;
    shouldReset = true;
    updateDisplay();
  }

  // Button events
  document.querySelectorAll("#panel-standard .key").forEach(key => {
    key.addEventListener("click", () => {
      const { num, action, op } = key.dataset;
      if (num !== undefined) inputDigit(num);
      else if (op) setOp(op);
      else if (action === "clear") clear();
      else if (action === "negate") negate();
      else if (action === "percent") percent();
      else if (action === "dot") inputDot();
      else if (action === "equals") equals();
    });
  });

  // Keyboard support
  document.addEventListener("keydown", e => {
    const mode = document.querySelector(".mode-btn.active")?.dataset.mode;
    if (mode !== "standard") return;
    if ("0123456789".includes(e.key)) inputDigit(e.key);
    else if (e.key === ".") inputDot();
    else if (e.key === "+") setOp("+");
    else if (e.key === "-") setOp("-");
    else if (e.key === "*") setOp("*");
    else if (e.key === "/") { e.preventDefault(); setOp("/"); }
    else if (e.key === "Enter" || e.key === "=") equals();
    else if (e.key === "Escape" || e.key === "c" || e.key === "C") clear();
    else if (e.key === "Backspace") {
      if (display.length > 1) display = display.slice(0, -1);
      else display = "0";
      updateDisplay();
    }
  });
})();

/* ════════════════════════════════════════════
   ARITHMETIC CALCULATOR
   ════════════════════════════════════════════ */
(() => {
  let selectedOp = "add";

  const opButtons = document.querySelectorAll(".arith-op-btn");
  const bGroup = document.getElementById("arith-b-group");
  const aInput = document.getElementById("arith-a");
  const bInput = document.getElementById("arith-b");

  const singleOps = ["sqrt", "abs"];

  opButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      opButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedOp = btn.dataset.op;
      bGroup.style.display = singleOps.includes(selectedOp) ? "none" : "flex";
    });
  });
  opButtons[0].classList.add("selected");

  document.getElementById("arith-calc").addEventListener("click", () => {
    const a = parseFloat(aInput.value);
    const b = parseFloat(bInput.value);
    const steps = [];

    if (isNaN(a)) { setResult("arith-result", "⚠ Masukkan nilai A yang valid!", true); return; }
    if (!singleOps.includes(selectedOp) && isNaN(b)) { setResult("arith-result", "⚠ Masukkan nilai B yang valid!", true); return; }

    let result, label;
    switch (selectedOp) {
      case "add":
        result = a + b; label = `${a} + ${b}`;
        steps.push(`Langkah: ${a} + ${b} = ${result}`);
        break;
      case "sub":
        result = a - b; label = `${a} − ${b}`;
        steps.push(`Langkah: ${a} − ${b} = ${result}`);
        break;
      case "mul":
        result = a * b; label = `${a} × ${b}`;
        steps.push(`Langkah: ${a} × ${b} = ${result}`);
        break;
      case "div":
        if (b === 0) { setResult("arith-result", "⚠ Pembagian oleh nol tidak diperbolehkan!", true); return; }
        result = a / b; label = `${a} ÷ ${b}`;
        steps.push(`Langkah: ${a} ÷ ${b} = ${formatNum(result)}`);
        if (Number.isInteger(a) && Number.isInteger(b)) {
          steps.push(`Pembulatan: ${Math.floor(a / b)} sisa ${a % b}`);
        }
        break;
      case "mod":
        if (b === 0) { setResult("arith-result", "⚠ Modulo oleh nol tidak diperbolehkan!", true); return; }
        result = a % b; label = `${a} mod ${b}`;
        steps.push(`Langkah: ${a} mod ${b} = ${result}`);
        steps.push(`Karena ${Math.floor(a / b)} × ${b} = ${Math.floor(a / b) * b}, sisa = ${result}`);
        break;
      case "pow":
        result = Math.pow(a, b); label = `${a} ^ ${b}`;
        steps.push(`Langkah: ${a}^${b} = ${formatNum(result)}`);
        if (Number.isInteger(b) && b > 0 && b <= 5) {
          steps.push(`Detail: ${Array(b).fill(a).join(" × ")} = ${result}`);
        }
        break;
      case "sqrt":
        if (a < 0) { setResult("arith-result", "⚠ Akar kuadrat dari bilangan negatif tidak valid!", true); return; }
        result = Math.sqrt(a); label = `√${a}`;
        steps.push(`√${a} = ${formatNum(result)}`);
        steps.push(`Verifikasi: ${formatNum(result)} × ${formatNum(result)} ≈ ${formatNum(result * result)}`);
        break;
      case "abs":
        result = Math.abs(a); label = `|${a}|`;
        steps.push(`|${a}| = ${result}`);
        steps.push(a >= 0 ? "Nilai sudah positif" : `Hapus tanda negatif dari ${a}`);
        break;
    }

    document.getElementById("arith-display").textContent = formatNum(result);
    document.getElementById("arith-expr").textContent = label + " =";
    setResult("arith-result", `${label} = ${formatNum(result)}`);
    setSteps("arith-steps", steps);
  });
})();

/* ════════════════════════════════════════════
   BITWISE CALCULATOR
   ════════════════════════════════════════════ */
(() => {
  let selectedBop = "and";
  const bitBtns = document.querySelectorAll(".bit-btn");
  const aInput = document.getElementById("bit-a");
  const bInput = document.getElementById("bit-b");
  const bWrap = document.getElementById("bit-b-wrap");
  const shiftWrap = document.getElementById("shift-amount-wrap");
  const singleBops = ["not"];
  const shiftBops = ["lshift", "rshift"];

  bitBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      bitBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedBop = btn.dataset.bop;
      bWrap.style.display = singleBops.includes(selectedBop) ? "none" : "flex";
      shiftWrap.style.display = shiftBops.includes(selectedBop) ? "flex" : "none";
    });
  });
  bitBtns[0].classList.add("selected");

  function updateBinPreview(inputId, previewId) {
    const v = parseInt(document.getElementById(inputId).value);
    document.getElementById(previewId).textContent = isNaN(v) ? "—" : `${v} = 0b${(v >>> 0).toString(2)}`;
  }

  aInput.addEventListener("input", () => updateBinPreview("bit-a", "bit-a-bin"));
  bInput.addEventListener("input", () => updateBinPreview("bit-b", "bit-b-bin"));

  document.getElementById("bit-calc").addEventListener("click", () => {
    const a = parseInt(aInput.value);
    const b = parseInt(bInput.value);
    const n = parseInt(document.getElementById("shift-n").value) || 1;

    if (isNaN(a)) { setResult("bit-result", "⚠ Masukkan nilai A yang valid!", true); return; }
    if (!singleBops.includes(selectedBop) && isNaN(b)) { setResult("bit-result", "⚠ Masukkan nilai B yang valid!", true); return; }

    const binA = (a >>> 0).toString(2).padStart(8, "0");
    const binB = isNaN(b) ? "" : (b >>> 0).toString(2).padStart(8, "0");
    const steps = [];
    steps.push(`A = ${a}  →  0b${binA}`);
    if (!singleBops.includes(selectedBop)) steps.push(`B = ${b}  →  0b${binB}`);

    let result, label;
    switch (selectedBop) {
      case "and": result = a & b; label = `${a} AND ${b}`;
        steps.push(`Operasi AND bit per bit:`);
        steps.push(`  ${binA}`);
        steps.push(`& ${binB}`);
        steps.push(`= ${(result >>> 0).toString(2).padStart(8, "0")}`);
        break;
      case "or": result = a | b; label = `${a} OR ${b}`;
        steps.push(`Operasi OR bit per bit:`);
        steps.push(`  ${binA}`);
        steps.push(`| ${binB}`);
        steps.push(`= ${(result >>> 0).toString(2).padStart(8, "0")}`);
        break;
      case "xor": result = a ^ b; label = `${a} XOR ${b}`;
        steps.push(`Operasi XOR bit per bit:`);
        steps.push(`  ${binA}`);
        steps.push(`^ ${binB}`);
        steps.push(`= ${(result >>> 0).toString(2).padStart(8, "0")}`);
        break;
      case "not": result = ~a; label = `NOT ${a}`;
        steps.push(`NOT A: flip semua bit`);
        steps.push(`  ${binA}  →  ${(result >>> 0).toString(2).padStart(8, "0")}`);
        break;
      case "lshift": result = a << n; label = `${a} << ${n}`;
        steps.push(`Geser ${binA} ke kiri ${n} posisi`);
        steps.push(`Hasil: ${(result >>> 0).toString(2).padStart(8, "0")}`);
        steps.push(`Sama dengan: ${a} × 2^${n} = ${a} × ${Math.pow(2, n)} = ${result}`);
        break;
      case "rshift": result = a >> n; label = `${a} >> ${n}`;
        steps.push(`Geser ${binA} ke kanan ${n} posisi`);
        steps.push(`Hasil: ${(result >>> 0).toString(2).padStart(8, "0")}`);
        steps.push(`Sama dengan: floor(${a} / 2^${n}) = floor(${a / Math.pow(2, n)}) = ${result}`);
        break;
    }

    steps.push(`Hasil desimal: ${result}`);
    steps.push(`Hasil hex: 0x${(result >>> 0).toString(16).toUpperCase()}`);
    setResult("bit-result", `${label} = ${result}  (0b${(result >>> 0).toString(2)}, 0x${(result >>> 0).toString(16).toUpperCase()})`);
    setSteps("bit-steps", steps);
  });
})();

/* ════════════════════════════════════════════
   CONVERSION CALCULATOR
   ════════════════════════════════════════════ */
(() => {
  // Tabs
  document.querySelectorAll(".conv-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".conv-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".conv-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("conv-" + tab.dataset.conv).classList.add("active");
    });
  });

  // Number system
  document.getElementById("conv-num-btn").addEventListener("click", () => {
    const val = document.getElementById("conv-num-val").value.trim();
    const from = parseInt(document.getElementById("conv-num-from").value);
    const to = parseInt(document.getElementById("conv-num-to").value);
    if (!val) { setResult("conv-num-result", "⚠ Masukkan nilai!", true); return; }
    const dec = parseInt(val, from);
    if (isNaN(dec)) { setResult("conv-num-result", "⚠ Nilai tidak valid untuk basis tersebut!", true); return; }
    const result = dec.toString(to).toUpperCase();
    const baseNames = { 2: "Biner", 8: "Oktal", 10: "Desimal", 16: "Heksadesimal" };
    const steps = [
      `Input: ${val} (basis ${from} / ${baseNames[from]})`,
      `Konversi ke desimal: ${dec}`,
      `Konversi desimal ke basis ${to}: ${result}`,
    ];
    if (from !== 10) steps.push(`Verifikasi: ${val}(${from}) = ${dec}(10) = ${result}(${to})`);
    setResult("conv-num-result", `${val} (basis ${from}) = ${result} (basis ${to})`);
    setSteps("conv-num-steps", steps);
  });

  // Temperature
  const tempToC = { C: v => v, F: v => (v - 32) * 5 / 9, K: v => v - 273.15, R: v => (v - 491.67) * 5 / 9 };
  const tempFromC = { C: v => v, F: v => v * 9 / 5 + 32, K: v => v + 273.15, R: v => (v + 273.15) * 9 / 5 };
  const tempNames = { C: "Celsius", F: "Fahrenheit", K: "Kelvin", R: "Rankine" };
  const tempSymbols = { C: "°C", F: "°F", K: "K", R: "°R" };

  document.getElementById("conv-temp-btn").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("conv-temp-val").value);
    const from = document.getElementById("conv-temp-from").value;
    const to = document.getElementById("conv-temp-to").value;
    if (isNaN(val)) { setResult("conv-temp-result", "⚠ Masukkan nilai suhu yang valid!", true); return; }
    const celsius = tempToC[from](val);
    const result = tempFromC[to](celsius);
    const steps = [
      `Input: ${val}${tempSymbols[from]} (${tempNames[from]})`,
      `Konversi ke Celsius: ${formatNum(celsius)}°C`,
      `Konversi ke ${tempNames[to]}: ${formatNum(result)}${tempSymbols[to]}`,
    ];
    setResult("conv-temp-result", `${val}${tempSymbols[from]} = ${formatNum(result)}${tempSymbols[to]}`);
    setSteps("conv-temp-steps", steps);
  });

  // Length
  const lenToM = { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 };
  const lenNames = { mm: "Milimeter", cm: "Sentimeter", m: "Meter", km: "Kilometer", in: "Inci", ft: "Kaki", yd: "Yard", mi: "Mil" };

  document.getElementById("conv-len-btn").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("conv-len-val").value);
    const from = document.getElementById("conv-len-from").value;
    const to = document.getElementById("conv-len-to").value;
    if (isNaN(val)) { setResult("conv-len-result", "⚠ Masukkan nilai panjang yang valid!", true); return; }
    const meters = val * lenToM[from];
    const result = meters / lenToM[to];
    const steps = [
      `Input: ${val} ${from} (${lenNames[from]})`,
      `Konversi ke meter: ${formatNum(meters)} m`,
      `Konversi ke ${lenNames[to]}: ${formatNum(result)} ${to}`,
    ];
    setResult("conv-len-result", `${val} ${from} = ${formatNum(result)} ${to}`);
    setSteps("conv-len-steps", steps);
  });

  // Weight
  const wtToKg = { mg: 1e-6, g: 0.001, kg: 1, ton: 1000, oz: 0.0283495, lb: 0.453592 };
  const wtNames = { mg: "Miligram", g: "Gram", kg: "Kilogram", ton: "Ton", oz: "Ons", lb: "Pon" };

  document.getElementById("conv-wt-btn").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("conv-wt-val").value);
    const from = document.getElementById("conv-wt-from").value;
    const to = document.getElementById("conv-wt-to").value;
    if (isNaN(val)) { setResult("conv-wt-result", "⚠ Masukkan nilai berat yang valid!", true); return; }
    const kg = val * wtToKg[from];
    const result = kg / wtToKg[to];
    const steps = [
      `Input: ${val} ${from} (${wtNames[from]})`,
      `Konversi ke kilogram: ${formatNum(kg)} kg`,
      `Konversi ke ${wtNames[to]}: ${formatNum(result)} ${to}`,
    ];
    setResult("conv-wt-result", `${val} ${from} = ${formatNum(result)} ${to}`);
    setSteps("conv-wt-steps", steps);
  });
})();

/* ════════════════════════════════════════════
   FACTORIAL CALCULATOR
   ════════════════════════════════════════════ */
(() => {
  function factorial(n) {
    if (n === 0 || n === 1) return 1n;
    let r = 1n;
    for (let i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
  }

  // Build table
  const table = document.getElementById("fact-table");
  for (let i = 0; i <= 15; i++) {
    const row = document.createElement("div");
    row.className = "fact-row";
    const h = document.createElement("div");
    h.className = "fact-cell fact-cell-head";
    h.textContent = `${i}!`;
    const v = document.createElement("div");
    v.className = "fact-cell fact-cell-val";
    v.textContent = factorial(i).toString();
    row.appendChild(h);
    row.appendChild(v);
    table.appendChild(row);
  }

  document.getElementById("fact-calc").addEventListener("click", () => {
    const n = parseInt(document.getElementById("fact-n").value);
    if (isNaN(n) || n < 0) { setResult("fact-result", "⚠ Masukkan bilangan bulat ≥ 0!", true); return; }
    if (n > 170) { setResult("fact-result", "⚠ Nilai terlalu besar (maks 170)!", true); return; }

    const result = factorial(n);
    const steps = [`${n}! = `];

    if (n <= 10) {
      const parts = [];
      for (let i = n; i >= 1; i--) parts.push(i);
      steps.push(parts.join(" × ") + (n === 0 ? "1" : ""));
      steps.push(`= ${result.toString()}`);
    } else {
      steps.push(`${n} × ${n - 1} × ${n - 2} × ... × 2 × 1`);
      steps.push(`= ${result.toString()}`);
      steps.push(`Jumlah digit: ${result.toString().length}`);
    }

    setResult("fact-result", `${n}! = ${result.toLocaleString()}`);
    setSteps("fact-steps", steps);
  });
})();

/* ════════════════════════════════════════════
   FIBONACCI CALCULATOR
   ════════════════════════════════════════════ */
(() => {
  function fibN(n) {
    if (n <= 0) return 0n;
    if (n === 1) return 1n;
    let a = 0n, b = 1n;
    for (let i = 2; i <= n; i++) { let t = a + b; a = b; b = t; }
    return b;
  }

  function fibSeq(n) {
    const seq = [0n, 1n];
    for (let i = 2; i <= n; i++) seq.push(seq[i - 1] + seq[i - 2]);
    return seq.slice(0, n + 1);
  }

  document.getElementById("fib-single").addEventListener("click", () => {
    const n = parseInt(document.getElementById("fib-n").value);
    if (isNaN(n) || n < 0) { setResult("fib-result", "⚠ Masukkan bilangan bulat ≥ 0!", true); return; }
    if (n > 1000) { setResult("fib-result", "⚠ Nilai terlalu besar (maks 1000)!", true); return; }

    const result = fibN(n);
    const steps = [];
    if (n <= 2) {
      steps.push(`Definisi dasar: F(${n}) = ${result}`);
    } else {
      const fn1 = fibN(n - 1);
      const fn2 = fibN(n - 2);
      steps.push(`F(${n}) = F(${n - 1}) + F(${n - 2})`);
      steps.push(`F(${n}) = ${fn1} + ${fn2}`);
      steps.push(`F(${n}) = ${result}`);
    }

    setResult("fib-result", `F(${n}) = ${result.toString()}`);
    setSteps("fib-steps", steps);

    // Visual: show small sequence
    const visual = document.getElementById("fib-visual");
    visual.innerHTML = "";
    const upTo = Math.min(n, 20);
    const seq = fibSeq(upTo);
    seq.forEach((val, i) => {
      const chip = document.createElement("span");
      chip.className = "fib-chip" + (i === n ? " highlight" : "");
      chip.textContent = `F(${i})=${val}`;
      visual.appendChild(chip);
    });
    if (n > 20) {
      const chip = document.createElement("span");
      chip.className = "fib-chip highlight";
      chip.textContent = `... F(${n})=${result}`;
      visual.appendChild(chip);
    }
  });

  document.getElementById("fib-sequence").addEventListener("click", () => {
    const n = parseInt(document.getElementById("fib-seq").value);
    if (isNaN(n) || n < 1) { setResult("fib-result", "⚠ Masukkan angka ≥ 1!", true); return; }
    if (n > 100) { setResult("fib-result", "⚠ Maks 100 suku!", true); return; }

    const seq = fibSeq(n);
    const steps = seq.map((v, i) => `F(${i}) = ${v.toString()}`);
    setResult("fib-result", `Barisan Fibonacci 0 sampai ${n}: ${seq.map(v => v.toString()).join(", ")}`);
    setSteps("fib-steps", steps);

    const visual = document.getElementById("fib-visual");
    visual.innerHTML = "";
    seq.forEach((val, i) => {
      const chip = document.createElement("span");
      chip.className = "fib-chip";
      chip.textContent = `F(${i})=${val}`;
      visual.appendChild(chip);
    });
  });
})();
