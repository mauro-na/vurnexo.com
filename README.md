# vurnexo.com

Sitio de la marca **Vurnexo** (`vurnexo.com`): portada con el catálogo de productos, una página por producto, aviso legal y botón de arrepentimiento.

Es un sitio estático. Lo sirve el **proxy común de Vurnexo** (carpeta `proxy/` de este repo), el único Caddy del VPS, que además reparte cada subdominio a su producto.

Primera vez en el VPS: `git clone https://github.com/mauro-na/vurnexo.com.git /opt/vurnexo-web`

## Editar

- **Datos** (precios, links de pago de Hotmart, ciudades, datos legales): `site.json`.
- **Páginas**: `src/*.html` · partes comunes en `src/partials/` · estilos en `assets/style.css`.
- **Generar**: `node build.mjs` → escribe `public/` (se sube al repo; el servidor no necesita Node).

Marcas que entiende `build.mjs` dentro de las páginas:

| Marca | Qué hace |
|---|---|
| `{{radar.prices.monthly}}` | Valor de `site.json` |
| `<!-- include:footer -->` | Inserta `src/partials/footer.html` |
| `<!-- if:radar.founderActive -->…<!-- endif:radar.founderActive -->` | Solo si el dato es verdadero (`ifnot` / `endifnot` para el caso contrario) |
| `<!-- cities:radar -->` | Lista de ciudades del producto |

Cuando termine la promo fundador: `"founderActive": false` en `site.json`, `node build.mjs`, commit y push.

## Agregar un producto

1. Copiá `src/radar-de-vuelos.html` como `src/nuevo-producto.html` y adaptalo (si necesita colores propios, agregá una clase `.p-nuevo` en `assets/style.css`).
2. Sumá sus datos a `site.json` y una fila en el catálogo de `src/index.html`.
3. Agregá el link a sus términos en `src/partials/footer.html` y la página a `sitemap.xml` en `build.mjs`.

## Publicar en el VPS

```
/opt/vurnexo-web/actualizar.sh
```
Trae los cambios y, si cambió el `Caddyfile`, Caddy lo recarga sin cortar (si tiene un error, lo rechaza y sigue con el anterior). Los cambios del sitio se ven al instante.

## Proxy común (`proxy/`)

Un solo Caddy para todo el VPS: abre los puertos 80 y 443, saca los certificados HTTPS, sirve `public/` y manda cada subdominio al servicio web de su producto.

| Pieza | Qué es |
|---|---|
| `proxy/docker-compose.yml` | Contenedor `vurnexo-proxy` |
| `proxy/Caddyfile` | Un bloque por dominio |
| `proxy/instalar.sh` | Instalación inicial (mueve el Caddy que antes vivía en `bot-ofertas`) |
| Red de Docker `vurnexo-proxy` | Compartida: cada producto conecta acá **solo** su servicio web |

**Instalación (una sola vez):** `cd /opt/vurnexo-web && git pull && sh proxy/instalar.sh`. Crea la red, copia los certificados actuales, actualiza Radar de Vuelos y levanta el proxy.

**Sumar un producto:**
1. En su `docker-compose.yml`, conectar su servicio web a la red `vurnexo-proxy` (declarada como `external: true`), con un `container_name` propio y sin `ports`.
2. En `proxy/Caddyfile`, copiar el bloque de Radar de Vuelos con su subdominio, su página de ventas y su `contenedor:puerto`.
3. Commit, push y en el VPS `/opt/vurnexo-web/actualizar.sh`.
