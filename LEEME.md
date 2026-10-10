# Web de FONDEXO: guía rápida

## Qué es cada archivo

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Todos los textos de la página |
| `estilos.css` | Colores, tipografías y diseño |
| `comparador.js` | La calculadora CDT vs. cartera. **Los supuestos están arriba, en `CONFIG`** |
| `imagen-compartir.png` | Imagen que sale al compartir el enlace por WhatsApp o Instagram |
| `CNAME.ejemplo` | Para conectar tu dominio propio más adelante (ver abajo) |

Para editar un archivo directamente en GitHub: ábrelo en tu repositorio, haz clic en el **lápiz** (✏️ "Edit this file"), haz el cambio y pulsa **Commit changes**. En 1 o 2 minutos la web se actualiza sola.

## Cambiar textos

Abre `index.html` y busca la frase con **Ctrl + F**. Cambia solo el texto que está entre las etiquetas, por ejemplo:

```html
<h3>Solo gano si tú ganas</h3>
```

Cada sección está marcada con un comentario como `<!-- ===== 4. POR QUÉ FONDEXO ===== -->`.

## Cambiar la tasa del CDT y los supuestos del comparador

Abre `comparador.js`. Todo está en el bloque `CONFIG` del inicio:

- **Tasa del CDT por defecto:** `tasaCDT: 11` dentro de `valoresIniciales`.
- **Rango permitido de la tasa:** `tasaCDT: { min: 5, max: 15, ... }`.
- **Nota de las tasas del mercado:** `notaCDT: '...'`. Actualízala cuando cambien las tasas.
- **Retención por defecto:** `retencion: 4`.
- **Perfiles:** cada uno tiene `promedio: [mínimo, máximo]`, `bueno` y `malo`. Por ejemplo:
  `equilibrado: { nombre: 'Equilibrado', promedio: [6, 8], bueno: [15, 22], malo: [-22, -28] }`
- **Textos de "Lo que tienes que saber":** la lista `loQueTienesQueSaber`.

Escribe los porcentajes como números normales (11 = 11%) y usa **punto** para decimales (13.5, no 13,5). No borres las comas ni las comillas.

### Cómo calcula
- **CDT:** tasa E.A. × (1 − retención) = tasa neta en pesos. Se pasa a dólares así: (1 + tasa neta) ÷ (1 + devaluación) − 1.
- **Cartera:** escenario pesimista = extremo bajo del "año promedio", medio = punto medio, optimista = extremo alto.
- **Línea "con un año malo":** aplica el punto medio del rango "malo" en el año 2 y después el promedio.
- **Todo** se calcula con interés compuesto mensual, y los aportes se suman al final de cada mes.
- **En pesos:** cada valor en dólares se multiplica por la TRM que escribe el visitante, proyectada con la devaluación elegida.

## Cambiar el enlace del cuestionario o el WhatsApp

En `index.html`, usa **Ctrl + H** (reemplazar) para cambiar todas las veces:
- `https://claude.ai/artifact/ASpzH1uYoMm1E4fBkif9DN` (cuestionario)
- `573054318622` (número de WhatsApp)

## Volver a publicar

**Opción A (cambios pequeños):** edita en GitHub con el lápiz, como se explica arriba.

**Opción B (reemplazar archivos):** en tu repositorio haz clic en **Add file → Upload files**, arrastra los archivos nuevos (se reemplazan los que tienen el mismo nombre) y pulsa **Commit changes**.

Espera 1 o 2 minutos y recarga la página. Si no ves el cambio, recarga con **Ctrl + Shift + R**.

## Conectar un dominio propio (ej.: fondexo.co)

1. Compra el dominio (por ejemplo en Namecheap, GoDaddy o un proveedor .co).
2. En el panel DNS del proveedor crea estos registros:
   - 4 registros **A** para `@` que apunten a: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 registro **CNAME** para `www` que apunte a `jjzzapata.github.io`
3. En GitHub: **Settings → Pages → Custom domain**, escribe `fondexo.co` y guarda. Cuando aparezca disponible, activa **Enforce HTTPS**. (GitHub crea solo el archivo `CNAME`; el archivo `CNAME.ejemplo` es solo de referencia y puedes borrarlo.)
4. En `index.html`, cambia la dirección vieja por `fondexo.co` en las líneas `og:url`, `og:image` y `twitter:image`.

## Vista previa en WhatsApp

WhatsApp guarda la vista previa en memoria durante un tiempo. Si cambias la imagen y no se actualiza, comparte el enlace con algo al final, por ejemplo `?v=2`.
