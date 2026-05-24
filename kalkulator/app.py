from flask import Flask, request, jsonify, send_from_directory

try:
    from flask_cors import CORS
except ImportError:
    CORS = lambda app: None

import math
import os

app = Flask(__name__, static_folder=".")
CORS(app)

# ══════════════════════════════════════════
# SERVE FRONTEND
# ══════════════════════════════════════════

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


# ══════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════

def format_result(value):
    """Format angka untuk respons API."""
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if value == int(value) and abs(value) < 1e15:
            return str(int(value))
        return f"{value:.10g}"
    return str(value)


def error(msg, status=400):
    return jsonify({"success": False, "error": msg}), status


# ══════════════════════════════════════════
# STANDARD CALCULATOR
# ══════════════════════════════════════════

@app.route("/api/standard", methods=["POST"])
def standard_calc():
    """
    Endpoint kalkulator standar.
    Body: { "expression": "12 + 34" }
    atau { "a": 12, "operator": "+", "b": 34 }
    """
    data = request.get_json(force=True)

    if "expression" in data:
        expr = data["expression"].strip()
        # Sanitasi: hanya izinkan angka dan operator dasar
        allowed = set("0123456789.+-*/ ()")
        if not all(c in allowed for c in expr):
            return error("Ekspresi mengandung karakter yang tidak diizinkan")
        try:
            result = eval(expr, {"__builtins__": {}}, {})
            return jsonify({
                "success": True,
                "result": format_result(result),
                "expression": expr
            })
        except ZeroDivisionError:
            return error("Pembagian oleh nol tidak diperbolehkan")
        except Exception as e:
            return error(f"Ekspresi tidak valid: {str(e)}")

    a = data.get("a")
    op = data.get("operator")
    b = data.get("b")

    if a is None or op is None:
        return error("Parameter 'a' dan 'operator' diperlukan")

    try:
        a = float(a)
        b = float(b) if b is not None else None
    except (TypeError, ValueError):
        return error("Nilai angka tidak valid")

    if op == "+" and b is not None:
        result = a + b
    elif op == "-" and b is not None:
        result = a - b
    elif op == "*" and b is not None:
        result = a * b
    elif op == "/" and b is not None:
        if b == 0:
            return error("Pembagian oleh nol tidak diperbolehkan")
        result = a / b
    elif op == "%" and b is not None:
        if b == 0:
            return error("Modulo oleh nol tidak diperbolehkan")
        result = a % b
    elif op == "sqrt":
        if a < 0:
            return error("Akar kuadrat dari bilangan negatif tidak valid")
        result = math.sqrt(a)
    elif op == "pow" and b is not None:
        result = math.pow(a, b)
    elif op == "abs":
        result = abs(a)
    elif op == "negate":
        result = -a
    else:
        return error(f"Operator '{op}' tidak dikenali")

    return jsonify({
        "success": True,
        "result": format_result(result),
        "a": a,
        "operator": op,
        "b": b
    })


# ══════════════════════════════════════════
# ARITHMETIC CALCULATOR
# ══════════════════════════════════════════

