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
    devaluacion: 3,      // % anual del peso frente al dólar (promedio 2016–2025, ver nota abajo)
    perfil: 'moderado'
  },

  montoMinimo: 600,                                    // USD
  plazo: { min: 1, max: 20 },                          // años
  tasaCDT: { min: 5, max: 15, paso: 0.1 },             // % E.A.
  devaluacion: { min: -5, max: 10, paso: 0.5 },        // % anual

  notaCDT: 'En septiembre de 2026 los CDT en Colombia pagaban entre 9% y 13,5% E.A. Revisa la tasa actual de tu banco.',

  // Botones rápidos de devaluación y su nota con la fuente
  devaluacionAtajos: [
    { valor: 0, nombre: 'Peso estable' },
    { valor: 3, nombre: 'Promedio 2016–2025' },
    { valor: 5, nombre: 'Peso débil' }
  ],
  notaDevaluacion: 'Entre 2016 y 2025 la TRM promedio pasó de $3.053 a $4.053: cerca de 3% de devaluación al año (datos del Banco de la República). No es constante: hay años en que el peso se revalúa.',

  // Comisión de FONDEXO: porcentaje de las GANANCIAS según el capital invertido (monto inicial + aportes).
  // "hasta" no incluye el valor: menos de 1.000 USD = 30%, de 1.000 a menos de 5.000 = 25%, 5.000 o más = 20%.
  // Se cobra una vez al año y solo sobre ganancias nuevas (si la cartera cae, no se cobra
  // hasta que supere su valor máximo anterior, la llamada "marca de agua").
  comision: {
    tramos: [
      { hasta: 1000, porcentaje: 30 },
      { hasta: 5000, porcentaje: 25 },
      { hasta: Infinity, porcentaje: 20 }
    ]
  },

  // Rentabilidad anual en dólares de cada perfil, ANTES de la comisión: [mínimo, máximo]
  // promedio[0] = escenario pesimista, punto medio = escenario medio, promedio[1] = escenario optimista
  // En la línea "con un año malo" se usa el punto medio del rango "malo".
  perfiles: {
    moderado:    { nombre: 'Moderado',    promedio: [6, 8],  bueno: [15, 22], malo: [-22, -28] },
    crecimiento: { nombre: 'Crecimiento', promedio: [7, 9],  bueno: [20, 28], malo: [-28, -35] },
    agresivo:    { nombre: 'Agresivo',    promedio: [8, 10], bueno: [25, 35], malo: [-35, -45] }
  },

  // Escenarios históricos: "¿qué habría pasado si se repitieran los últimos 10 años de…?"
  // anual = rentabilidad anual promedio de 10 años (antes de la comisión de FONDEXO).
  // Actualiza estas cifras cada año con la fuente indicada.
  historicoInicial: 'nasdaq',
  historicos: {
    ninguno:         { nombre: 'No comparar' },
    nasdaq:          { nombre: 'Nasdaq-100 (QQQ)', anual: 20.6, peorReciente: '−32,6% en 2022', peorHistorico: '−41,9% en 2008',
                       fuente: 'ChartRow, rentabilidad total a 10 años hasta agosto de 2026' },
    tecnologia:      { nombre: 'Tecnología de EE.UU. (XLK)', anual: 26.1, peorReciente: '−27% en 2022', peorHistorico: '−41,9% en 2000',
                       fuente: 'ChartRow, rentabilidad total a 10 años hasta julio de 2026' },
    semiconductores: { nombre: 'Semiconductores (SOXX)', anual: 33, peorReciente: '−35,1% en 2022', peorHistorico: 'cayó aún más en 2008',
                       fuente: 'ChartRow y AverageAnnualReturn, entre 32,8% y 35% anual a 10 años hasta julio–agosto de 2026' }
  },

  anioDelAnioMalo: 2,            // en qué año ocurre la caída de la línea "con un año malo"

  plazoMinimoRecomendado: 3,     // años
  plazoIdeal: 5,                 // años
  avisoPlazoCorto: 'Con menos de 3 años, un CDT probablemente es mejor opción para ti.',

  // Textos del recuadro "Lo que tienes que saber"
  loQueTienesQueSaber: [
    '<strong>El CDT es seguro y su resultado está garantizado; la cartera no.</strong>',
    'Los valores de la cartera <strong>ya descuentan la comisión de FONDEXO</strong>. El CDT no tiene comisión, pero sí retención en la fuente.',
    'Los escenarios históricos muestran lo que pasó entre 2016 y 2026, <strong>una década excepcional para la tecnología</strong>. No son una proyección ni una promesa: el fondo de innovación ARK (ARKK) subió +152% en 2020 y cayó −67% en 2022.',
    'Desde 1987, el índice mundial MSCI ACWI promedió cerca de 8,8% al año en dólares, con años muy negativos (fuente: MSCI, rentabilidad bruta a enero de 2026).',
    'En la bolsa de EE.UU. (S&amp;P 500, 1926–2016) cerca de <strong>25% de los periodos de 1 año terminaron en pérdida, 13% de los de 5 años y 5% de los de 10 años</strong> (fuente: Dimensional Fund Advisors). Por eso FONDEXO recomienda mínimo 3 años, ideal 5.'
  ]
};

