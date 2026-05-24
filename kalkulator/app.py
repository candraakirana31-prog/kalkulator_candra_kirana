from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

# ─── Static Currency Rates (base: IDR) ───────────────────────────────────────
CURRENCY_RATES = {
    "IDR": 1,
    "USD": 0.000063,
    "EUR": 0.000058,
    "SGD": 0.000085,
    "JPY": 0.0096,
    "GBP": 0.000050,
    "AUD": 0.000097,
    "MYR": 0.000293,
}

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


# ─── Arithmetic ──────────────────────────────────────────────────────────────

@app.route("/api/arithmetic", methods=["POST"])
def arithmetic():
    data = request.get_json()
    a = data.get("a")
    b = data.get("b")
    op = data.get("op")

    try:
        a = float(a)
        b = float(b) if b is not None and b != "" else None

        result = None
        formula = ""
        steps = []

        if op == "add":
            result = a + b
            formula = f"{a} + {b} = {result}"
            steps = [
                f"Operand pertama: {a}",
                f"Operand kedua: {b}",
                f"Penjumlahan: {a} + {b} = {result}"
            ]
        elif op == "sub":
            result = a - b
            formula = f"{a} - {b} = {result}"
            steps = [
                f"Operand pertama: {a}",
                f"Operand kedua: {b}",
                f"Pengurangan: {a} - {b} = {result}"
            ]
        elif op == "mul":
            result = a * b
            formula = f"{a} × {b} = {result}"
            steps = [
                f"Operand pertama: {a}",
                f"Operand kedua: {b}",
                f"Perkalian: {a} × {b} = {result}"
            ]
        elif op == "div":
            if b == 0:
                return jsonify({"error": "Pembagian dengan nol tidak diperbolehkan!"}), 400
            result = a / b
            formula = f"{a} ÷ {b} = {result}"
            steps = [
                f"Operand pertama: {a}",
                f"Operand kedua: {b}",
                f"Pembagian: {a} ÷ {b} = {result}"
            ]
        elif op == "pow":
            result = a ** b
            formula = f"{a} ^ {b} = {result}"
            steps = [
                f"Basis: {a}",
                f"Eksponen: {b}",
                f"Pangkat: {a}^{b} = {result}"
            ]
        elif op == "sqrt":
            if a < 0:
                return jsonify({"error": "Akar kuadrat dari bilangan negatif tidak nyata!"}), 400
            result = math.sqrt(a)
            formula = f"√{a} = {result}"
            steps = [
                f"Bilangan: {a}",
                f"Akar kuadrat: √{a} = {result}"
            ]
        elif op == "mod":
            if b == 0:
                return jsonify({"error": "Modulus dengan nol tidak diperbolehkan!"}), 400
            result = a % b
            formula = f"{a} mod {b} = {result}"
            steps = [
                f"Operand pertama: {a}",
                f"Operand kedua: {b}",
                f"Floor division: {a} // {b} = {int(a // b)}",
                f"Sisa: {a} - ({int(a // b)} × {b}) = {result}"
            ]
        elif op == "floordiv":
            if b == 0:
                return jsonify({"error": "Floor division dengan nol tidak diperbolehkan!"}), 400
            result = int(a // b)
            formula = f"{a} // {b} = {result}"
            steps = [
                f"Operand pertama: {a}",
                f"Operand kedua: {b}",
                f"Floor division (hasil bagi tanpa sisa): {a} // {b} = {result}"
            ]
        else:
            return jsonify({"error": "Operasi tidak dikenal"}), 400

        return jsonify({
            "result": result,
            "formula": formula,
            "steps": steps
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Logic ───────────────────────────────────────────────────────────────────

@app.route("/api/logic", methods=["POST"])
def logic():
    data = request.get_json()
    a = data.get("a")
    b = data.get("b")
    op = data.get("op")

    try:
        a = int(a)
        b = int(b) if b is not None and b != "" else None

        result = None
        formula = ""
        steps = []

        if op == "and":
            result = a & b
            formula = f"{a} AND {b} = {result}"
            steps = [
                f"A = {a} → biner: {bin(a)}",
                f"B = {b} → biner: {bin(b)}",
                f"AND bitwise: setiap bit 1 hanya jika kedua bit 1",
                f"Hasil: {bin(result)} = {result}"
            ]
        elif op == "or":
            result = a | b
            formula = f"{a} OR {b} = {result}"
            steps = [
                f"A = {a} → biner: {bin(a)}",
                f"B = {b} → biner: {bin(b)}",
                f"OR bitwise: setiap bit 1 jika salah satu bit 1",
                f"Hasil: {bin(result)} = {result}"
            ]
        elif op == "not":
            result = ~a
            formula = f"NOT {a} = {result}"
            steps = [
                f"A = {a} → biner: {bin(a)}",
                f"NOT bitwise: membalik setiap bit",
                f"Dalam Python: ~{a} = -{a+1} (komplemen dua)",
                f"Hasil: {result}"
            ]
        elif op == "xor":
            result = a ^ b
            formula = f"{a} XOR {b} = {result}"
            steps = [
                f"A = {a} → biner: {bin(a)}",
                f"B = {b} → biner: {bin(b)}",
                f"XOR bitwise: bit 1 jika kedua bit berbeda",
                f"Hasil: {bin(result)} = {result}"
            ]
        elif op == "nand":
            result = ~(a & b)
            formula = f"{a} NAND {b} = {result}"
            steps = [
                f"A = {a} → biner: {bin(a)}",
                f"B = {b} → biner: {bin(b)}",
                f"AND dulu: {a} & {b} = {a & b}",
                f"Lalu NOT: ~{a & b} = {result}",
                f"Hasil NAND: {result}"
            ]
        elif op == "nor":
            result = ~(a | b)
            formula = f"{a} NOR {b} = {result}"
            steps = [
                f"A = {a} → biner: {bin(a)}",
                f"B = {b} → biner: {bin(b)}",
                f"OR dulu: {a} | {b} = {a | b}",
                f"Lalu NOT: ~{a | b} = {result}",
                f"Hasil NOR: {result}"
            ]
        else:
            return jsonify({"error": "Operasi tidak dikenal"}), 400

        return jsonify({
            "result": result,
            "formula": formula,
            "steps": steps
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Conversion ──────────────────────────────────────────────────────────────

@app.route("/api/convert/base", methods=["POST"])
def convert_base():
    data = request.get_json()
    number = data.get("number", "")
    from_base = int(data.get("from_base", 10))
    to_base = int(data.get("to_base", 2))

    try:
        decimal = int(str(number), from_base)
        steps = [f"Input: {number} (basis {from_base})"]
        steps.append(f"Konversi ke desimal: {decimal}")

        if to_base == 2:
            result = bin(decimal)[2:]
            steps.append(f"Desimal {decimal} → Biner: {result}")
        elif to_base == 8:
            result = oct(decimal)[2:]
            steps.append(f"Desimal {decimal} → Oktal: {result}")
        elif to_base == 10:
            result = str(decimal)
            steps.append(f"Hasil dalam desimal: {result}")
        elif to_base == 16:
            result = hex(decimal)[2:].upper()
            steps.append(f"Desimal {decimal} → Heksadesimal: {result}")
        else:
            return jsonify({"error": "Basis tidak didukung"}), 400

        base_names = {2: "Biner", 8: "Oktal", 10: "Desimal", 16: "Heksadesimal"}
        formula = f"{number} ({base_names.get(from_base, from_base)}) = {result} ({base_names.get(to_base, to_base)})"

        return jsonify({"result": result, "formula": formula, "steps": steps})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/convert/temperature", methods=["POST"])
def convert_temperature():
    data = request.get_json()
    value = float(data.get("value", 0))
    from_unit = data.get("from_unit", "C")
    to_unit = data.get("to_unit", "F")

    try:
        # Convert to Celsius first
        if from_unit == "C":
            celsius = value
        elif from_unit == "F":
            celsius = (value - 32) * 5 / 9
        elif from_unit == "K":
            celsius = value - 273.15
        elif from_unit == "R":
            celsius = value * 5 / 4
        else:
            return jsonify({"error": "Satuan tidak dikenal"}), 400

        # Convert Celsius to target
        if to_unit == "C":
            result = celsius
        elif to_unit == "F":
            result = celsius * 9 / 5 + 32
        elif to_unit == "K":
            result = celsius + 273.15
        elif to_unit == "R":
            result = celsius * 4 / 5
        else:
            return jsonify({"error": "Satuan tidak dikenal"}), 400

        unit_names = {"C": "Celsius", "F": "Fahrenheit", "K": "Kelvin", "R": "Réaumur"}
        formula = f"{value}° {unit_names[from_unit]} = {round(result, 4)}° {unit_names[to_unit]}"

        steps = [
            f"Nilai input: {value}° {unit_names[from_unit]}",
            f"Konversi ke Celsius: {round(celsius, 4)}°C",
            f"Konversi ke {unit_names[to_unit]}: {round(result, 4)}"
        ]

        return jsonify({"result": round(result, 4), "formula": formula, "steps": steps})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/convert/currency", methods=["POST"])
def convert_currency():
    data = request.get_json()
    value = float(data.get("value", 0))
    from_cur = data.get("from_currency", "IDR")
    to_cur = data.get("to_currency", "USD")

    try:
        if from_cur not in CURRENCY_RATES or to_cur not in CURRENCY_RATES:
            return jsonify({"error": "Mata uang tidak dikenal"}), 400

        in_idr = value / CURRENCY_RATES[from_cur]
        result = in_idr * CURRENCY_RATES[to_cur]

        formula = f"{value} {from_cur} = {round(result, 4)} {to_cur}"
        steps = [
            f"Input: {value} {from_cur}",
            f"Rate {from_cur} ke IDR: 1 {from_cur} = {1/CURRENCY_RATES[from_cur]:,.2f} IDR",
            f"Nilai dalam IDR: {in_idr:,.4f}",
            f"Rate IDR ke {to_cur}: {CURRENCY_RATES[to_cur]}",
            f"Hasil: {round(result, 4)} {to_cur}"
        ]

        return jsonify({"result": round(result, 6), "formula": formula, "steps": steps})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Factorial & Fibonacci ────────────────────────────────────────────────────

@app.route("/api/factorial", methods=["POST"])
def factorial():
    data = request.get_json()
    n = int(data.get("n", 0))

    if n < 0:
        return jsonify({"error": "Faktorial hanya untuk bilangan non-negatif!"}), 400
    if n > 170:
        return jsonify({"error": "Bilangan terlalu besar (maks 170)!"}), 400

    try:
        result = math.factorial(n)
        formula = f"{n}! = {result}"

        if n <= 10:
            expansion = " × ".join(str(i) for i in range(n, 0, -1)) or "1"
            steps = [
                f"n = {n}",
                f"Faktorial: n! = n × (n-1) × ... × 1",
                f"{n}! = {expansion} = {result}"
            ]
        else:
            steps = [
                f"n = {n}",
                f"Faktorial: n! = n × (n-1) × ... × 1",
                f"Menghitung {n}! secara rekursif...",
                f"Hasil: {result}"
            ]

        return jsonify({"result": result, "formula": formula, "steps": steps})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/fibonacci", methods=["POST"])
def fibonacci():
    data = request.get_json()
    n = int(data.get("n", 10))

    if n < 1:
        return jsonify({"error": "n harus minimal 1!"}), 400
    if n > 80:
        return jsonify({"error": "n terlalu besar (maks 80)!"}), 400

    try:
        seq = [0, 1]
        for i in range(2, n):
            seq.append(seq[-1] + seq[-2])
        seq = seq[:n]

        steps = [
            f"Membuat {n} suku pertama deret Fibonacci",
            "F(0) = 0, F(1) = 1",
            "F(n) = F(n-1) + F(n-2) untuk n ≥ 2",
            f"Suku ke-{n}: {seq[-1]}",
            f"Deret: {', '.join(map(str, seq[:15]))}{'...' if n > 15 else ''}"
        ]

        return jsonify({
            "result": seq[-1],
            "sequence": seq,
            "formula": f"F({n-1}) = {seq[-1]}",
            "steps": steps
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