@app.route("/api/arithmetic", methods=["POST"])
def arithmetic_calc():
    """
    Endpoint kalkulator aritmatika dengan langkah-langkah.
    Body: { "operation": "add", "a": 10, "b": 5 }
    Operasi: add, sub, mul, div, mod, pow, sqrt, abs
    """
    data = request.get_json(force=True)
    operation = data.get("operation")
    steps = []

    try:
        a = float(data.get("a", 0))
    except (TypeError, ValueError):
        return error("Nilai 'a' tidak valid")

    single_ops = {"sqrt", "abs", "negate"}
    if operation not in single_ops:
        try:
            b = float(data.get("b", 0))
        except (TypeError, ValueError):
            return error("Nilai 'b' tidak valid")
    else:
        b = None

    if operation == "add":
        result = a + b
        steps = [
            f"Penjumlahan: {a} + {b}",
            f"Hasil: {format_result(result)}"
        ]
        label = f"{a} + {b}"
    elif operation == "sub":
        result = a - b
        steps = [
            f"Pengurangan: {a} - {b}",
            f"Hasil: {format_result(result)}"
        ]
        label = f"{a} - {b}"
    elif operation == "mul":
        result = a * b
        steps = [
            f"Perkalian: {a} × {b}",
            f"Hasil: {format_result(result)}"
        ]
        label = f"{a} × {b}"
    elif operation == "div":
        if b == 0:
            return error("Pembagian oleh nol tidak diperbolehkan")
        result = a / b
        steps = [
            f"Pembagian: {a} ÷ {b}",
            f"Hasil: {format_result(result)}",
            f"Pembulatan ke bawah: {int(a // b)}, sisa: {int(a % b)}"
        ]
        label = f"{a} ÷ {b}"
    elif operation == "mod":
        if b == 0:
            return error("Modulo oleh nol tidak diperbolehkan")
        result = a % b
        steps = [
            f"Modulo: {a} mod {b}",
            f"{int(a // b)} × {b} = {int(a // b) * b}",
            f"Sisa: {a} - {int(a // b) * b} = {format_result(result)}"
        ]
        label = f"{a} mod {b}"
    elif operation == "pow":
        result = math.pow(a, b)
        steps = [
            f"Pangkat: {a}^{b}",
            f"Hasil: {format_result(result)}"
        ]
        label = f"{a}^{b}"
    elif operation == "sqrt":
        if a < 0:
            return error("Akar kuadrat dari bilangan negatif tidak valid")
        result = math.sqrt(a)
        steps = [
            f"Akar kuadrat: √{a}",
            f"Hasil: {format_result(result)}",
            f"Verifikasi: {format_result(result)} × {format_result(result)} ≈ {format_result(result * result)}"
        ]
        label = f"√{a}"
    elif operation == "abs":
        result = abs(a)
        steps = [
            f"Nilai mutlak: |{a}|",
            f"Hasil: {format_result(result)}"
        ]
        label = f"|{a}|"
    else:
        return error(f"Operasi '{operation}' tidak dikenali")

    return jsonify({
        "success": True,
        "result": format_result(result),
        "label": label,
        "steps": steps
    })


# ══════════════════════════════════════════
# BITWISE CALCULATOR
# ══════════════════════════════════════════

