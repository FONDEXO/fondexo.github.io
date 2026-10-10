/* =========================================================
   FONDEXO · funciones comunes a todas las páginas
   Menú del celular, modo claro/oscuro, año del pie,
   animaciones al bajar y contadores de cifras.
   ========================================================= */
(function () {
  const raiz = document.documentElement;
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Las animaciones de "aparecer al bajar" solo se activan si este archivo cargó.
  // Si no carga, todo el contenido se ve normal.
  raiz.classList.add('js');

  /* ---------- Menú del celular ---------- */
  const btnMenu = document.getElementById('btn-menu');
  const menu = document.getElementById('menu');
  if (btnMenu && menu) {
    btnMenu.addEventListener('click', () => {
      const abierto = menu.classList.toggle('abierto');
      btnMenu.setAttribute('aria-expanded', abierto);
      btnMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });
  }

  /* ---------- Modo claro / oscuro ---------- */
  const btnTema = document.getElementById('btn-tema');
  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const actual = raiz.getAttribute('data-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const nuevo = actual === 'dark' ? 'light' : 'dark';
      raiz.setAttribute('data-theme', nuevo);
      try { localStorage.setItem('fondexo-tema', nuevo); } catch (e) {}
      document.dispatchEvent(new Event('cambio-tema'));
    });
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => document.dispatchEvent(new Event('cambio-tema')));

  /* ---------- Año del pie ---------- */
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* ---------- Aparecer al bajar ---------- */
  const revelar = document.querySelectorAll('.revelar');
  if (reducirMovimiento || !('IntersectionObserver' in window)) {
    revelar.forEach((el) => el.classList.add('visible'));
  } else {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observador.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revelar.forEach((el) => observador.observe(el));

    // Respaldo: si alguien desliza muy rápido, muestra todo lo que ya está en pantalla o más arriba
    let pendiente = false;
    const revisar = () => {
      pendiente = false;
      revelar.forEach((el) => {
        if (!el.classList.contains('visible') && el.getBoundingClientRect().top < innerHeight * 0.95) {
          el.classList.add('visible'); observador.unobserve(el);
        }
      });
    };
    addEventListener('scroll', () => { if (!pendiente) { pendiente = true; setTimeout(revisar, 80); } }, { passive: true });
    addEventListener('load', revisar);
    setTimeout(revisar, 1500);
  }

  /* ---------- Contadores (las cifras suben desde 0) ---------- */
  document.querySelectorAll('[data-contar]').forEach((el) => {
    const final = Number(el.dataset.contar);
    if (reducirMovimiento || !('IntersectionObserver' in window)) return; // se queda con la cifra final
    el.textContent = '0';
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const inicio = performance.now(), duracion = 1300;
      const paso = (t) => {
        const p = Math.min(1, (t - inicio) / duracion);
        const suave = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(final * suave).toLocaleString('es-CO');
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }, { threshold: 0.6 });
    obs.observe(el);
  });
})();
