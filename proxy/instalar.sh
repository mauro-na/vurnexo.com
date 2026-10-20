#!/bin/sh
# Mueve Caddy de /opt/bot-ofertas al proxy común de Vurnexo (/opt/vurnexo-web/proxy).
# Se corre UNA vez, desde /opt/vurnexo-web, después de git pull:
#   cd /opt/vurnexo-web && git pull && sh proxy/instalar.sh
# Se puede repetir sin riesgo: si algo ya está hecho, lo saltea.
set -eu

WEB_DIR=$(cd "$(dirname "$0")/.." && pwd)
BOT_DIR=${BOT_DIR:-/opt/bot-ofertas}
NET=vurnexo-proxy
OLD_CERTS=bot-ofertas_caddy_data
NEW_CERTS=vurnexo-proxy_caddy_data

paso() { printf '\n==> %s\n' "$1"; }

paso "Red compartida $NET"
docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET"

paso "Copiar los certificados HTTPS actuales (así no hay que pedirlos de nuevo)"
if docker volume inspect "$OLD_CERTS" >/dev/null 2>&1 && ! docker volume inspect "$NEW_CERTS" >/dev/null 2>&1; then
  docker volume create "$NEW_CERTS" >/dev/null
  docker run --rm -v "$OLD_CERTS":/desde:ro -v "$NEW_CERTS":/hacia alpine cp -a /desde/. /hacia/
  echo "Certificados copiados."
else
  echo "Nada que copiar."
fi

paso "Actualizar Radar de Vuelos ($BOT_DIR) y compilar antes de cortar nada"
git -C "$BOT_DIR" pull --ff-only
(cd "$BOT_DIR" && docker compose build)

paso "Reiniciar Radar de Vuelos sin su Caddy viejo"
(cd "$BOT_DIR" && docker compose up -d --remove-orphans)
docker rm -f caddy >/dev/null 2>&1 || true

paso "Levantar el proxy común"
(cd "$WEB_DIR/proxy" && docker compose up -d)

paso "Comprobar"
ok=0
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null --resolve vurnexo.com:443:127.0.0.1 https://vurnexo.com/ \
     && curl -fsS -o /dev/null --resolve ofertas.vurnexo.com:443:127.0.0.1 https://ofertas.vurnexo.com/salud; then
    ok=1; break
  fi
  sleep 2
done

if [ "$ok" = 1 ]; then
  echo "Listo: vurnexo.com y ofertas.vurnexo.com responden a través del proxy común."
else
  echo "ATENCIÓN: todavía no responden. Revisá los registros con:"
  echo "  docker logs --tail 50 vurnexo-proxy"
  echo "  docker logs --tail 50 bot-ofertas"
  exit 1
fi