@app.route("/api/bitwise", methods=["POST"])
def bitwise_calc():
    """
    Endpoint kalkulator bitwise.
    Body: { "operation": "and", "a": 12, "b": 10 }
    Operasi: and, or, xor, not, lshift, rshift
    """
    data = request.get_json(force=True)
    operation = data.get("operation")

    try:
        a = int(data.get("a", 0))
    except (TypeError, ValueError):
        return error("Nilai 'a' harus bilangan bulat")

    shift_ops = {"lshift", "rshift"}
    single_ops = {"not"}

    if operation not in single_ops:
        try:
            b = int(data.get("b", 0))
        except (TypeError, ValueError):
            return error("Nilai 'b' harus bilangan bulat")
    else:
        b = None

    n = int(data.get("n", 1))  # jumlah shift

    bin_a = format(a & 0xFFFFFFFF, "08b")
    bin_b = format(b & 0xFFFFFFFF, "08b") if b is not None else ""

    steps = [f"A = {a}  →  0b{bin_a}  (0x{a & 0xFFFFFFFF:X})"]
    if b is not None:
        steps.append(f"B = {b}  →  0b{bin_b}  (0x{b & 0xFFFFFFFF:X})")

    if operation == "and":
        result = a & b
        steps += [
            f"Operasi AND:",
            f"  {bin_a}",
            f"& {bin_b}",
            f"= {format(result & 0xFFFFFFFF, '08b')}",
            f"Aturan: bit=1 hanya jika kedua bit=1"
        ]
        label = f"{a} AND {b}"
    elif operation == "or":
        result = a | b
        steps += [
            f"Operasi OR:",
            f"  {bin_a}",
            f"| {bin_b}",
            f"= {format(result & 0xFFFFFFFF, '08b')}",
            f"Aturan: bit=1 jika salah satu bit=1"
        ]
        label = f"{a} OR {b}"
    elif operation == "xor":
        result = a ^ b
        steps += [
            f"Operasi XOR:",
            f"  {bin_a}",
            f"^ {bin_b}",
            f"= {format(result & 0xFFFFFFFF, '08b')}",
            f"Aturan: bit=1 jika bit berbeda"
        ]
        label = f"{a} XOR {b}"
    elif operation == "not":
        result = ~a
        steps += [
            f"Operasi NOT (flip semua bit):",
            f"  {bin_a}",
            f"= {format(result & 0xFFFFFFFF, '08b')}",
            f"NOT menggunakan komplemen dua"
        ]
        label = f"NOT {a}"
    elif operation == "lshift":
        result = a << n
        steps += [
            f"Left Shift {n} posisi:",
            f"  {bin_a} << {n}",
            f"= {format(result & 0xFFFFFFFF, '08b')}",
            f"Sama dengan: {a} × 2^{n} = {a} × {2**n} = {result}"
        ]
        label = f"{a} << {n}"
    elif operation == "rshift":
        result = a >> n
        steps += [
            f"Right Shift {n} posisi:",
            f"  {bin_a} >> {n}",
            f"= {format(result & 0xFFFFFFFF, '08b')}",
            f"Sama dengan: floor({a} / 2^{n}) = {result}"
        ]
        label = f"{a} >> {n}"
    else:
        return error(f"Operasi '{operation}' tidak dikenali")

    steps.append(f"Hasil desimal: {result}")
    steps.append(f"Hasil heksadesimal: 0x{result & 0xFFFFFFFF:X}")

    return jsonify({
        "success": True,
        "result": result,
        "result_bin": bin(result),
        "result_hex": hex(result),
        "label": label,
        "steps": steps
    })


# ══════════════════════════════════════════
# CONVERSION CALCULATOR
# ══════════════════════════════════════════

@app.route("/api/convert/number", methods=["POST"])
def convert_number():
    """Konversi sistem bilangan."""
    data = request.get_json(force=True)
    val = data.get("value", "").strip()
    from_base = int(data.get("from_base", 10))
    to_base = int(data.get("to_base", 2))

    if not val:
        return error("Nilai tidak boleh kosong")

    try:
        dec = int(val, from_base)
    except ValueError:
        return error(f"Nilai '{val}' tidak valid untuk basis {from_base}")

    if to_base == 2:
        result = bin(dec)[2:]
    elif to_base == 8:
        result = oct(dec)[2:]
    elif to_base == 10:
        result = str(dec)
    elif to_base == 16:
        result = hex(dec)[2:].upper()
    else:
        result = ""
        n = dec
        while n:
            result = str(n % to_base) + result
            n //= to_base

    base_names = {2: "Biner", 8: "Oktal", 10: "Desimal", 16: "Heksadesimal"}

    return jsonify({
        "success": True,
        "input": val,
        "from_base": from_base,
        "to_base": to_base,
        "result": result.upper(),
        "decimal": dec,
        "steps": [
            f"Input: {val} (basis {from_base} / {base_names.get(from_base, str(from_base))})",
            f"Konversi ke desimal: {dec}",
            f"Konversi ke basis {to_base}: {result.upper()}",
        ]
    })


