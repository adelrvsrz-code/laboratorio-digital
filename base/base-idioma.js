/* Base compartida del laboratorio: enlace de cambio de idioma y aviso.
   El build deja en la página <p class="idioma"> con un enlace por cada otro idioma (hreflang, data-largo, data-cerrar).
   Si no lo hay (HTML suelto), este archivo no hace nada.
   - El enlace lleva a la misma vista: toma el hash de la página en el momento de usarlo.
   - No se redirige a nadie. Si el idioma preferido no es el de la página, el enlace se convierte en un aviso
     discreto, escrito en el idioma de destino, que se puede cerrar.
   - Idioma preferido: el último que se eligió (localStorage, clave lab:idioma, común a todo el laboratorio); si no hay,
     español para quien lo declara en el navegador en cualquier posición (también catalán, gallego o euskera) e inglés
     para los demás. */
(function () {
'use strict';
const links = [...document.querySelectorAll('.idioma a[hreflang]')];
if (!links.length) return;
const here = document.documentElement.lang, KEY = 'lab:idioma';
const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

for (const a of links) {
  const sync = () => { a.hash = location.hash; };
  for (const ev of ['pointerdown', 'focus', 'click', 'auxclick', 'contextmenu']) a.addEventListener(ev, sync);
  a.addEventListener('click', () => set(a.hreflang));
}

const declared = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
const wants = get() || (declared.some(l => /^(es|ca|gl|eu)(-|$)/i.test(l)) ? 'es' : 'en');
const a = wants !== here && links.find(l => l.hreflang === wants);
if (!a) return;

const p = a.closest('.idioma'), short = a.textContent;
const x = document.createElement('button');
x.type = 'button'; x.className = 'idioma-x'; x.lang = wants; x.textContent = '×';
x.setAttribute('aria-label', a.dataset.cerrar);
x.addEventListener('click', () => { set(here); p.classList.remove('aviso'); a.textContent = short; x.remove(); });
p.classList.add('aviso'); a.textContent = a.dataset.largo; p.appendChild(x);
})();
