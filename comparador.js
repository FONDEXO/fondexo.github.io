/* =========================================================
   FONDEXO · comparador CDT vs. cartera global
   ---------------------------------------------------------
   TODOS LOS SUPUESTOS ESTÁN EN ESTE BLOQUE "CONFIG".
   Para cambiar una tasa o un rango, cambia el número aquí y
   vuelve a publicar. No hace falta tocar nada más abajo.
   Los porcentajes se escriben como números: 11 significa 11 %.
   ========================================================= */
const CONFIG = {
  // Valores con los que arranca la calculadora
  valoresIniciales: {
    monto: 600,          // USD
    aporteMensual: 0,    // USD
    plazoAnios: 5,
    tasaCDT: 11,         // % efectivo anual
    retencion: 4,        // % sobre los intereses del CDT
    devaluacion: 0,      // % anual del peso frente al dólar
    perfil: 'equilibrado'
  },

  montoMinimo: 600,                                    // USD
  plazo: { min: 1, max: 20 },                          // años
  tasaCDT: { min: 5, max: 15, paso: 0.1 },             // % E.A.
  devaluacion: { min: -5, max: 10, paso: 0.5 },        // % anual

  notaCDT: 'En septiembre de 2026 los CDT en Colombia pagaban entre 9% y 13,5% E.A. Revisa la tasa actual de tu banco.',

  // Rentabilidad anual en dólares de cada perfil: [mínimo, máximo]
  // promedio[0] = escenario pesimista, punto medio = escenario medio, promedio[1] = escenario optimista
  // En la línea "con un año malo" se usa el punto medio del rango "malo".
  perfiles: {
    equilibrado: { nombre: 'Equilibrado', promedio: [6, 8],  bueno: [15, 22], malo: [-22, -28] },
    crecimiento: { nombre: 'Crecimiento', promedio: [7, 9],  bueno: [20, 28], malo: [-28, -35] },
    agresivo:    { nombre: 'Agresivo',    promedio: [8, 10], bueno: [25, 35], malo: [-35, -45] }
  },

  anioDelAnioMalo: 2,            // en qué año ocurre la caída de la línea "con un año malo"

  plazoMinimoRecomendado: 3,     // años
  plazoIdeal: 5,                 // años
  avisoPlazoCorto: 'Con menos de 3 años, un CDT probablemente es mejor opción para ti.',

  // Textos del recuadro "Lo que tienes que saber"
  loQueTienesQueSaber: [
    '<strong>El CDT es seguro y su resultado está garantizado; la cartera no.</strong>',
    'Desde 1987, el índice mundial MSCI ACWI promedió cerca de 8,45% al año en dólares, con años muy negativos.',
    'Probabilidad histórica de perder dinero en una cartera global: aproximadamente <strong>25% a 1 año, 10% a 5 años y 6% a 10 años</strong>. Por eso FONDEXO recomienda mínimo 3 años, ideal 5.'
  ]
};

/* =========================================================
   De aquí para abajo está el funcionamiento.
   No necesitas tocarlo para cambiar supuestos.
   ========================================================= */

/* ---------- Menú, modo oscuro y año del pie ---------- */
(function interfaz() {
  const btnMenu = document.getElementById('btn-menu');
  const menu = document.getElementById('menu');
  btnMenu.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    btnMenu.setAttribute('aria-expanded', abierto);
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') { menu.classList.remove('abierto'); btnMenu.setAttribute('aria-expanded', 'false'); }
  });

  document.getElementById('btn-tema').addEventListener('click', () => {
    const raiz = document.documentElement;
    const actual = raiz.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nuevo = actual === 'dark' ? 'light' : 'dark';
    raiz.setAttribute('data-theme', nuevo);
    try { localStorage.setItem('fondexo-tema', nuevo); } catch (e) {}
    document.dispatchEvent(new Event('cambio-tema'));
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => document.dispatchEvent(new Event('cambio-tema')));

  document.getElementById('anio').textContent = new Date().getFullYear();
})();

/* ---------- Cálculos ---------- */

// Convierte una tasa anual (0.07) en su equivalente mensual compuesto
function tasaMensual(tasaAnual) {
  return Math.pow(1 + tasaAnual, 1 / 12) - 1;
}

