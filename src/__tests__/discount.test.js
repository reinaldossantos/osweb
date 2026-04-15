import { describe, it, expect } from "vitest";
import {
  calcFromDescontoValor,
  calcFromDescontoPercentual,
  buildDiscountPayload,
  formatDiscountDisplay,
  validateDiscountFields,
  DESCONTO_VALOR_MAX,
  DESCONTO_PERCENTUAL_MAX,
} from "../utils/discount.js";

// ─── Helper: simple BRL formatter matching constants.js ────────
const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0
  );

// ================================================================
// 1. calcFromDescontoValor — flat-value discount
// ================================================================
describe("calcFromDescontoValor", () => {
  // ── Happy-path ────────────────────────────────────────────────
  it("applies a simple flat discount", () => {
    const r = calcFromDescontoValor("50", "200");
    expect(r.desconto_valor).toBe("50");
    expect(r.desconto_percentual).toBe("25.00");
    expect(r.valor_total).toBe("150.00");
  });

  it("computes 100% discount when value equals gross", () => {
    const r = calcFromDescontoValor("1000", "1000");
    expect(r.desconto_percentual).toBe("100.00");
    expect(r.valor_total).toBe("0.00");
  });

  // ── Boundary: zero ────────────────────────────────────────────
  it("handles zero discount value", () => {
    const r = calcFromDescontoValor("0", "500");
    expect(r.desconto_percentual).toBe("0.00");
    expect(r.valor_total).toBe("500.00");
  });

  it("handles zero gross value", () => {
    const r = calcFromDescontoValor("10", "0");
    // pct should be "" because vb <= 0
    expect(r.desconto_percentual).toBe("");
    // total clamped to 0
    expect(r.valor_total).toBe("0.00");
  });

  it("handles both zero", () => {
    const r = calcFromDescontoValor("0", "0");
    expect(r.desconto_percentual).toBe("");
    expect(r.valor_total).toBe("0.00");
  });

  // ── Boundary: very small amounts (centavos) ───────────────────
  it("handles 0.01 discount on small gross", () => {
    const r = calcFromDescontoValor("0.01", "0.01");
    expect(r.desconto_percentual).toBe("100.00");
    expect(r.valor_total).toBe("0.00");
  });

  it("handles 0.01 discount on large gross", () => {
    const r = calcFromDescontoValor("0.01", "10000");
    expect(r.desconto_percentual).toBe("0.00");
    expect(r.valor_total).toBe("9999.99");
  });

  // ── Boundary: large values matching NUMERIC(12,2) ─────────────
  it("handles maximum DB value for desconto_valor", () => {
    const r = calcFromDescontoValor(String(DESCONTO_VALOR_MAX), String(DESCONTO_VALOR_MAX));
    expect(r.desconto_percentual).toBe("100.00");
    expect(r.valor_total).toBe("0.00");
  });

  it("handles discount exceeding gross — total clamped to 0", () => {
    const r = calcFromDescontoValor("999", "100");
    expect(parseFloat(r.valor_total)).toBe(0);
  });

  // ── Empty / null / undefined inputs ───────────────────────────
  it('handles empty string discount → treated as 0', () => {
    const r = calcFromDescontoValor("", "500");
    expect(r.desconto_percentual).toBe("0.00");
    expect(r.valor_total).toBe("500.00");
  });

  it('handles empty string gross → treated as 0', () => {
    const r = calcFromDescontoValor("10", "");
    expect(r.desconto_percentual).toBe("");
    expect(r.valor_total).toBe("0.00");
  });

  it("handles undefined inputs gracefully", () => {
    const r = calcFromDescontoValor(undefined, undefined);
    expect(r.valor_total).toBe("0.00");
  });

  it("handles null inputs gracefully", () => {
    const r = calcFromDescontoValor(null, null);
    expect(r.valor_total).toBe("0.00");
  });

  // ── Error paths: NaN / non-numeric strings ────────────────────
  it("handles NaN input as 0", () => {
    const r = calcFromDescontoValor("abc", "500");
    expect(r.desconto_percentual).toBe("0.00");
    expect(r.valor_total).toBe("500.00");
  });

  it("handles NaN gross as 0", () => {
    const r = calcFromDescontoValor("50", "xyz");
    expect(r.desconto_percentual).toBe("");
    expect(r.valor_total).toBe("0.00");
  });

  // ── Negative values (browser input can allow this) ────────────
  it("handles negative discount value", () => {
    const r = calcFromDescontoValor("-50", "200");
    // parseFloat("-50") = -50; vb - dv = 200 - (-50) = 250
    expect(r.valor_total).toBe("250.00");
    // pct = -50/200 * 100 = -25
    expect(r.desconto_percentual).toBe("-25.00");
  });

  it("handles negative gross value", () => {
    const r = calcFromDescontoValor("50", "-200");
    // vb = -200, so vb <= 0 → pct = ""
    expect(r.desconto_percentual).toBe("");
    // max(0, -200 - 50) = 0
    expect(r.valor_total).toBe("0.00");
  });

  // ── Floating point precision ──────────────────────────────────
  it("handles floating point precision for thirds", () => {
    // 33.33 discount on 100 → 66.67
    const r = calcFromDescontoValor("33.33", "100");
    expect(r.valor_total).toBe("66.67");
    expect(r.desconto_percentual).toBe("33.33");
  });

  it("handles repeating decimal percentages", () => {
    // 1/3 of 300 = 100
    const r = calcFromDescontoValor("100", "300");
    expect(r.desconto_percentual).toBe("33.33");
    expect(r.valor_total).toBe("200.00");
  });
});

