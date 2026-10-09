---
name: buyer
description: Compare MCP merchant offers and prepare a quote intent.
---

## Français

Utiliser `compare_offers` avec une référence et une quantité explicites. Signaler les vendeurs indisponibles et les ruptures de stock. Ne comparer les prix que dans une même devise. `prepare_quote` produit un brouillon, jamais une autorisation d'achat. Avant tout devis ou commande réel, demander la validation de l'utilisateur et revérifier les données auprès du marchand.

## English

Use `compare_offers` with an explicit SKU and quantity. Report unavailable merchants and stock shortages. Compare prices only within one currency. `prepare_quote` produces a draft, never purchase authorization. Before a real quote or order, obtain user approval and recheck merchant data.

## Español

Usa `compare_offers` con referencia y cantidad explícitas. Informa de vendedores no disponibles y falta de existencias. Compara precios solo dentro de una misma divisa. `prepare_quote` produce un borrador, nunca una autorización de compra. Antes de un presupuesto o pedido real, solicita la aprobación del usuario y vuelve a comprobar los datos del vendedor.
