# Prompt para Claude Code: publicar el CHIRON Knowledge Hub en GitHub

Copia todo lo que hay debajo de la línea y pégalo en Claude Code (claude.ai/code o la app de escritorio),
con el repositorio `TU-USUARIO/chiron-knowledge-hub` conectado.

---

Publica el CHIRON Knowledge Hub en este repositorio con GitHub Pages.

Contexto:
- CHIRON es la red de docentes que enseñan con Port Virtual Lab (Escola Europea – Intermodal Transport). Web actual: https://chiron.escolaeuropea.eu
- Te adjunto `chiron-repo.zip` con la estructura final:
  - `hub/index.html`: página única autocontenida (HTML + CSS + JS). Marca PVL.ONE: navy #0b2d63, azul #164194, cyan #009fe3, ámbar #f9b233, coral #e84e1b; tipografías Big Shoulders Display + Inter.
  - `apps-script/Code.gs` y `appsscript.json`: puente Google Apps Script → Clientify. YA está desplegado; la URL `/exec` ya está en `FORM_ENDPOINT` dentro de `hub/index.html`. No cambies esa URL.
  - `assets/README.md`: lista de imágenes necesarias.
  - `README.md` y `.gitignore`.

Tareas:
1. Descomprime el zip en la raíz del repo, sin sobrescribir nada que ya exista salvo el README.
2. Descarga estas imágenes de la web actual y guárdalas en `assets/` con el mismo nombre:
   https://chiron.escolaeuropea.eu/assets/chiron-symbol.png
   https://chiron.escolaeuropea.eu/assets/lina.jpg
   https://chiron.escolaeuropea.eu/assets/marisa-clavero.jpg
   https://chiron.escolaeuropea.eu/assets/elwyn-pitt.jpg
   https://chiron.escolaeuropea.eu/assets/hilda-ghiara.jpg
   Si alguna no se puede descargar, sigue: la página muestra iniciales en su lugar.
3. Crea un `index.html` en la raíz que redirija a `hub/` (meta refresh + enlace visible).
4. Comprueba que no hay ningún secreto en el repo (busca "token", "CLIENTIFY_TOKEN" con valor, claves API). La clave de Clientify vive solo en las propiedades del Apps Script.
5. Abre `hub/index.html` en un navegador headless a 1366 px y 390 px: sin errores en consola y sin scroll horizontal.
6. Crea una rama `hub-pilot`, haz commit y abre un pull request contra `main` con un resumen de lo que incluye. No hagas merge: lo reviso yo.
7. Dime los pasos para activar GitHub Pages (Settings → Pages → Deploy from a branch → main / root) y la URL final.

No envíes formularios de prueba: cada envío crea un contacto real en Clientify.
