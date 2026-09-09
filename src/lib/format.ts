// Shared number/price formatting — previously every price on the platform
// rendered as a raw, unformatted integer ({priceAmount} {currency}, e.g.
// "210000 EUR" with no thousands separator), the exact "financial
// information looking inconsistent" gap a typography/data-readability pass
// is supposed to catch. Intl.NumberFormat handles locale-correct grouping
// (1.234,56 vs 1,234.56) and currency symbol placement for free — no need
// for a bespoke formatter or a new dependency.

export function formatPrice(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown/unsupported currency code — degrade to plain grouped digits
    // rather than throwing and blanking the whole price out.
    return `${new Intl.NumberFormat(locale).format(amount)} ${currency}`;
  }
}

export function formatSqm(value: number, locale: string): string {
  return `${new Intl.NumberFormat(locale).format(value)} m²`;
}