// Simula mes a mes. tasaDelAnio(n) devuelve la tasa anual del año n (1, 2, 3…).
// El aporte mensual se suma al final de cada mes. Devuelve el valor de cada mes (0 = hoy).
function simular(monto, aporte, meses, tasaDelAnio) {
  const valores = [monto];
  let v = monto;
  for (let m = 1; m <= meses; m++) {
    const anio = Math.ceil(m / 12);
    v = v * (1 + tasaMensual(tasaDelAnio(anio))) + aporte;
    valores.push(v);
  }
  return valores;
}

function calcular(d) {
  const p = CONFIG.perfiles[d.perfil];
  const meses = d.plazo * 12;
  const prom = p.promedio.map((x) => x / 100);
  const rMedio = (prom[0] + prom[1]) / 2;
  const rMalo = ((p.malo[0] + p.malo[1]) / 2) / 100;
  const anioMalo = Math.min(CONFIG.anioDelAnioMalo, d.plazo);

  // CDT: tasa neta en pesos después de retención, luego pasada a dólares con la devaluación
  const rCDTpesos = (d.tasaCDT / 100) * (1 - d.retencion / 100);
  const dev = d.devaluacion / 100;
  const rCDTdolares = (1 + rCDTpesos) / (1 + dev) - 1;

  const series = {
    cdt: simular(d.monto, d.aporte, meses, () => rCDTdolares),
    pesimista: simular(d.monto, d.aporte, meses, () => prom[0]),
    medio: simular(d.monto, d.aporte, meses, () => rMedio),
    optimista: simular(d.monto, d.aporte, meses, () => prom[1]),
    malo: simular(d.monto, d.aporte, meses, (a) => (a === anioMalo ? rMalo : rMedio))
  };

  // Total aportado (en USD, y en pesos si hace falta)
  const aportado = d.monto + d.aporte * meses;

  return { series, meses, aportado, rMedio, rMalo, anioMalo, rCDTpesos, rCDTdolares, perfil: p };
}

/* ---------- Formatos ---------- */
const fmtUSD = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 });
const fmtCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const pct = (x) => fmtNum.format(x) + '%';
const pctSigno = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + fmtNum.format(Math.abs(x)) + '%';

/* ---------- Formulario ---------- */
const $ = (id) => document.getElementById(id);
const campos = {
  monto: $('monto'), aporte: $('aporte'), plazo: $('plazo'),
  tasaCDT: $('tasa-cdt'), retencion: $('retencion'), devaluacion: $('devaluacion'),
  verPesos: $('ver-pesos'), trm: $('trm')
};