// ================================================================
// 2. calcFromDescontoPercentual — percentage discount
// ================================================================
describe("calcFromDescontoPercentual", () => {
  // ── Happy-path ────────────────────────────────────────────────
  it("applies a simple percentage discount", () => {
    const r = calcFromDescontoPercentual("10", "200");
    expect(r.desconto_valor).toBe("20.00");
    expect(r.valor_total).toBe("180.00");
  });

  it("applies 100% discount", () => {
    const r = calcFromDescontoPercentual("100", "500");
    expect(r.desconto_valor).toBe("500.00");
    expect(r.valor_total).toBe("0.00");
  });

  it("applies 0% discount", () => {
    const r = calcFromDescontoPercentual("0", "500");
    expect(r.desconto_valor).toBe("0.00");
    expect(r.valor_total).toBe("500.00");
  });

  // ── Boundary: zero gross ──────────────────────────────────────
  it("handles percentage on zero gross", () => {
    const r = calcFromDescontoPercentual("50", "0");
    expect(r.desconto_valor).toBe("0.00");
    expect(r.valor_total).toBe("0.00");
  });

  // ── Boundary: over 100% ───────────────────────────────────────
  it("handles percentage > 100 — total clamped to 0", () => {
    const r = calcFromDescontoPercentual("150", "200");
    // dv = (150/100)*200 = 300
    expect(r.desconto_valor).toBe("300.00");
    // total = max(0, 200 - 300) = 0
    expect(r.valor_total).toBe("0.00");
  });

  // ── Boundary: very small percentage ───────────────────────────
  it("handles 0.01% discount", () => {
    const r = calcFromDescontoPercentual("0.01", "10000");
    expect(r.desconto_valor).toBe("1.00");
    expect(r.valor_total).toBe("9999.00");
  });

  // ── Boundary: DB max NUMERIC(5,2) ────────────────────────────
  it("handles max NUMERIC(5,2) percentage (999.99%)", () => {
    const r = calcFromDescontoPercentual(String(DESCONTO_PERCENTUAL_MAX), "100");
    // dv = 999.99/100 * 100 = 999.99
    expect(r.desconto_valor).toBe("999.99");
    // total clamped to 0
    expect(r.valor_total).toBe("0.00");
  });

  // ── Empty / null / undefined inputs ───────────────────────────
  it('handles empty string percentage → treated as 0', () => {
    const r = calcFromDescontoPercentual("", "500");
    expect(r.desconto_valor).toBe("0.00");
    expect(r.valor_total).toBe("500.00");
  });

  it("handles undefined inputs gracefully", () => {
    const r = calcFromDescontoPercentual(undefined, undefined);
    expect(r.desconto_valor).toBe("0.00");
    expect(r.valor_total).toBe("0.00");
  });

  it("handles null inputs gracefully", () => {
    const r = calcFromDescontoPercentual(null, null);
    expect(r.desconto_valor).toBe("0.00");
    expect(r.valor_total).toBe("0.00");
  });

  // ── Error paths: non-numeric strings ──────────────────────────
  it("handles NaN percentage as 0", () => {
    const r = calcFromDescontoPercentual("abc", "500");
    expect(r.desconto_valor).toBe("0.00");
    expect(r.valor_total).toBe("500.00");
  });

  // ── Negative percentage ───────────────────────────────────────
  it("handles negative percentage", () => {
    const r = calcFromDescontoPercentual("-10", "200");
    // dv = (-10/100)*200 = -20
    expect(r.desconto_valor).toBe("-20.00");
    // total = max(0, 200 - (-20)) = max(0, 220) = 220
    expect(r.valor_total).toBe("220.00");
  });

  // ── Floating point precision ──────────────────────────────────
  it("handles 33.33% of 100", () => {
    const r = calcFromDescontoPercentual("33.33", "100");
    expect(r.desconto_valor).toBe("33.33");
    expect(r.valor_total).toBe("66.67");
  });

  it("handles 7.5% of 199.99", () => {
    const r = calcFromDescontoPercentual("7.5", "199.99");
    expect(r.desconto_valor).toBe("15.00");
    expect(r.valor_total).toBe("184.99");
  });
});