/* =========================================================
   De aquí para abajo está el funcionamiento.
   No necesitas tocarlo para cambiar supuestos.
   ========================================================= */

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

// Porcentaje de comisión según el capital invertido
function porcentajeComision(capital) {
  const t = CONFIG.comision.tramos.find((x) => capital < x.hasta);
  return (t || CONFIG.comision.tramos[CONFIG.comision.tramos.length - 1]).porcentaje / 100;
}

// Igual que simular(), pero descontando la comisión de FONDEXO una vez al año,
// solo sobre ganancias nuevas (por encima del valor máximo anterior, sin contar aportes).
// Devuelve el valor neto de cada mes y la comisión cobrada en cada mes.
function simularConComision(monto, aporte, meses, tasaDelAnio) {
  const valores = [monto], comisiones = [0];
  let v = monto, maximo = monto, invertido = monto;
  for (let m = 1; m <= meses; m++) {
    const anio = Math.ceil(m / 12);
    v = v * (1 + tasaMensual(tasaDelAnio(anio))) + aporte;
    maximo += aporte; invertido += aporte;
    let cobro = 0;
    if (m % 12 === 0 && v > maximo) {
      cobro = (v - maximo) * porcentajeComision(invertido);
      v -= cobro;
      maximo = v;
    }
    valores.push(v); comisiones.push(cobro);
  }
  return { valores, comisiones };
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

  const tasas = {
    pesimista: () => prom[0],
    medio: () => rMedio,
    optimista: () => prom[1],
    malo: (a) => (a === anioMalo ? rMalo : rMedio)
  };
  // Cartera: valores NETOS (después de comisión). El escenario medio también se calcula en bruto.
  const series = { cdt: simular(d.monto, d.aporte, meses, () => rCDTdolares) };
  const comisiones = {};
  Object.entries(tasas).forEach(([k, f]) => {
    const r = simularConComision(d.monto, d.aporte, meses, f);
    series[k] = r.valores; comisiones[k] = r.comisiones;
  });
  series.medioBruto = simular(d.monto, d.aporte, meses, tasas.medio);

  // Escenario histórico (neto de comisión), si se eligió uno
  const h = CONFIG.historicos[d.historico];
  if (h && h.anual !== undefined) {
    series.historico = simularConComision(d.monto, d.aporte, meses, () => h.anual / 100).valores;
  }

  const aportado = d.monto + d.aporte * meses;
  const porcentajeFinal = porcentajeComision(aportado);

  return { series, comisiones, meses, aportado, porcentajeFinal, rMedio, rMalo, anioMalo, rCDTpesos, rCDTdolares, perfil: p, historico: series.historico ? h : null };
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
  verPesos: $('ver-pesos'), trm: $('trm'), historico: $('historico')
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
  $('nota-devaluacion').textContent = CONFIG.notaDevaluacion;

  const atajos = $('atajos-dev');
  CONFIG.devaluacionAtajos.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.valor = a.valor;
    b.innerHTML = `<strong>${pctSigno(a.valor)}</strong> ${a.nombre}`;
    b.addEventListener('click', () => {
      campos.devaluacion.value = a.valor;
      campos.devaluacion.dispatchEvent(new Event('input', { bubbles: true }));
    });
    atajos.appendChild(b);
  });

  $('tramos-comision').textContent = 'Comisión de FONDEXO según lo invertido: ' + CONFIG.comision.tramos.map((t, i, arr) => {
    const desde = i === 0 ? 0 : arr[i - 1].hasta;
    const rango = i === 0 ? `menos de ${fmtUSD.format(t.hasta)}` : (t.hasta === Infinity ? `desde ${fmtUSD.format(desde)}` : `de ${fmtUSD.format(desde)} a ${fmtUSD.format(t.hasta)}`);
    return `${rango}, ${t.porcentaje}%`;
  }).join('; ') + ' de las ganancias. Se cobra una vez al año y solo sobre ganancias nuevas: si la cartera cae, no se cobra hasta que recupere su valor máximo anterior.';

  const cont = $('perfiles');
  Object.entries(CONFIG.perfiles).forEach(([clave, p]) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="perfil" value="${clave}"${clave === ini.perfil ? ' checked' : ''}><span>${p.nombre}</span>`;
    cont.appendChild(l);
  });

  $('lista-saber').innerHTML = CONFIG.loQueTienesQueSaber.map((t) => `<li>${t}</li>`).join('');

  Object.entries(CONFIG.historicos).forEach(([clave, h]) => {
    const o = document.createElement('option');
    o.value = clave;
    o.textContent = h.anual !== undefined ? `${h.nombre}: ${pctSigno(h.anual)} al año` : h.nombre;
    campos.historico.appendChild(o);
  });
  campos.historico.value = CONFIG.historicoInicial;
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
    historico: campos.historico.value,
    enPesos: campos.verPesos.checked && trm > 0,
    trm
  };
}

/* ---------- Gráfico ---------- */
let grafico = null;

function colores() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  return { cdt: v('--g-cdt'), cartera: v('--g-cartera'), franja: v('--g-franja'), malo: v('--g-malo'), hist: v('--g-hist'),
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
    { ...linea, label: 'Cartera optimista (neto)', data: puntos(series.optimista), borderColor: c.franja, borderWidth: 1, backgroundColor: c.franja, fill: '+1', pointHoverBackgroundColor: c.cartera },
    { ...linea, label: 'Cartera pesimista (neto)', data: puntos(series.pesimista), borderColor: c.franja, borderWidth: 1, fill: false, pointHoverBackgroundColor: c.cartera },
    { ...linea, label: 'Cartera media antes de comisión', data: puntos(series.medioBruto), borderColor: c.cartera, backgroundColor: c.cartera, borderWidth: 1.5, borderDash: [2, 3] },
    { ...linea, label: 'Cartera escenario medio (neto)', data: puntos(series.medio), borderColor: c.cartera, backgroundColor: c.cartera },
    { ...linea, label: 'Cartera con un año malo (neto)', data: puntos(series.malo), borderColor: c.malo, backgroundColor: c.malo, borderDash: [6, 4] },
    { ...linea, label: 'CDT', data: puntos(series.cdt), borderColor: c.cdt, backgroundColor: c.cdt }
  ];
  if (series.historico) {
    datasets.push({ ...linea, label: 'Si se repitieran los últimos 10 años (neto)', data: puntos(series.historico), borderColor: c.hist, backgroundColor: c.hist, borderWidth: 2.5 });
  }

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

  // Desglose del escenario medio: ganancia bruta, comisión y neto
  // Costo de la comisión = valor bruto − valor neto. Incluye lo cobrado y lo que ese dinero
  // habría seguido rindiendo si se hubiera quedado invertido, así las filas siempre cuadran.
  const bruto = fin('medioBruto');
  const comisionTotal = bruto - fin('medio');
  const pctInicio = porcentajeComision(d.monto) * 100, pctFin = r.porcentajeFinal * 100;
  const etiquetaPct = pctInicio === pctFin ? `${fmtNum.format(pctFin)}% de las ganancias` : `${fmtNum.format(pctInicio)}% → ${fmtNum.format(pctFin)}% según crece tu capital`;
  const signo = (x) => (x >= 0 ? '+' : '−') + moneda.format(Math.abs(x));
  $('d-aportado').textContent = moneda.format(aportado);
  $('d-bruta').textContent = signo(bruto - aportado);
  $('d-comision-pct').textContent = etiquetaPct;
  $('d-comision').textContent = comisionTotal > 0 ? '−' + moneda.format(comisionTotal) : moneda.format(0);
  $('d-neta').textContent = signo(fin('medio') - aportado);
  $('d-final').textContent = moneda.format(fin('medio'));

  // Escenario histórico
  const hh = r.historico;
  $('caja-historico').hidden = !hh;
  $('leyenda-hist').hidden = !hh;
  if (hh) {
    const vh = fin('historico');
    $('h-titulo').textContent = `Si se repitieran los últimos 10 años de ${hh.nombre}, ya con comisión`;
    $('h-valor').textContent = moneda.format(vh);
    $('h-vs').textContent = `${(vh - fin('cdt')) >= 0 ? '+' : '−'}${moneda.format(Math.abs(vh - fin('cdt')))} frente al CDT`;
    $('h-detalle').textContent = `${pctSigno(hh.anual)} al año antes de comisión. Peor año reciente: ${hh.peorReciente}; peor año de su historia: ${hh.peorHistorico}. Fuente: ${hh.fuente}. Rentabilidades pasadas no garantizan rentabilidades futuras.`;
  }
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
  document.querySelectorAll('#atajos-dev button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.valor) === d.devaluacion));
  $('caja-trm').hidden = !campos.verPesos.checked;

  // Nota con los supuestos usados
  const p = r.perfil;
  $('nota-supuestos').innerHTML =
    `<strong>Supuestos usados.</strong> Perfil ${p.nombre}: año promedio entre ${pctSigno(p.promedio[0])} y ${pctSigno(p.promedio[1])} en dólares antes de comisión ` +
    `(pesimista ${pctSigno(p.promedio[0])}, medio ${pctSigno(r.rMedio * 100)}, optimista ${pctSigno(p.promedio[1])}). ` +
    `La línea "con un año malo" aplica ${pctSigno(r.rMalo * 100)} (punto medio de ${pctSigno(p.malo[0])} a ${pctSigno(p.malo[1])}) en el año ${r.anioMalo} y luego el promedio. ` +
    `CDT: ${pct(d.tasaCDT)} E.A. menos ${pct(d.retencion)} de retención sobre los intereses = ${pct(r.rCDTpesos * 100)} neto en pesos, ` +
    `equivalente a ${pctSigno(r.rCDTdolares * 100)} al año en dólares con la devaluación elegida. ` +
    `A la cartera se le descuenta la comisión de FONDEXO una vez al año, solo sobre ganancias nuevas. Interés compuesto mensual; los aportes se suman al final de cada mes.`;

  // Tabla año por año
  const filas = [];
  for (let a = 0; a <= d.plazo; a++) {
    const m = a * 12;
    const colHist = series.historico ? `<td>${fmt(series.historico[m], m)}</td>` : '';
    filas.push(`<tr><td>${a === 0 ? 'Hoy' : 'Año ' + a}</td><td>${fmt(series.cdt[m], m)}</td><td>${fmt(series.medioBruto[m], m)}</td><td>${fmt(series.pesimista[m], m)}</td><td>${fmt(series.medio[m], m)}</td><td>${fmt(series.optimista[m], m)}</td><td>${fmt(series.malo[m], m)}</td>${colHist}</tr>`);
  }
  const thHist = series.historico ? `<th>Como ${r.historico.nombre} (neto)</th>` : '';
  $('tabla').innerHTML = `<thead><tr><th>Momento</th><th>CDT</th><th>Medio antes de comisión</th><th>Pesimista (neto)</th><th>Medio (neto)</th><th>Optimista (neto)</th><th>Con año malo (neto)</th>${thHist}</tr></thead><tbody>` + filas.join('') + '</tbody>';

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
