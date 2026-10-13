#!/usr/bin/env bash
# Zet de juridische teksten (Markdown) om naar HTML voor de site.
# Bron: src/content/juridisch/*.md. Vereist pandoc. Draai na elke tekstwijziging.
set -euo pipefail
cd "$(dirname "$0")/../src/content/juridisch"
for naam in privacy voorwaarden; do
  # De h1 rendert de pagina zelf; die halen we hier weg.
  html=$(pandoc -f markdown -t html --wrap=none "$naam.md")
  node -e 'const fs=require("fs");const [n,h]=process.argv.slice(1);const body=h.replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/,"");fs.writeFileSync(n+".html.ts","// Gegenereerd door scripts/juridisch.sh uit "+n+".md. Niet handmatig aanpassen.\nconst html = "+JSON.stringify(body)+";\nexport default html;\n")' "$naam" "$html"
done