(function prepararFormulario() {
  const ini = CONFIG.valoresIniciales;
  campos.monto.value = ini.monto;
  campos.aporte.value = ini.aporteMensual;
  campos.retencion.value = ini.retencion;

  for (let a = CONFIG.plazo.min; a <= CONFIG.plazo.max; a++) {
    const o = document.createElement('option');
    o.value = a; o.textContent = a + (a === 1 ? ' año' : ' años');
    campos.plazo.appendChild(o);
  }
  campos.plazo.value = ini.plazoAnios;

  Object.assign(campos.tasaCDT, { min: CONFIG.tasaCDT.min, max: CONFIG.tasaCDT.max, step: CONFIG.tasaCDT.paso, value: ini.tasaCDT });
  Object.assign(campos.devaluacion, { min: CONFIG.devaluacion.min, max: CONFIG.devaluacion.max, step: CONFIG.devaluacion.paso, value: ini.devaluacion });
  $('nota-cdt').textContent = CONFIG.notaCDT;

  const cont = $('perfiles');
  Object.entries(CONFIG.perfiles).forEach(([clave, p]) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="perfil" value="${clave}"${clave === ini.perfil ? ' checked' : ''}><span>${p.nombre}</span>`;
    cont.appendChild(l);
  });

  $('lista-saber').innerHTML = CONFIG.loQueTienesQueSaber.map((t) => `<li>${t}</li>`).join('');
})();

function numero(input, porDefecto = 0) {
  const n = parseFloat(String(input.value).replace(',', '.'));
  return Number.isFinite(n) ? n : porDefecto;
}

function leerDatos() {
  const trm = numero(campos.trm, 0);
  return {
    monto: Math.max(0, numero(campos.monto)),
    aporte: Math.max(0, numero(campos.aporte)),
    plazo: parseInt(campos.plazo.value, 10),
    tasaCDT: numero(campos.tasaCDT),
    retencion: Math.min(100, Math.max(0, numero(campos.retencion))),
    devaluacion: numero(campos.devaluacion),
    perfil: document.querySelector('input[name="perfil"]:checked').value,
    enPesos: campos.verPesos.checked && trm > 0,
    trm
  };
}

/* ---------- Gráfico ---------- */
let grafico = null;

function colores() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  return { cdt: v('--g-cdt'), cartera: v('--g-cartera'), franja: v('--g-franja'), malo: v('--g-malo'),
    rejilla: v('--g-rejilla'), texto: v('--tinta-suave'), superficie: v('--superficie'), tinta: v('--tinta') };
}

function dibujarGrafico(series, meses, formato) {
  const lienzo = $('grafico');
  if (typeof Chart === 'undefined') {
    lienzo.parentElement.innerHTML = '<p class="nota">No se pudo cargar el gráfico. Abre la tabla de abajo para ver los datos.</p>';
    return;
  }
  const c = colores();
  const puntos = (arr) => arr.map((y, m) => ({ x: m / 12, y }));
  const linea = { pointRadius: 0, pointHoverRadius: 5, pointHitRadius: 10, tension: 0, borderWidth: 2 };

  const datasets = [
    { ...linea, label: 'Cartera optimista', data: puntos(series.optimista), borderColor: c.franja, borderWidth: 1, backgroundColor: c.franja, fill: '+1', pointHoverBackgroundColor: c.cartera },
    { ...linea, label: 'Cartera pesimista', data: puntos(series.pesimista), borderColor: c.franja, borderWidth: 1, fill: false, pointHoverBackgroundColor: c.cartera },
    { ...linea, label: 'Cartera escenario medio', data: puntos(series.medio), borderColor: c.cartera, backgroundColor: c.cartera },
    { ...linea, label: 'Cartera con un año malo', data: puntos(series.malo), borderColor: c.malo, backgroundColor: c.malo, borderDash: [6, 4] },
    { ...linea, label: 'CDT', data: puntos(series.cdt), borderColor: c.cdt, backgroundColor: c.cdt }
  ];

  const pasoX = meses / 12 <= 10 ? 1 : 2;
  const opciones = {
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.superficie, titleColor: c.tinta, bodyColor: c.tinta,
        borderColor: c.rejilla, borderWidth: 1, padding: 10, boxPadding: 4, usePointStyle: true,
        itemSort: (a, b) => b.parsed.y - a.parsed.y,
        callbacks: {
          title: (it) => {
            const m = Math.round(it[0].parsed.x * 12);
            if (m === 0) return 'Hoy';
            const a = Math.floor(m / 12), r = m % 12;
            return r === 0 ? `Año ${a}` : `Año ${a}, mes ${r}`;
          },
          label: (it) => ` ${it.dataset.label}: ${formato(it.parsed.y, it.parsed.x * 12)}`,
          labelColor: (it) => ({ borderColor: it.dataset.pointHoverBackgroundColor || it.dataset.borderColor, backgroundColor: it.dataset.pointHoverBackgroundColor || it.dataset.borderColor })
        }
      }
    },
    scales: {
      x: {
        type: 'linear', min: 0, max: meses / 12,
        grid: { display: false }, border: { color: c.rejilla },
        ticks: { stepSize: pasoX, color: c.texto, callback: (v) => (v === 0 ? 'Hoy' : 'Año ' + v) }
      },
      y: {
        grid: { color: c.rejilla }, border: { display: false },
        ticks: { color: c.texto, maxTicksLimit: 6, callback: (v) => formatoCorto(v) }
      }
    }
  };

  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  if (grafico) grafico.destroy();
  grafico = new Chart(lienzo, { type: 'line', data: { datasets }, options: opciones });
}

let formatoCorto = (v) => v;

/* ---------- Pintar resultados ---------- */
function actualizar() {
  const d = leerDatos();
  const r = calcular(d);
  const { series, meses } = r;

  // Conversión a pesos: el valor en dólares del mes m se multiplica por la TRM proyectada de ese mes
  const trmMes = (m) => d.trm * Math.pow(1 + d.devaluacion / 100, m / 12);
  const enMoneda = (usd, m) => (d.enPesos ? usd * trmMes(m) : usd);
  const fmt = (usd, m) => (d.enPesos ? fmtCOP : fmtUSD).format(enMoneda(usd, m));
  formatoCorto = (v) => {
    const abs = Math.abs(v);
    if (d.enPesos) return abs >= 1e6 ? '$' + fmtNum.format(v / 1e6) + ' M' : '$' + fmtNum.format(v / 1e3) + ' mil';
    return abs >= 1e3 ? fmtNum.format(v / 1e3) + ' mil' : fmtNum.format(v);
  };

  // Total aportado en la moneda elegida
  let aportado = enMoneda(d.monto, 0);
  for (let m = 1; m <= meses; m++) aportado += enMoneda(d.aporte, m);

  const fin = (s) => enMoneda(series[s][meses], meses);
  const moneda = d.enPesos ? fmtCOP : fmtUSD;
  const dif = fin('medio') - fin('cdt');

  $('r-cdt').textContent = moneda.format(fin('cdt'));
  $('r-cartera').textContent = moneda.format(fin('medio'));
  $('r-rango').textContent = `${moneda.format(fin('pesimista'))} a ${moneda.format(fin('optimista'))}`;
  $('r-diferencia').textContent = (dif >= 0 ? '+' : '−') + moneda.format(Math.abs(dif));
  $('r-malo').textContent = moneda.format(fin('malo'));
  $('r-aportado').textContent = moneda.format(aportado);
  // Cifras muy largas (por ejemplo en pesos) se muestran un poco más pequeñas para que quepan
  document.querySelectorAll('.resultado__cifra').forEach((el) => {
    const n = el.textContent.length;
    el.classList.toggle('larga', n > 11 && n <= 14);
    el.classList.toggle('muy-larga', n > 14);
  });
  $('r-moneda').textContent = d.enPesos
    ? 'Valores en pesos (COP), con TRM proyectada'
    : 'Valores en dólares (USD)';

  // Avisos
  const avisoMonto = $('aviso-monto');
  avisoMonto.hidden = d.monto >= CONFIG.montoMinimo;
  avisoMonto.textContent = `El capital inicial mínimo en FONDEXO es de ${fmtUSD.format(CONFIG.montoMinimo)}.`;
  const avisoPlazo = $('aviso-plazo');
  avisoPlazo.hidden = d.plazo >= CONFIG.plazoMinimoRecomendado;
  avisoPlazo.textContent = CONFIG.avisoPlazoCorto;

  $('tasa-cdt-valor').textContent = pct(d.tasaCDT);
  $('devaluacion-valor').textContent = pctSigno(d.devaluacion);
  $('caja-trm').hidden = !campos.verPesos.checked;

  // Nota con los supuestos usados
  const p = r.perfil;
  $('nota-supuestos').innerHTML =
    `<strong>Supuestos usados.</strong> Perfil ${p.nombre}: año promedio entre ${pctSigno(p.promedio[0])} y ${pctSigno(p.promedio[1])} en dólares ` +
    `(pesimista ${pctSigno(p.promedio[0])}, medio ${pctSigno(r.rMedio * 100)}, optimista ${pctSigno(p.promedio[1])}). ` +
    `La línea "con un año malo" aplica ${pctSigno(r.rMalo * 100)} (punto medio de ${pctSigno(p.malo[0])} a ${pctSigno(p.malo[1])}) en el año ${r.anioMalo} y luego el promedio. ` +
    `CDT: ${pct(d.tasaCDT)} E.A. menos ${pct(d.retencion)} de retención sobre los intereses = ${pct(r.rCDTpesos * 100)} neto en pesos, ` +
    `equivalente a ${pctSigno(r.rCDTdolares * 100)} al año en dólares con la devaluación elegida. Interés compuesto mensual; los aportes se suman al final de cada mes.`;

  // Tabla año por año
  const filas = [];
  for (let a = 0; a <= d.plazo; a++) {
    const m = a * 12;
    filas.push(`<tr><td>${a === 0 ? 'Hoy' : 'Año ' + a}</td><td>${fmt(series.cdt[m], m)}</td><td>${fmt(series.pesimista[m], m)}</td><td>${fmt(series.medio[m], m)}</td><td>${fmt(series.optimista[m], m)}</td><td>${fmt(series.malo[m], m)}</td></tr>`);
  }
  $('tabla').innerHTML = '<thead><tr><th>Momento</th><th>CDT</th><th>Pesimista</th><th>Medio</th><th>Optimista</th><th>Con año malo</th></tr></thead><tbody>' + filas.join('') + '</tbody>';

  // Gráfico en la moneda elegida
  const conv = {};
  Object.keys(series).forEach((k) => { conv[k] = series[k].map((v, m) => enMoneda(v, m)); });
  dibujarGrafico(conv, meses, (v) => moneda.format(v));
}

$('form-comparador').addEventListener('input', actualizar);
$('form-comparador').addEventListener('change', actualizar);
$('form-comparador').addEventListener('submit', (e) => e.preventDefault());
document.addEventListener('cambio-tema', actualizar);
actualizar();