// ================================================================
// 3. Concurrent / bidirectional sync — value ↔ percentage
// ================================================================
describe("value ↔ percentage bidirectional sync", () => {
  it("value → percentage → value round-trips consistently", () => {
    // Start: gross = 1000, set discount value = 250
    const step1 = calcFromDescontoValor("250", "1000");
    expect(step1.desconto_percentual).toBe("25.00");
    expect(step1.valor_total).toBe("750.00");

    // User then adjusts percentage to 30%
    const step2 = calcFromDescontoPercentual("30", "1000");
    expect(step2.desconto_valor).toBe("300.00");
    expect(step2.valor_total).toBe("700.00");

    // User goes back and sets value to 300
    const step3 = calcFromDescontoValor("300", "1000");
    expect(step3.desconto_percentual).toBe("30.00");
    expect(step3.valor_total).toBe("700.00");
  });

  it("percentage and value agree when computed from each other", () => {
    const gross = "2500";
    const fromVal = calcFromDescontoValor("375", gross);
    const fromPct = calcFromDescontoPercentual(fromVal.desconto_percentual, gross);
    // The resulting valor_total should match
    expect(fromPct.valor_total).toBe(fromVal.valor_total);
  });

  it("handles rapid sequential updates (simulates fast typing)", () => {
    // User types "1" then "10" then "100" for percentage
    const gross = "500";
    const r1 = calcFromDescontoPercentual("1", gross);
    expect(r1.desconto_valor).toBe("5.00");

    const r2 = calcFromDescontoPercentual("10", gross);
    expect(r2.desconto_valor).toBe("50.00");

    const r3 = calcFromDescontoPercentual("100", gross);
    expect(r3.desconto_valor).toBe("500.00");
    expect(r3.valor_total).toBe("0.00");
  });

  it("changing gross resets discount correctly when triggered via value", () => {
    // Original gross 1000, discount 100 (10%)
    const r1 = calcFromDescontoValor("100", "1000");
    expect(r1.desconto_percentual).toBe("10.00");

    // Gross changed to 500, same discount value
    const r2 = calcFromDescontoValor("100", "500");
    expect(r2.desconto_percentual).toBe("20.00");
    expect(r2.valor_total).toBe("400.00");
  });
});

