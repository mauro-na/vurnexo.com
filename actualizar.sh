#!/bin/sh
# Publica los cambios del sitio y del proxy común:
#   /opt/vurnexo-web/actualizar.sh
# El sitio se ve al instante; si cambió el Caddyfile, Caddy lo recarga sin cortar.
# Si el Caddyfile nuevo tiene un error, Caddy lo rechaza y sigue con el anterior.
set -eu
cd "$(dirname "$0")"
git pull --ff-only
if docker ps --format '{{.Names}}' | grep -qx vurnexo-proxy; then
  docker exec vurnexo-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  echo "Sitio y proxy actualizados."
else
  echo "Sitio actualizado. (El proxy común no está corriendo: ver proxy/instalar.sh)"
fi
