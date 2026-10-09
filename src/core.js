import { createHash } from "node:crypto";

export function cents(value) {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error("invalid_price");
  const [whole, fraction = ""] = value.split(".");
  const n = BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
  if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("price_overflow");
  return Number(n);
}

export function compare(sku, quantity, observations) {
  if (
    typeof sku !== "string" ||
    !sku.trim() ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 100000
  )
    throw new Error("invalid_request");
  const offers = observations.map(({ merchant, data, error }) => {
    if (error) return { merchant, status: "unavailable", reason: error };
    const product = data?.products?.find((p) => p.sku === sku);
    if (!product) return { merchant, status: "missing" };
    try {
      const unitCents = cents(product.price);
      const currency = product.currency;
      if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency))
        throw new Error("invalid_currency");
      const priceBasis = product.price_basis;
      if (!["excl_tax", "incl_tax"].includes(priceBasis))
        throw new Error("price_basis_missing");
      const available =
        Number.isSafeInteger(product.available_quantity) &&
        product.available_quantity >= 0
          ? product.available_quantity
          : null;
      if (available !== null && available < quantity)
        return {
          merchant,
          status: "insufficient_stock",
          available_quantity: available,
        };
      const total = unitCents * quantity;
      if (!Number.isSafeInteger(total)) throw new Error("price_overflow");
      return {
        merchant,
        status: "available",
        sku,
        quantity,
        unit_cents: unitCents,
        total_cents: total,
        currency,
        price_basis: priceBasis,
        available_quantity: available,
        source_tool: "catalog_list",
      };
    } catch (e) {
      return { merchant, status: "invalid_catalog", reason: e.message };
    }
  });
  const bases = [
    ...new Set(
      offers
        .filter((o) => o.status === "available")
        .map((o) => o.currency + ":" + o.price_basis),
    ),
  ];
  const comparable = bases.length <= 1;
  if (comparable)
    offers.sort(
      (a, b) =>
        (a.status === "available" ? 0 : 1) -
          (b.status === "available" ? 0 : 1) ||
        (a.status === "available" && b.status === "available"
          ? a.total_cents - b.total_cents
          : 0) ||
        a.merchant.localeCompare(b.merchant),
    );
  return { sku, quantity, comparable, offers };
}

export function prepareQuote(report, merchant) {
  const offer = report.offers.find(
    (o) => o.merchant === merchant && o.status === "available",
  );
  if (!offer) throw new Error("offer_unavailable");
  const intent = {
    merchant,
    sku: report.sku,
    quantity: report.quantity,
    total_cents: offer.total_cents,
    currency: offer.currency,
    observed_at: new Date().toISOString(),
  };
  return {
    status: "draft",
    intent,
    digest: createHash("sha256").update(JSON.stringify(intent)).digest("hex"),
    warning: "price_stock_and_authorization_must_be_rechecked_before_order",
  };
}
