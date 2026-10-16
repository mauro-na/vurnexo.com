# vurnexo-web

Sitio de la marca **Vurnexo** (`vurnexo.com`): portada con el catálogo de productos, una página por producto, aviso legal y botón de arrepentimiento.

Es un sitio estático. Lo sirve el Caddy del VPS (repo `bot-ofertas`) desde `/opt/vurnexo-web/public`.

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
cd /opt/vurnexo-web && git pull
```
No hace falta reiniciar nada: Caddy sirve los archivos nuevos al instante.