@app.route("/api/convert/temperature", methods=["POST"])
def convert_temperature():
    """Konversi suhu."""
    data = request.get_json(force=True)
    try:
        val = float(data.get("value"))
    except (TypeError, ValueError):
        return error("Nilai suhu tidak valid")

    from_unit = data.get("from_unit", "C")
    to_unit = data.get("to_unit", "F")

    # Ke Celsius dulu
    to_celsius = {"C": lambda v: v, "F": lambda v: (v - 32) * 5 / 9,
                  "K": lambda v: v - 273.15, "R": lambda v: (v - 491.67) * 5 / 9}
    from_celsius = {"C": lambda v: v, "F": lambda v: v * 9 / 5 + 32,
                    "K": lambda v: v + 273.15, "R": lambda v: (v + 273.15) * 9 / 5}
    symbols = {"C": "°C", "F": "°F", "K": "K", "R": "°R"}

    if from_unit not in to_celsius:
        return error(f"Unit '{from_unit}' tidak dikenali")
    if to_unit not in from_celsius:
        return error(f"Unit '{to_unit}' tidak dikenali")

    celsius = to_celsius[from_unit](val)
    result = from_celsius[to_unit](celsius)

    return jsonify({
        "success": True,
        "input": val,
        "from_unit": from_unit,
        "to_unit": to_unit,
        "result": round(result, 8),
        "result_formatted": f"{result:.4f}",
        "steps": [
            f"Input: {val}{symbols[from_unit]}",
            f"Konversi ke Celsius: {celsius:.4f}°C",
            f"Konversi ke {to_unit}: {result:.4f}{symbols[to_unit]}"
        ]
    })


@app.route("/api/convert/length", methods=["POST"])
def convert_length():
    """Konversi panjang."""
    data = request.get_json(force=True)
    try:
        val = float(data.get("value"))
    except (TypeError, ValueError):
        return error("Nilai panjang tidak valid")

    from_unit = data.get("from_unit", "m")
    to_unit = data.get("to_unit", "km")

    to_m = {"mm": 0.001, "cm": 0.01, "m": 1, "km": 1000,
            "in": 0.0254, "ft": 0.3048, "yd": 0.9144, "mi": 1609.344}

    if from_unit not in to_m or to_unit not in to_m:
        return error("Unit panjang tidak dikenali")

    meters = val * to_m[from_unit]
    result = meters / to_m[to_unit]

    return jsonify({
        "success": True,
        "input": val,
        "from_unit": from_unit,
        "to_unit": to_unit,
        "result": result,
        "result_formatted": f"{result:.6g}",
        "steps": [
            f"Input: {val} {from_unit}",
            f"Konversi ke meter: {meters:.6g} m",
            f"Konversi ke {to_unit}: {result:.6g} {to_unit}"
        ]
    })


@app.route("/api/convert/weight", methods=["POST"])
def convert_weight():
    """Konversi berat."""
    data = request.get_json(force=True)
    try:
        val = float(data.get("value"))
    except (TypeError, ValueError):
        return error("Nilai berat tidak valid")

    from_unit = data.get("from_unit", "kg")
    to_unit = data.get("to_unit", "lb")

    to_kg = {"mg": 1e-6, "g": 0.001, "kg": 1, "ton": 1000,
             "oz": 0.0283495, "lb": 0.453592}

    if from_unit not in to_kg or to_unit not in to_kg:
        return error("Unit berat tidak dikenali")

    kg = val * to_kg[from_unit]
    result = kg / to_kg[to_unit]

    return jsonify({
        "success": True,
        "input": val,
        "from_unit": from_unit,
        "to_unit": to_unit,
        "result": result,
        "result_formatted": f"{result:.6g}",
        "steps": [
            f"Input: {val} {from_unit}",
            f"Konversi ke kilogram: {kg:.6g} kg",
            f"Konversi ke {to_unit}: {result:.6g} {to_unit}"
        ]
    })


# ══════════════════════════════════════════
# FACTORIAL CALCULATOR
# ══════════════════════════════════════════

