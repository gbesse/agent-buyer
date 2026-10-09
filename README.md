# Agent Buyer

Français · [English](README.en.md) · [Español](README.es.md)

Extension MCP locale pour comparer des catalogues marchands depuis un agent. Elle lance chaque serveur MCP configuré, lit `catalog_list`, calcule les montants en centimes et prépare une intention de devis. Elle ne crée ni devis ni commande. Une intention ne vaut pas approbation : le prix, le stock et les droits doivent être revérifiés avant toute écriture.

## Essayer

```sh
npm test
node src/cli.js compare fixtures/profile.json SKU-1 2
node src/cli.js prepare fixtures/profile.json SKU-1 2 beta
node src/cli.js serve fixtures/profile.json
```

Dans OpenClaw ou Hermes, ajouter le dernier appel comme serveur MCP stdio. Le dossier `skills/buyer` contient la compétence agent dans les trois langues. Le profil est un fichier de confiance : ses commandes sont exécutées localement sans shell. Ne placez pas d'identifiants dans un profil publié ; utilisez l'environnement privé du serveur marchand.

Pour incwo, il faut encore adapter les noms d'outils et la forme du catalogue du MCP public réel. Le profil fourni est fictif et aucun compte incwo n'a été testé. Le dépôt [MCP Merchant Conformance](https://github.com/gbesse/mcp-merchant-conformance) teste le vendeur ; Agent Buyer traite la comparaison côté acheteur. Node.js 22+, licence MIT.

Le paquet contient `plugin.json` et `mcp.json` au format Agent Plugins. Lors d’une installation locale compatible, placez dans `${PLUGIN_DATA}` le fichier attendu par `mcp.json` et tous les fichiers qu’il référence, puis remplacez les données fictives par vos données privées. La publication dans le répertoire public ChatGPT exige un MCP HTTPS hébergé : cette version stdio locale n’y est pas soumise. OCE et Muse ne sont pas testés.

La comparaison porte uniquement sur les lignes du catalogue, dans la même devise et avec la même base de taxe (`excl_tax` ou `incl_tax`). Elle ne vérifie ni l’équivalence des produits, ni les frais de port, remises ou conditions contractuelles.
