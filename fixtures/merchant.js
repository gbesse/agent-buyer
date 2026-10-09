import { createInterface } from "node:readline";
for await (const line of createInterface({ input: process.stdin })) {
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    continue;
  }
  if (req.id === undefined) continue;
  let result;
  if (req.method === "initialize")
    result = {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "fixture-merchant", version: "0.1.0" },
    };
  else if (req.method === "tools/list")
    result = {
      tools: [
        {
          name: "catalog_list",
          inputSchema: { type: "object" },
          annotations: { readOnlyHint: true },
        },
      ],
    };
  else if (req.method === "tools/call" && req.params?.name === "catalog_list")
    result = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            products: [
              {
                sku: "SKU-1",
                price: process.env.PRICE || "12.50",
                currency: "EUR",
                price_basis: "excl_tax",
                available_quantity: Number(process.env.STOCK || 10),
              },
            ],
          }),
        },
      ],
    };
  else result = { isError: true, content: [{ type: "text", text: "unknown" }] };
  process.stdout.write(
    JSON.stringify({ jsonrpc: "2.0", id: req.id, result }) + "\n",
  );
}
