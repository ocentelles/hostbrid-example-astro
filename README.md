# Cuaderno orbital · ejemplo original Astro estático

Un sitio editorial mínimo: portada, nota en Markdown, ilustración SVG original y CSS propio. Código, texto e ilustración originales bajo MIT. Sin backend, cuenta, pago, base de datos, formulario ni dependencia de servicios externos. No utiliza componentes ni contenido de las demos HTML/React existentes.

## Reproducir

Node **22.23.3** (`.nvmrc` y `.node-version`), npm >=9.6.5. Astro **7.3.7** fijado y `package-lock.json` incluido. Astro requiere Node >=22.12.0 y no admite versiones impares según [su instalación oficial](https://docs.astro.build/en/install-and-setup/).

```sh
npm ci
npm run build
```

Salida: `dist/index.html`, `dist/notas/primera-noche/index.html`, CSS compilado e incluido en los dos HTML e imagen `dist/orbital.svg`. Se publican los archivos de **dist**, no el código fuente. `npm run dev` y `npm run preview` son herramientas locales.

## Preset Hostbrid comprobado el 8 de octubre de 2026

API pública `/api/projects/v1/frameworks/`: clave `astro`, instalar `npm ci`, construir `npm run build`, salida `dist`, imagen `node22`; 17 presets en esa respuesta. Si se publica este directorio dentro del monorepo, raíz `examples/ai-astro`; si se extrae como repositorio independiente, raíz vacía. No se ha creado un repositorio remoto ni un proyecto Hostbrid durante este preflight.

## Contenido y SEO

`src/pages/notas/primera-noche.md` tiene frontmatter de título/descripción y layout compartido. La portada descubre las notas con `import.meta.glob` en build. Cada ruta genera HTML independiente con title, descripción, canonical y Open Graph, sin JavaScript del navegador. La imagen es una ilustración, no un mapa astronómico.

Antes de publicar, establece la URL pública real del sitio y vuelve a compilar:

```sh
PUBLIC_SITE_URL=https://tu-sitio.example npm run build
```

`PUBLIC_SITE_URL` es un origen público de build, nunca una clave. Si no se define, se usa `https://example.invalid` y las páginas tienen `noindex`; ese build sirve para preflight, **no para indexar una demo pública**. Si el constructor no permite variables, cambia explícitamente `site` en `astro.config.mjs` por la URL final. Este ejemplo está pensado para la raíz de un dominio; una publicación bajo subcarpeta necesita adaptar `base` y los enlaces/assets, y volver a probarlos.

## Comprobar lo construido

```sh
node scripts/verify-static.mjs
```

Necesita Chrome instalado; `CHROME_BIN` permite indicar su ejecutable. El script sirve sólo `dist` en localhost, sin fallback SPA; Chrome verifica `/` y `/notas/primera-noche/` a 390/1280 px, enlaces, imagen, CSS, metadata estática, ausencia de overflow y tres 404 negativos. Cuenta POST y exige cero. Capturas y JSON se guardan en `/tmp/hostbrid-astro-preflight` (cambiable con `ASTRO_PREFLIGHT_ARTIFACTS`). No prueba producción ni autenticación.

## Estático y SSR son contratos distintos

`output: 'static'` y sin adaptador: el ejemplo produce archivos y no necesita Node en producción. No lleva `.hostbrid-spa`, porque la nota ya tiene su propio HTML. No añadir un fallback a la portada que convierta URLs inexistentes en 200. SSR, rutas sin prerender, sessions/actions o endpoints vivos requieren adaptador y runtime; este preflight **no demuestra soporte de Astro SSR en Hostbrid**. Consulta [output](https://docs.astro.build/en/reference/configuration-reference/#output) y [despliegue](https://docs.astro.build/en/guides/deploy/).
