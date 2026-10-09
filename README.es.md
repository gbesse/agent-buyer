# Agent Buyer

[Français](README.md) · [English](README.en.md) · Español

Extensión MCP local para comparar catálogos de vendedores desde un agente. Inicia cada servidor MCP configurado, lee `catalog_list`, calcula importes exactos en céntimos y prepara una intención de presupuesto. No crea presupuestos ni pedidos. Una intención no es una aprobación: hay que volver a comprobar precio, existencias y autorización antes de escribir.

## Probar

```sh
npm test
node src/cli.js compare fixtures/profile.json SKU-1 2
node src/cli.js prepare fixtures/profile.json SKU-1 2 beta
node src/cli.js serve fixtures/profile.json
```

En OpenClaw o Hermes, añade el último comando como servidor MCP stdio. `skills/buyer` contiene la habilidad del agente en tres idiomas. El perfil es una entrada de confianza: sus comandos se ejecutan localmente sin shell. No incluyas credenciales en perfiles publicados; usa el entorno privado del servidor vendedor.

El adaptador real de incwo aún necesita los nombres de herramientas y la estructura del catálogo de su MCP público. El perfil incluido es ficticio y no se probó ninguna cuenta incwo. [MCP Merchant Conformance](https://github.com/gbesse/mcp-merchant-conformance) prueba el vendedor; Agent Buyer compara desde el lado comprador. Node.js 22+, MIT.

El paquete incluye `plugin.json` y `mcp.json` en formato Agent Plugins. Para una instalación local compatible, coloca en `${PLUGIN_DATA}` el archivo esperado por `mcp.json` y todos los archivos que referencia; después sustituye los datos ficticios por tus datos privados. La publicación en el directorio público de ChatGPT exige un servidor MCP HTTPS alojado; esta versión stdio local no se ha enviado. OCE y Muse no se han probado.

La comparación solo cubre líneas de catálogo, en la misma divisa y con la misma base fiscal (`excl_tax` o `incl_tax`). No verifica la equivalencia de productos, el envío, los descuentos ni las condiciones contractuales.
