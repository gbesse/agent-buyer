import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";

test("MCP initialize, tools/list and tool call", async () => {
  const child = spawn(
    process.execPath,
    ["src/cli.js", "serve", "fixtures/profile.json"],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
  let output = "";
  let errors = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (errors += chunk));
  const requests = [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "smoke", version: "1" },
      },
    },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "compare_offers",
        arguments: { sku: "SKU-1", quantity: 2 },
      },
    },
  ];
  child.stdin.end(requests.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("timeout"));
    }, 8000);
    child.on("close", (c) => {
      clearTimeout(timer);
      resolve(c);
    });
  });
  assert.equal(code, 0, errors);
  const messages = output.trim().split("\n").map(JSON.parse);
  assert.equal(messages.length, 3, output);
  assert.equal(messages[1].result.tools[0].annotations.readOnlyHint, true);
  assert.ok(JSON.parse(messages[2].result.content[0].text).offers);
});

test("usage is localized in FR, EN and ES", () => {
  for (const [lang, word] of [
    ["fr_FR", "Usage"],
    ["en_US", "Usage"],
    ["es_ES", "Uso"],
  ]) {
    const r = spawnSync(process.execPath, ["src/cli.js"], {
      encoding: "utf8",
      env: { ...process.env, LANG: lang },
    });
    assert.equal(r.status, 2);
    assert.ok(r.stderr.includes(word));
  }
});
