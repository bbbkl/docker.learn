#!/bin/bash

# zur sicherheit alle npm Pakete installieren
cd /src/vue
npm i

API_BASE=${API_BASE:-https://api.dockerbuch.info}

# Vorsicht: ändert die Datei config/index.js
sed -i "s|^const apiBaseUrl.*$|const apiBaseUrl= '$API_BASE';|" \
	  /src/vue/config/index.js

exec "$@"