// ================================================================
// 4. buildDiscountPayload — submit handler coercion
// ================================================================
describe("buildDiscountPayload", () => {
  it("converts numeric strings to numbers", () => {
    const p = buildDiscountPayload("123.45", "10.5");
    expect(p.desconto_valor).toBe(123.45);
    expect(p.desconto_percentual).toBe(10.5);
  });

  it("converts empty strings to 0", () => {
    const p = buildDiscountPayload("", "");
    expect(p.desconto_valor).toBe(0);
    expect(p.desconto_percentual).toBe(0);
  });

  it("converts undefined to 0", () => {
    const p = buildDiscountPayload(undefined, undefined);
    expect(p.desconto_valor).toBe(0);
    expect(p.desconto_percentual).toBe(0);
  });

  it("converts null to 0", () => {
    const p = buildDiscountPayload(null, null);
    expect(p.desconto_valor).toBe(0);
    expect(p.desconto_percentual).toBe(0);
  });

  it("converts NaN strings to 0", () => {
    const p = buildDiscountPayload("abc", "xyz");
    expect(p.desconto_valor).toBe(0);
    expect(p.desconto_percentual).toBe(0);
  });

  it("preserves negative values (no clamping in payload)", () => {
    const p = buildDiscountPayload("-50", "-10");
    expect(p.desconto_valor).toBe(-50);
    expect(p.desconto_percentual).toBe(-10);
  });

  it("preserves zero", () => {
    const p = buildDiscountPayload("0", "0");
    expect(p.desconto_valor).toBe(0);
    expect(p.desconto_percentual).toBe(0);
  });

  it("handles number inputs (not just strings)", () => {
    const p = buildDiscountPayload(99.99, 15);
    expect(p.desconto_valor).toBe(99.99);
    expect(p.desconto_percentual).toBe(15);
  });

  it("handles Infinity as truthy number", () => {
    const p = buildDiscountPayload(Infinity, -Infinity);
    expect(p.desconto_valor).toBe(Infinity);
    expect(p.desconto_percentual).toBe(-Infinity);
  });

  // ── Boundary: DB max values ───────────────────────────────────
  it("handles max NUMERIC(12,2) value", () => {
    const p = buildDiscountPayload(String(DESCONTO_VALOR_MAX), "0");
    expect(p.desconto_valor).toBe(DESCONTO_VALOR_MAX);
  });

  it("handles max NUMERIC(5,2) percentage", () => {
    const p = buildDiscountPayload("0", String(DESCONTO_PERCENTUAL_MAX));
    expect(p.desconto_percentual).toBe(DESCONTO_PERCENTUAL_MAX);
  });
});

// ================================================================
// 5. formatDiscountDisplay — detail view rendering
// ================================================================
describe("formatDiscountDisplay", () => {
  it("formats positive value and percentage", () => {
    const result = formatDiscountDisplay(50, 10, fmt);
    expect(result).toContain("50");
    expect(result).toContain("10%");
  });

  it("returns null when both are 0", () => {
    expect(formatDiscountDisplay(0, 0, fmt)).toBeNull();
  });

  it("returns non-null when only value > 0", () => {
    expect(formatDiscountDisplay(100, 0, fmt)).not.toBeNull();
  });

  it("returns non-null when only percentage > 0", () => {
    expect(formatDiscountDisplay(0, 5, fmt)).not.toBeNull();
  });

  it("returns null for negative values (both < 0 treated as no discount)", () => {
    // Both negative → condition (v > 0 || p > 0) is false
    expect(formatDiscountDisplay(-10, -5, fmt)).toBeNull();
  });

  it("handles undefined/NaN gracefully — treated as 0 by > comparison", () => {
    expect(formatDiscountDisplay(undefined, undefined, fmt)).toBeNull();
    expect(formatDiscountDisplay(NaN, NaN, fmt)).toBeNull();
  });

  it("formats zero value with positive percentage", () => {
    const result = formatDiscountDisplay(0, 15, fmt);
    expect(result).toContain("15%");
  });

  it("formats large values correctly", () => {
    const result = formatDiscountDisplay(DESCONTO_VALOR_MAX, 50, fmt);
    expect(result).not.toBeNull();
    expect(result).toContain("50%");
  });
});