@app.route("/api/factorial", methods=["POST"])
def factorial_calc():
    """
    Hitung faktorial dengan langkah-langkah.
    Body: { "n": 10 }
    """
    data = request.get_json(force=True)
    try:
        n = int(data.get("n"))
    except (TypeError, ValueError):
        return error("Nilai 'n' harus bilangan bulat")

    if n < 0:
        return error("Faktorial hanya untuk bilangan bulat ≥ 0")
    if n > 500:
        return error("Nilai terlalu besar (maks 500)")

    result = math.factorial(n)
    steps = []

    if n == 0:
        steps = ["0! = 1 (definisi)"]
    elif n <= 12:
        parts = " × ".join(str(i) for i in range(n, 0, -1))
        steps = [
            f"{n}! = {parts}",
            f"    = {result}"
        ]
    else:
        steps = [
            f"{n}! = {n} × {n-1} × {n-2} × ... × 2 × 1",
            f"    = {result}",
            f"Jumlah digit: {len(str(result))}"
        ]

    return jsonify({
        "success": True,
        "n": n,
        "result": str(result),
        "digits": len(str(result)),
        "steps": steps
    })


@app.route("/api/factorial/table", methods=["GET"])
def factorial_table():
    """Tabel faktorial dari 0! sampai n!."""
    try:
        up_to = int(request.args.get("n", 15))
        up_to = min(up_to, 30)
    except (TypeError, ValueError):
        up_to = 15

    table = [{"n": i, "factorial": str(math.factorial(i))} for i in range(up_to + 1)]
    return jsonify({"success": True, "table": table})


# ══════════════════════════════════════════
# FIBONACCI CALCULATOR
# ══════════════════════════════════════════

def fib_single(n):
    """Hitung F(n) secara iteratif."""
    if n == 0: return 0
    if n == 1: return 1
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b


@app.route("/api/fibonacci", methods=["POST"])
def fibonacci_calc():
    """
    Hitung Fibonacci.
    Body: { "n": 10 } atau { "n": 20, "sequence": true }
    """
    data = request.get_json(force=True)
    try:
        n = int(data.get("n"))
    except (TypeError, ValueError):
        return error("Nilai 'n' harus bilangan bulat")

    if n < 0:
        return error("Fibonacci hanya untuk n ≥ 0")

    show_seq = data.get("sequence", False)

    if show_seq:
        if n > 100:
            return error("Untuk sequence, maks n = 100")
        seq = [fib_single(i) for i in range(n + 1)]
        steps = [f"F({i}) = {v}" for i, v in enumerate(seq)]
        return jsonify({
            "success": True,
            "n": n,
            "sequence": [str(v) for v in seq],
            "steps": steps
        })
    else:
        if n > 1000:
            return error("Untuk nilai tunggal, maks n = 1000")
        result = fib_single(n)
        steps = []
        if n <= 2:
            steps = [f"F({n}) = {result} (definisi dasar)"]
        else:
            fn1 = fib_single(n - 1)
            fn2 = fib_single(n - 2)
            steps = [
                f"F({n}) = F({n-1}) + F({n-2})",
                f"F({n}) = {fn1} + {fn2}",
                f"F({n}) = {result}"
            ]
        return jsonify({
            "success": True,
            "n": n,
            "result": str(result),
            "steps": steps
        })


# ══════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "app": "CalcMaster Pro",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/standard",
            "POST /api/arithmetic",
            "POST /api/bitwise",
            "POST /api/convert/number",
            "POST /api/convert/temperature",
            "POST /api/convert/length",
            "POST /api/convert/weight",
            "POST /api/factorial",
            "GET  /api/factorial/table",
            "POST /api/fibonacci",
        ]
    })


# ══════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 50)
    print("  CalcMaster Pro — Server Berjalan")
    print("  Buka: http://localhost:5000")
    print("  API:  http://localhost:5000/api/health")
    print("=" * 50)
    app.run(debug=True, port=5000)
