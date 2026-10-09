#!/usr/bin/env node
import { createInterface } from "node:readline";
import { loadProfile, handle } from "./index.js";
const [mode, profilePath, sku, quantity, merchant] = process.argv.slice(2);
const messages = {
  fr: {
    bad: "Paramètres invalides",
    fail: "Échec du contrôle",
    usage:
      "Usage : agent-buyer compare|prepare|serve profil.json référence quantité [vendeur]",
  },
  en: {
    bad: "Invalid arguments",
    fail: "Check failed",
    usage:
      "Usage: agent-buyer compare|prepare|serve profile.json sku quantity [merchant]",
  },
  es: {
    bad: "Argumentos no válidos",
    fail: "Error de comprobación",
    usage:
      "Uso: agent-buyer compare|prepare|serve perfil.json referencia cantidad [vendedor]",
  },
};
const lang = ["fr", "en", "es"].includes(process.env.LANG?.slice(0, 2))
  ? process.env.LANG.slice(0, 2)
  : "en";
if (!["compare", "prepare", "serve"].includes(mode) || !profilePath) {
  process.stderr.write(messages[lang].usage + "\n");
  process.exit(2);
}
try {
  const profile = await loadProfile(profilePath);
  if (mode === "serve") {
    const tools = [
      {
        name: "compare_offers",
        description:
          "Comparer les offres en lecture seule / Compare offers read-only / Comparar ofertas en modo lectura",
        inputSchema: {
          type: "object",
          properties: {
            sku: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
          required: ["sku", "quantity"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      {
        name: "prepare_quote",
        description:
          "Préparer une intention sans commande / Prepare intent without ordering / Preparar intención sin pedido",
        inputSchema: {
          type: "object",
          properties: {
            sku: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
            merchant: { type: "string" },
          },
          required: ["sku", "quantity", "merchant"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
    ];
    for await (const line of createInterface({ input: process.stdin })) {
      let req;
      try {
        req = JSON.parse(line);
      } catch {
        continue;
      }
      if (req.id === undefined) continue;
      try {
        let result;
        if (req.method === "initialize")
          result = {
            protocolVersion: "2025-06-18",
            capabilities: { tools: {} },
            serverInfo: { name: "agent-buyer", version: "0.1.0" },
          };
        else if (req.method === "tools/list") result = { tools };
        else if (req.method === "tools/call")
          result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  await handle(
                    profile,
                    req.params?.name,
                    req.params?.arguments || {},
                  ),
                ),
              },
            ],
          };
        else throw new Error("unknown_method");
        process.stdout.write(
          JSON.stringify({ jsonrpc: "2.0", id: req.id, result }) + "\n",
        );
      } catch (e) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: req.id,
            error: { code: -32000, message: e.message },
          }) + "\n",
        );
      }
    }
  } else {
    if (
      !sku ||
      !Number.isSafeInteger(Number(quantity)) ||
      Number(quantity) < 1 ||
      (mode === "prepare" && !merchant)
    )
      throw new Error(messages[lang].bad);
    const result = await handle(
      profile,
      mode === "compare" ? "compare_offers" : "prepare_quote",
      { sku, quantity: Number(quantity), merchant },
    );
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }
} catch (e) {
  process.stderr.write(`${messages[lang].fail}: ${e.message}\n`);
  process.exit(2);
}
