// ─── Discount calculation helpers ──────────────────────────────
// Extracted from OrdensServico.jsx inline handlers so the logic
// can be unit-tested independently.
// ───────────────────────────────────────────────────────────────

/**
 * DB limits derived from migracao_campos_os_v2.sql:
 *   desconto_valor      NUMERIC(12,2)  → max 9999999999.99
 *   desconto_percentual NUMERIC(5,2)   → max 999.99
 */
export const DESCONTO_VALOR_MAX = 9999999999.99;
export const DESCONTO_PERCENTUAL_MAX = 999.99;

/**
 * Compute the new form state when the user changes the
 * flat-value discount field (desconto_valor).
 *
 * @param {string|number} rawValue  – raw input value (may be "" or non-numeric)
 * @param {string|number} grossOrCurrent – _valor_bruto or valor_total before discount
 * @returns {{ desconto_valor, desconto_percentual, valor_total }}
 */
export function calcFromDescontoValor(rawValue, grossOrCurrent) {
  const dv = parseFloat(rawValue) || 0;
  const vb = parseFloat(grossOrCurrent) || 0;
  const pct = vb > 0 ? ((dv / vb) * 100).toFixed(2) : "";
  const total = Math.max(0, vb - dv).toFixed(2);
  return {
    desconto_valor: rawValue,
    desconto_percentual: pct,
    valor_total: total,
  };
}

/**
 * Compute the new form state when the user changes the
 * percentage discount field (desconto_percentual).
 *
 * @param {string|number} rawPct – raw input percentage
 * @param {string|number} grossOrCurrent – _valor_bruto or valor_total before discount
 * @returns {{ desconto_valor, desconto_percentual, valor_total }}
 */
export function calcFromDescontoPercentual(rawPct, grossOrCurrent) {
  const pct = parseFloat(rawPct) || 0;
  const vb = parseFloat(grossOrCurrent) || 0;
  const dv = ((pct / 100) * vb).toFixed(2);
  const total = Math.max(0, vb - parseFloat(dv)).toFixed(2);
  return {
    desconto_valor: dv,
    desconto_percentual: rawPct,
    valor_total: total,
  };
}

/**
 * Build the discount portion of the payload sent to Supabase on
 * form submit (both NovaOS and EditarOS).
 *
 * @param {string|number} descontoValor
 * @param {string|number} descontoPercentual
 * @returns {{ desconto_valor: number, desconto_percentual: number }}
 */
export function buildDiscountPayload(descontoValor, descontoPercentual) {
  return {
    desconto_valor: parseFloat(descontoValor) || 0,
    desconto_percentual: parseFloat(descontoPercentual) || 0,
  };
}

/**
 * Format discount info for the detail view (OSDetalhe infoRows).
 * Returns null when there is no discount, matching the filter
 * `([, v]) => v` used in the component.
 *
 * @param {number} descontoValor
 * @param {number} descontoPercentual
 * @param {function} fmt – currency formatter from constants
 * @returns {string|null}
 */
export function formatDiscountDisplay(descontoValor, descontoPercentual, fmt) {
  if (descontoValor > 0 || descontoPercentual > 0) {
    return `${fmt(descontoValor)} (${descontoPercentual}%)`;
  }
  return null;
}

/**
 * Validate discount values against the database column limits.
 *
 * @param {number} descontoValor
 * @param {number} descontoPercentual
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDiscountFields(descontoValor, descontoPercentual) {
  const errors = [];

  if (typeof descontoValor !== "number" || Number.isNaN(descontoValor)) {
    errors.push("desconto_valor must be a valid number");
  } else {
    if (descontoValor < 0) errors.push("desconto_valor must not be negative");
    if (descontoValor > DESCONTO_VALOR_MAX)
      errors.push(`desconto_valor exceeds maximum (${DESCONTO_VALOR_MAX})`);
  }

  if (typeof descontoPercentual !== "number" || Number.isNaN(descontoPercentual)) {
    errors.push("desconto_percentual must be a valid number");
  } else {
    if (descontoPercentual < 0)
      errors.push("desconto_percentual must not be negative");
    if (descontoPercentual > DESCONTO_PERCENTUAL_MAX)
      errors.push(`desconto_percentual exceeds maximum (${DESCONTO_PERCENTUAL_MAX})`);
  }

  return { valid: errors.length === 0, errors };
}
