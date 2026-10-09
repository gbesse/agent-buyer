import test from "node:test";
import assert from "node:assert/strict";
import { cents, compare, prepareQuote } from "../src/core.js";
import { loadProfile, compareLive } from "../src/index.js";
test("exact cents and invalid decimals", () => {
  assert.equal(cents("12.05"), 1205);
  assert.throws(() => cents("12.005"));
});
test("ranks only available offers and never changes state", async () => {
  const p = await loadProfile("fixtures/profile.json");
  const r = await compareLive(p, "SKU-1", 2);
  assert.equal(r.offers[0].merchant, "beta");
  assert.equal(r.offers[0].total_cents, 2240);
  assert.equal(r.offers[1].total_cents, 2500);
  assert.equal(prepareQuote(r, "beta").status, "draft");
});
test("stock shortage and currencies do not mislead", () => {
  const r = compare("x", 4, [
    {
      merchant: "a",
      data: {
        products: [
          {
            sku: "x",
            price: "5.00",
            currency: "EUR",
            price_basis: "excl_tax",
            available_quantity: 2,
          },
        ],
      },
    },
    {
      merchant: "b",
      data: {
        products: [
          {
            sku: "x",
            price: "4.00",
            currency: "USD",
            price_basis: "excl_tax",
            available_quantity: 5,
          },
        ],
      },
    },
  ]);
  assert.equal(
    r.offers.find((x) => x.merchant === "a").status,
    "insufficient_stock",
  );
  assert.throws(() => prepareQuote(r, "a"));
});

test("does not rank different tax bases", () => {
  const r = compare("x", 1, [
    {
      merchant: "a",
      data: {
        products: [
          {
            sku: "x",
            price: "10.00",
            currency: "EUR",
            price_basis: "excl_tax",
          },
        ],
      },
    },
    {
      merchant: "b",
      data: {
        products: [
          {
            sku: "x",
            price: "11.00",
            currency: "EUR",
            price_basis: "incl_tax",
          },
        ],
      },
    },
  ]);
  assert.equal(r.comparable, false);
});