// ================================================================
// 6. validateDiscountFields — DB constraint validation
// ================================================================
describe("validateDiscountFields", () => {
  // ── Valid cases ───────────────────────────────────────────────
  it("accepts zero values", () => {
    const r = validateDiscountFields(0, 0);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("accepts normal positive values", () => {
    const r = validateDiscountFields(150.50, 10.25);
    expect(r.valid).toBe(true);
  });

  it("accepts boundary max values", () => {
    const r = validateDiscountFields(DESCONTO_VALOR_MAX, DESCONTO_PERCENTUAL_MAX);
    expect(r.valid).toBe(true);
  });

  it("accepts 0.01 (minimum positive precision)", () => {
    const r = validateDiscountFields(0.01, 0.01);
    expect(r.valid).toBe(true);
  });

  // ── Invalid: negative ─────────────────────────────────────────
  it("rejects negative desconto_valor", () => {
    const r = validateDiscountFields(-1, 0);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("desconto_valor must not be negative");
  });

  it("rejects negative desconto_percentual", () => {
    const r = validateDiscountFields(0, -0.01);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("desconto_percentual must not be negative");
  });

  it("rejects both negative", () => {
    const r = validateDiscountFields(-100, -50);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(2);
  });

  // ── Invalid: exceeds DB column max ────────────────────────────
  it("rejects desconto_valor exceeding NUMERIC(12,2) max", () => {
    const r = validateDiscountFields(DESCONTO_VALOR_MAX + 0.01, 0);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("exceeds maximum");
  });

  it("rejects desconto_percentual exceeding NUMERIC(5,2) max", () => {
    const r = validateDiscountFields(0, DESCONTO_PERCENTUAL_MAX + 0.01);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("exceeds maximum");
  });

  // ── Invalid: NaN ──────────────────────────────────────────────
  it("rejects NaN desconto_valor", () => {
    const r = validateDiscountFields(NaN, 10);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("desconto_valor must be a valid number");
  });

  it("rejects NaN desconto_percentual", () => {
    const r = validateDiscountFields(10, NaN);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("desconto_percentual must be a valid number");
  });

  // ── Invalid: non-number type ──────────────────────────────────
  it("rejects string type for desconto_valor", () => {
    const r = validateDiscountFields("100", 10);
    expect(r.valid).toBe(false);
  });

  it("rejects undefined", () => {
    const r = validateDiscountFields(undefined, undefined);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBe(2);
  });

  it("rejects null", () => {
    const r = validateDiscountFields(null, null);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBe(2);
  });

  // ── Edge: Infinity ────────────────────────────────────────────
  it("rejects Infinity as exceeding max", () => {
    const r = validateDiscountFields(Infinity, Infinity);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBe(2);
  });

  it("rejects -Infinity as negative", () => {
    const r = validateDiscountFields(-Infinity, -Infinity);
    expect(r.valid).toBe(false);
  });
});

// ================================================================
// 7. SQL migration boundary tests (column definition verification)
// ================================================================
describe("SQL column boundary constraints (migracao_campos_os_v2.sql)", () => {
  // These tests verify our constants match the actual migration DDL:
  //   desconto_valor      NUMERIC(12,2) → max 10^10 - 0.01 = 9999999999.99
  //   desconto_percentual NUMERIC(5,2)  → max 10^3  - 0.01 = 999.99

  it("DESCONTO_VALOR_MAX matches NUMERIC(12,2) upper bound", () => {
    // NUMERIC(12,2): 12 total digits, 2 after decimal
    // → 10 integer digits max → 9999999999.99
    expect(DESCONTO_VALOR_MAX).toBe(9999999999.99);
  });

  it("DESCONTO_PERCENTUAL_MAX matches NUMERIC(5,2) upper bound", () => {
    // NUMERIC(5,2): 5 total digits, 2 after decimal
    // → 3 integer digits max → 999.99
    expect(DESCONTO_PERCENTUAL_MAX).toBe(999.99);
  });

  it("valor just below max is valid", () => {
    const r = validateDiscountFields(9999999999.98, 999.98);
    expect(r.valid).toBe(true);
  });

  it("valor at max is valid", () => {
    const r = validateDiscountFields(9999999999.99, 999.99);
    expect(r.valid).toBe(true);
  });

  it("valor just above max is invalid", () => {
    const r = validateDiscountFields(10000000000.00, 0);
    expect(r.valid).toBe(false);
  });

  it("percentual just above max is invalid", () => {
    const r = validateDiscountFields(0, 1000.00);
    expect(r.valid).toBe(false);
  });

  it("DEFAULT 0 is valid for both columns", () => {
    // The migration sets DEFAULT 0 for both columns
    const r = validateDiscountFields(0, 0);
    expect(r.valid).toBe(true);
  });
});

// ================================================================
// 8. Integration-style: full form lifecycle simulation
// ================================================================
describe("full discount lifecycle (create → edit → display)", () => {
  it("simulates creating an OS with items, applying discount, then viewing", () => {
    // Step 1: Items total = 3 items × R$ 100 = R$ 300
    const itemsTotal = "300.00";

    // Step 2: User enters 10% discount
    const afterPct = calcFromDescontoPercentual("10", itemsTotal);
    expect(afterPct.desconto_valor).toBe("30.00");
    expect(afterPct.valor_total).toBe("270.00");

    // Step 3: Build payload for Supabase insert
    const payload = buildDiscountPayload(
      afterPct.desconto_valor,
      afterPct.desconto_percentual
    );
    expect(payload.desconto_valor).toBe(30);
    expect(payload.desconto_percentual).toBe(10);

    // Step 4: After DB round-trip, display in OSDetalhe
    const display = formatDiscountDisplay(
      payload.desconto_valor,
      payload.desconto_percentual,
      fmt
    );
    expect(display).not.toBeNull();
    expect(display).toContain("10%");

    // Step 5: Validate before sending
    const validation = validateDiscountFields(
      payload.desconto_valor,
      payload.desconto_percentual
    );
    expect(validation.valid).toBe(true);
  });

  it("simulates editing an OS and switching from value to percentage discount", () => {
    // Existing OS: gross = 2000, desconto_valor = 200 (10%)
    const gross = "2000";

    // User changes from value mode to percentage mode: sets 15%
    const step1 = calcFromDescontoPercentual("15", gross);
    expect(step1.desconto_valor).toBe("300.00");
    expect(step1.valor_total).toBe("1700.00");

    // Then changes mind, types R$ 250 directly
    const step2 = calcFromDescontoValor("250", gross);
    expect(step2.desconto_percentual).toBe("12.50");
    expect(step2.valor_total).toBe("1750.00");

    // Build and validate payload
    const payload = buildDiscountPayload(step2.desconto_valor, step2.desconto_percentual);
    expect(payload.desconto_valor).toBe(250);
    expect(payload.desconto_percentual).toBe(12.5);

    const v = validateDiscountFields(payload.desconto_valor, payload.desconto_percentual);
    expect(v.valid).toBe(true);
  });

  it("simulates an OS with no discount applied at all", () => {
    const payload = buildDiscountPayload("", "");
    expect(payload.desconto_valor).toBe(0);
    expect(payload.desconto_percentual).toBe(0);

    const display = formatDiscountDisplay(0, 0, fmt);
    expect(display).toBeNull();

    const v = validateDiscountFields(0, 0);
    expect(v.valid).toBe(true);
  });

  it("simulates user clearing discount after setting one", () => {
    // Set discount
    const r1 = calcFromDescontoValor("100", "500");
    expect(r1.valor_total).toBe("400.00");

    // Clear discount by emptying the field
    const r2 = calcFromDescontoValor("", "500");
    expect(r2.valor_total).toBe("500.00");
    expect(r2.desconto_percentual).toBe("0.00");

    // Payload should be 0
    const payload = buildDiscountPayload(r2.desconto_valor, r2.desconto_percentual);
    expect(payload.desconto_valor).toBe(0);
    expect(payload.desconto_percentual).toBe(0);
  });
});
