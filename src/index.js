import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Client } from "./client.js";
import { compare, prepareQuote } from "./core.js";

export async function loadProfile(path) {
  const file = resolve(path);
  const profile = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(profile.merchants) || !profile.merchants.length)
    throw new Error("invalid_profile");
  const ids = new Set();
  for (const m of profile.merchants) {
    if (
      !m.id ||
      ids.has(m.id) ||
      !Array.isArray(m.command) ||
      !m.command.length
    )
      throw new Error("invalid_merchant");
    ids.add(m.id);
  }
  return { ...profile, cwd: dirname(file) };
}
export async function compareLive(profile, sku, quantity) {
  const observations = await Promise.all(
    profile.merchants.map(async (m) => {
      const client = new Client(m.command, profile.cwd, m.env);
      try {
        const inventory = await client.init();
        const tool = m.catalog_tool || "catalog_list";
        if (!inventory.tools?.some((t) => t.name === tool))
          throw new Error("tool_missing");
        return { merchant: m.id, data: await client.catalog(tool) };
      } catch (e) {
        return { merchant: m.id, error: e.message };
      } finally {
        client.close();
      }
    }),
  );
  return compare(sku, quantity, observations);
}
export async function handle(profile, tool, args) {
  if (tool === "compare_offers")
    return compareLive(profile, args.sku, args.quantity);
  if (tool === "prepare_quote")
    return prepareQuote(
      await compareLive(profile, args.sku, args.quantity),
      args.merchant,
    );
  throw new Error("unknown_tool");
}
