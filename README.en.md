# Agent Buyer

[Français](README.md) · English · [Español](README.es.md)

A local MCP extension for agents to compare merchant catalogs. It starts each configured MCP server, reads `catalog_list`, calculates exact cent amounts, and prepares a quote intent. It creates no quote or order. An intent is not approval: price, stock, and authorization must be checked again before any write.

## Try it

```sh
npm test
node src/cli.js compare fixtures/profile.json SKU-1 2
node src/cli.js prepare fixtures/profile.json SKU-1 2 beta
node src/cli.js serve fixtures/profile.json
```

In OpenClaw or Hermes, add the last command as a stdio MCP server. `skills/buyer` contains the agent skill in three languages. The profile is trusted input: its commands execute locally without a shell. Keep credentials out of published profiles; use the merchant server's private environment.

A real incwo adapter still needs the public MCP's actual tool names and catalog shape. The included profile is synthetic; no incwo account was tested. [MCP Merchant Conformance](https://github.com/gbesse/mcp-merchant-conformance) tests the seller; Agent Buyer handles buyer-side comparison. Node.js 22+, MIT.

The package includes Agent Plugins `plugin.json` and `mcp.json`. For a compatible local installation, place the file expected by `mcp.json` and every file it references in `${PLUGIN_DATA}`, then replace synthetic data with your private data. Public ChatGPT directory submission requires a hosted HTTPS MCP server; this local stdio version has not been submitted. OCE and Muse have not been tested.

Comparison covers catalog lines only, in the same currency and with the same tax basis (`excl_tax` or `incl_tax`). It does not verify product equivalence, shipping, discounts, or contract terms.
