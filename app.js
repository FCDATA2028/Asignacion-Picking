const SUPABASE_URL = "https://qaxxggokkclsfsjfmtbs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xbiL5biH5Y9jUf9wfM-7Fg_C2TqshKs";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let MAP_SKU = new Map();
let MAP_UBICACION = new Map();
let DATA = {};
let IS_COMPACT_MODE = false;
let SELECTED_CURVA = "TODAS";

const CONFIG_MSP_PB_AIP01 = {
    "101": [
        { msp: "MSP 101", min: 1, max: 4 },
        { msp: "MSP 102", min: 5, max: 8 },
        { msp: "MSP 103", min: 9, max: 12 },
        { msp: "MSP 104", min: 13, max: 16 },
        { msp: "MSP 105", min: 17, max: 20 }
    ],
    "102": [
        { msp: "MSP 110", min: 1, max: 4 },
        { msp: "MSP 109", min: 5, max: 8 },
        { msp: "MSP 108", min: 9, max: 12 },
        { msp: "MSP 107", min: 13, max: 16 },
        { msp: "MSP 106", min: 17, max: 20 }
    ]
};

const MAPA_PA_MSP_AIP01 = {
    "MSP201": ["201", "203", "205", "207"],
    "MSP202": ["209", "211", "213"],
    "MSP203": ["215", "217", "219"],
    "MSP204": ["221", "223", "225", "227"],
    "MSP205": ["222", "224", "226", "228"],
    "MSP206": ["216", "218", "220"],
    "MSP207": ["210", "212", "214"],
    "MSP208": ["202", "204", "206", "208"]
};

const CONFIG_AIP02 = {
    "AIP_PB": {
        arriba: ["101", "102", "103", "104", "105", "106", "107", "108"],
        abajo: ["201", "202", "203", "204", "205", "206", "207", "208"],
        msrTop: [
            { id: "MSR 102", pasillos: ["101", "102", "103", "104"] },
            { id: "MSR 104", pasillos: ["105", "106", "107", "108"] }
        ],
        msrBottom: [
            { id: "MSR 101", pasillos: ["201", "202", "203", "204"] },
            { id: "MSR 103", pasillos: ["205", "206", "207", "208"] }
        ]
    },
    "AIP_P1": {
        arriba: ["301", "302", "303", "304", "305", "306", "307", "308"],
        abajo: ["401", "402", "403", "404", "405", "406", "407", "408"],
        msrTop: [
            { id: "MSR 202", pasillos: ["301", "302", "303", "304"] },
            { id: "MSR 204", pasillos: ["305", "306", "307", "308"] }
        ],
        msrBottom: [
            { id: "MSR 201", pasillos: ["401", "402", "403", "404"] },
            { id: "MSR 203", pasillos: ["405", "406", "407", "408"] }
        ]
    },
    "AIP_P2": {
        arriba: ["501", "502", "503", "504", "505", "506", "507", "508"],
        abajo: ["601", "602", "603", "604", "605", "606", "607", "608"],
        msrTop: [
            { id: "MSR 302", pasillos: ["501", "502", "503", "504"] },
            { id: "MSR 304", pasillos: ["505", "506", "507", "508"] }
        ],
        msrBottom: [
            { id: "MSR 301", pasillos: ["601", "602", "603", "604"] },
            { id: "MSR 303", pasillos: ["605", "606", "607", "608"] }
        ]
    }
};

const viewSelect = document.getElementById("viewSelect");
const curvaFilter = document.getElementById("curvaFilter");
const multiButton = document.getElementById("multiButton");
const multiDropdown = document.getElementById("multiDropdown");
const pasilloOptions = document.getElementById("pasilloOptions");
const mapsContainer = document.getElementById("mapsContainer");
const btnSelectAll = document.getElementById("btnSelectAll");
const btnClearAll = document.getElementById("btnClearAll");
const statusSub = document.getElementById("status-sub");
const btnToggleCompact = document.getElementById("btnToggleCompact");

const modalNiveles = document.getElementById("modalNiveles");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    await fetchMaestroSKU();
    await fetchMaestroUbicacion();
    await fetchInventarioCompleto();
}

async function fetchMaestroSKU() {
    try {
        statusSub.innerText = "Cargando Maestro SKU...";
        let desde = 0, paso = 1000;
        const { count } = await _supabase.from('maestro_sku').select('*', { count: 'exact', head: true });

        while (desde < (count || 0)) {
            const { data } = await _supabase.from('maestro_sku').select('sku, curva_oficial').range(desde, desde + paso - 1);
            if (data && data.length > 0) {
                data.forEach(item => {
                    if (item.sku) {
                        const skuClean = String(item.sku).trim();
                        const curva = (item.curva_oficial && item.curva_oficial !== '#N/D') ? String(item.curva_oficial).trim() : 'S/C';
                        MAP_SKU.set(skuClean, curva);
                    }
                });
                desde += paso;
            } else break;
        }
    } catch (err) {
        console.error("Error maestro_sku:", err);
    }
}

async function fetchMaestroUbicacion() {
    try {
        statusSub.innerText = "Cargando Maestro Ubicaciones...";
        let desde = 0, paso = 1000;
        const { count } = await _supabase.from('maestro_ubicacion').select('*', { count: 'exact', head: true });

        while (desde < (count || 0)) {
            const { data } = await _supabase.from('maestro_ubicacion').select('ubicacion, curva_nueva, zona_asignac').range(desde, desde + paso - 1);
            if (data && data.length > 0) {
                data.forEach(item => {
                    if (item.ubicacion) {
                        const ubiClean = String(item.ubicacion).trim();
                        const curvaTeorica = (item.curva_nueva && item.curva_nueva !== '#N/D' && item.curva_nueva !== 'NO DEFINIDO')
                            ? String(item.curva_nueva).trim()
                            : 'S/A';
                        const zonaMSP = (item.zona_asignac && item.zona_asignac !== '#N/D') ? String(item.zona_asignac).trim() : 'SIN_ZONA';
                        MAP_UBICACION.set(ubiClean, { curvaTeorica, zonaMSP });
                    }
                });
                desde += paso;
            } else break;
        }
    } catch (err) {
        console.error("Error maestro_ubicacion:", err);
    }
}

async function fetchInventarioCompleto() {
    try {
        let desde = 0, paso = 1000;
        DATA = {};
        const { count } = await _supabase.from('inventario_lpn').select('*', { count: 'exact', head: true });

        while (desde < (count || 0)) {
            statusSub.innerText = `Sincronizando inventario (${desde.toLocaleString()} / ${(count || 0).toLocaleString()})...`;
            const { data } = await _supabase.from('inventario_lpn').select('ubicacion, codigo, lpn').range(desde, desde + paso - 1);
            if (data && data.length > 0) {
                procesarBloque(data);
                desde += paso;
            } else break;
        }

        statusSub.innerText = "Inventario sincronizado correctamente.";
        fillPasillos();
    } catch (err) {
        console.error("Error inventario_lpn:", err);
        statusSub.innerText = "Error cargando la base de datos.";
    }
}

function evaluarCumplimiento(teorica, real) {
    if (!teorica || teorica === 'S/A' || real === 'S/C') return false;
    if (teorica.length === 1) return real.startsWith(teorica);
    return (real === teorica);
}

function procesarBloque(filas) {
    filas.forEach(row => {
        if (!row.ubicacion) return;
        const ubClean = String(row.ubicacion).trim();
        const partes = ubClean.split('-').map(p => p.trim());

        if (partes.length >= 3) {
            let area = "AIP01";
            let pasilloNum = partes[1];
            let bahia = parseInt(partes[2], 10);
            let nivel = partes.length >= 4 ? parseInt(partes[3], 10) : 1;

            if (partes[0].toUpperCase().includes("AIP02") || partes[0].toUpperCase().includes("AIP2")) {
                area = "AIP02";
            }

            const pasilloKey = `${pasilloNum}_${area}`;

            if (!isNaN(bahia)) {
                if (!DATA[pasilloKey]) DATA[pasilloKey] = {};
                if (!DATA[pasilloKey][bahia]) {
                    DATA[pasilloKey][bahia] = {
                        lineasCount: 0,
                        lpnsSet: new Set(),
                        skusSet: new Set(),
                        teorica: 'S/A',
                        curvasConteo: {},
                        niveles: {},
                        cumplimientoCount: 0,
                        area: area,
                        pasilloNum: pasilloNum
                    };
                }

                const bahiaObj = DATA[pasilloKey][bahia];
                const codigoProd = row.codigo ? String(row.codigo).trim() : '';
                const lpnCod = row.lpn ? String(row.lpn).trim() : 'SIN LPN';
                const curvaReal = MAP_SKU.get(codigoProd) || 'S/C';

                const metaUbi = MAP_UBICACION.get(ubClean) || { curvaTeorica: 'S/A' };
                if (metaUbi.curvaTeorica !== 'S/A') bahiaObj.teorica = metaUbi.curvaTeorica;

                if (curvaReal !== 'S/C' && curvaReal !== 'NO DEFINIDO') {
                    bahiaObj.curvasConteo[curvaReal] = (bahiaObj.curvasConteo[curvaReal] || 0) + 1;
                }

                bahiaObj.lineasCount += 1;
                if (lpnCod !== 'SIN LPN') bahiaObj.lpnsSet.add(lpnCod);
                if (codigoProd) bahiaObj.skusSet.add(codigoProd);

                if (!bahiaObj.niveles[nivel]) {
                    bahiaObj.niveles[nivel] = {
                        lineasCount: 0,
                        teorica: metaUbi.curvaTeorica,
                        cumplimientoCount: 0,
                        items: []
                    };
                }

                const nivelObj = bahiaObj.niveles[nivel];
                nivelObj.lineasCount += 1;

                const esConforme = evaluarCumplimiento(metaUbi.curvaTeorica, curvaReal);
                if (esConforme) {
                    nivelObj.cumplimientoCount += 1;
                    bahiaObj.cumplimientoCount += 1;
                }

                nivelObj.items.push({ lpn: lpnCod, sku: codigoProd, curvaReal, esConforme });
            }
        }
    });
}

function fillPasillos() {
    const vista = viewSelect.value;
    pasilloOptions.innerHTML = "";

    let pasillosFiltrados = [];

    if (vista === "PB") {
        pasillosFiltrados = ["101_AIP01", "102_AIP01"];
    } else if (vista === "PA") {
        for (let p = 201; p <= 228; p++) pasillosFiltrados.push(`${p}_AIP01`);
    } else if (CONFIG_AIP02[vista]) {
        const conf = CONFIG_AIP02[vista];
        pasillosFiltrados = [...conf.arriba, ...conf.abajo].map(p => `${p}_AIP02`);
    }

    pasillosFiltrados.forEach(pKey => {
        const numPasillo = pKey.split('_')[0];
        const label = document.createElement("label");
        label.className = "checkbox-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = pKey;
        checkbox.checked = true;
        checkbox.addEventListener("change", render);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode("Pasillo " + numPasillo));
        pasilloOptions.appendChild(label);
    });

    render();
}

function getSelectedPasillos() {
    return Array.from(pasilloOptions.querySelectorAll("input[type='checkbox']:checked")).map(cb => cb.value);
}

/* Colorimetría basada en el porcentaje de participación sobre el total de líneas */
function getHeatmapColorPct(porcentaje) {
    if (porcentaje > 40) {
        // MUCHO - ROJO
        return { bg: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', border: '#f87171', text: '#991b1b' };
    } else if (porcentaje >= 15) {
        // MEDIANO - AMARILLO
        return { bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', border: '#fde047', text: '#854d0e' };
    } else {
        // POCO - VERDE
        return { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '#86efac', text: '#166534' };
    }
}

function getFillColor(count) {
    if (count === 0) return "#ffffff";
    if (count <= 15) return "#dcfce7";
    if (count <= 40) return "#fef08a";
    return "#fca5a5";
}

function obtenerCurvaDominanteBahia(rawData) {
    if (!rawData) return 'S/A';
    if (rawData.curvasConteo && Object.keys(rawData.curvasConteo).length > 0) {
        let maxCount = -1;
        let curvaDominante = rawData.teorica || 'S/A';
        for (const [curva, count] of Object.entries(rawData.curvasConteo)) {
            if (count > maxCount) {
                maxCount = count;
                curvaDominante = curva;
            }
        }
        return curvaDominante;
    }
    return rawData.teorica || 'S/A';
}

function filtrarBahiaPorCurva(rawData) {
    if (!rawData) return { lineasCount: 0, lpnsSet: new Set(), skusSet: new Set(), cumplimientoCount: 0, teorica: 'S/A' };
    if (SELECTED_CURVA === "TODAS") return rawData;

    let lineasCount = 0;
    let lpnsSet = new Set();
    let skusSet = new Set();
    let cumplimientoCount = 0;

    Object.values(rawData.niveles || {}).forEach(niv => {
        (niv.items || []).forEach(it => {
            if (it.curvaReal.startsWith(SELECTED_CURVA)) {
                lineasCount++;
                if (it.lpn && it.lpn !== 'SIN LPN') lpnsSet.add(it.lpn);
                if (it.sku) skusSet.add(it.sku);
                if (it.esConforme) cumplimientoCount++;
            }
        });
    });

    return {
        lineasCount,
        lpnsSet,
        skusSet,
        cumplimientoCount,
        teorica: rawData.teorica,
        curvasConteo: rawData.curvasConteo,
        niveles: rawData.niveles
    };
}

function createBayCard(pasilloKey, bahiaNum) {
    const rawData = DATA[pasilloKey]?.[bahiaNum];
    const bahiaFiltrada = filtrarBahiaPorCurva(rawData);

    const totalLineas = bahiaFiltrada.lineasCount;
    const totalLpns = bahiaFiltrada.lpnsSet.size;
    const totalSkus = bahiaFiltrada.skusSet.size;

    const teorica = obtenerCurvaDominanteBahia(rawData);
    const cumplimiento = totalLineas > 0 ? Math.round((bahiaFiltrada.cumplimientoCount / totalLineas) * 100) : 0;

    const el = document.createElement("div");
    el.className = "bay-card";
    el.style.backgroundColor = getFillColor(totalLineas);

    let kpiClass = "kpi-none";
    if (totalLineas > 0) {
        if (cumplimiento >= 80) kpiClass = "kpi-good";
        else if (cumplimiento >= 50) kpiClass = "kpi-mid";
        else kpiClass = "kpi-bad";
    }

    el.innerHTML = `
        <div class="bay-header-line">
            <span class="bay-num">B.${bahiaNum}</span>
            <span class="bay-curva-tag">${teorica}</span>
        </div>
        <div class="bay-main-info">
            <div class="bay-metrics">
                <span class="bay-lpn-val">${totalLineas} <small style="font-size:10px;">Lín.</small></span>
                <span class="bay-sku-val">${totalLpns} LPN | ${totalSkus} SKU</span>
            </div>
            <span class="bay-kpi-badge ${kpiClass}">${totalLineas > 0 ? cumplimiento + '%' : 'N/A'}</span>
        </div>
    `;

    el.addEventListener("click", () => abrirModalNiveles(pasilloKey, bahiaNum, rawData));
    return el;
}

function renderPlantaBaja(selectedPasillos) {
    const cedisGrid = document.createElement("div");
    cedisGrid.className = "cedis-grid-pb";

    if (selectedPasillos.includes("101_AIP01")) {
        cedisGrid.appendChild(createAisleModulePB("101_AIP01"));
    } else {
        cedisGrid.appendChild(document.createElement("div"));
    }

    const centralCorridor = document.createElement("div");
    centralCorridor.className = "central-rep-corridor";
    centralCorridor.textContent = "PASILLO CENTRAL REP";
    cedisGrid.appendChild(centralCorridor);

    if (selectedPasillos.includes("102_AIP01")) {
        cedisGrid.appendChild(createAisleModulePB("102_AIP01"));
    } else {
        cedisGrid.appendChild(document.createElement("div"));
    }

    mapsContainer.appendChild(cedisGrid);
}

function createAisleModulePB(pasilloKey) {
    const pasilloNum = pasilloKey.split('_')[0];
    const aisleBlock = document.createElement("div");
    aisleBlock.className = "aisle-block";

    aisleBlock.innerHTML = `
        <div class="aisle-title">PASILLO ${pasilloNum}</div>
        <div class="aisle-sub-headers">
            <div>IMPARES</div>
            <div>MSP</div>
            <div>PARES</div>
        </div>
        <div class="aisle-content-grid-pb">
            <div class="bay-column" id="col-imp-${pasilloNum}"></div>
            <div class="msp-column-grid" id="col-msp-${pasilloNum}"></div>
            <div class="bay-column" id="col-par-${pasilloNum}"></div>
        </div>
    `;

    const colImp = aisleBlock.querySelector(`#col-imp-${pasilloNum}`);
    const colMsp = aisleBlock.querySelector(`#col-msp-${pasilloNum}`);
    const colPar = aisleBlock.querySelector(`#col-par-${pasilloNum}`);

    for (let b = 1; b <= 20; b += 2) colImp.appendChild(createBayCard(pasilloKey, b));
    for (let b = 2; b <= 20; b += 2) colPar.appendChild(createBayCard(pasilloKey, b));

    // Calcular líneas totales del pasillo para obtener el porcentaje
    let totalPasilloLineas = 0;
    for (let b = 1; b <= 20; b++) {
        const bObj = DATA[pasilloKey]?.[b];
        const bFilt = filtrarBahiaPorCurva(bObj);
        if (bFilt) totalPasilloLineas += bFilt.lineasCount;
    }

    const mspList = CONFIG_MSP_PB_AIP01[pasilloNum] || [];
    mspList.forEach(item => {
        let mspLineas = 0;
        let mspCumplimiento = 0;

        for (let b = item.min; b <= item.max; b++) {
            const bObj = DATA[pasilloKey]?.[b];
            const bFilt = filtrarBahiaPorCurva(bObj);
            if (bFilt) {
                mspLineas += bFilt.lineasCount;
                mspCumplimiento += bFilt.cumplimientoCount;
            }
        }

        // Porcentaje de participación
        const pctPart = totalPasilloLineas > 0 ? ((mspLineas / totalPasilloLineas) * 100) : 0;
        const heatmap = getHeatmapColorPct(pctPart);
        const pctCumplimiento = mspLineas > 0 ? Math.round((mspCumplimiento / mspLineas) * 100) : 0;

        const mspBlock = document.createElement("div");
        mspBlock.className = "msp-card-block";
        mspBlock.style.background = heatmap.bg;
        mspBlock.style.borderColor = heatmap.border;

        mspBlock.innerHTML = `
            <div class="msp-card-title" style="color:${heatmap.text}">${item.msp}</div>
            <div class="msp-card-sub" style="color:${heatmap.text}">Bahías ${item.min} - ${item.max}</div>
            <div class="msp-kpi-row" style="color:${heatmap.text}; border-color:${heatmap.border};">
                ${mspLineas.toLocaleString()} Lín. (${pctPart.toFixed(1)}%) | <span class="pa-cump-badge">${pctCumplimiento}% OK</span>
            </div>
        `;
        colMsp.appendChild(mspBlock);
    });

    return aisleBlock;
}

function renderPlantaAlta(selectedPasillos) {
    const gridPA = document.createElement("div");
    gridPA.className = IS_COMPACT_MODE ? "cedis-grid-pa compact" : "cedis-grid-pa";

    const stackImpares = document.createElement("div");
    stackImpares.className = "pa-aisle-stack";

    const stackMspLeft = document.createElement("div");
    stackMspLeft.className = "pa-msp-stack";

    const stackMspRight = document.createElement("div");
    stackMspRight.className = "pa-msp-stack";

    const stackPares = document.createElement("div");
    stackPares.className = "pa-aisle-stack";

    for (let p = 201; p <= 227; p += 2) {
        const pKey = `${p}_AIP01`;
        if (selectedPasillos.includes(pKey)) stackImpares.appendChild(createAisleRowPA(pKey));
    }

    stackMspLeft.appendChild(createMspCardPA("MSP201", "span-4"));
    stackMspLeft.appendChild(createMspCardPA("MSP202", "span-3"));
    stackMspLeft.appendChild(createMspCardPA("MSP203", "span-3"));
    stackMspLeft.appendChild(createMspCardPA("MSP204", "span-4"));

    stackMspRight.appendChild(createMspCardPA("MSP208", "span-4"));
    stackMspRight.appendChild(createMspCardPA("MSP207", "span-3"));
    stackMspRight.appendChild(createMspCardPA("MSP206", "span-3"));
    stackMspRight.appendChild(createMspCardPA("MSP205", "span-4"));

    for (let p = 202; p <= 228; p += 2) {
        const pKey = `${p}_AIP01`;
        if (selectedPasillos.includes(pKey)) stackPares.appendChild(createAisleRowPA(pKey));
    }

    gridPA.appendChild(stackImpares);
    gridPA.appendChild(stackMspLeft);
    gridPA.appendChild(stackMspRight);
    gridPA.appendChild(stackPares);

    mapsContainer.appendChild(gridPA);
}

function createAisleRowPA(pasilloKey) {
    const pasilloNum = pasilloKey.split('_')[0];
    const card = document.createElement("div");
    card.className = IS_COMPACT_MODE ? "pa-aisle-card compact" : "pa-aisle-card";

    let sumLineas = 0;
    let sumCumplimiento = 0;
    let sumLpns = new Set();
    let sumSkus = new Set();

    const pObj = DATA[pasilloKey] || {};
    Object.values(pObj).forEach(b => {
        const bFilt = filtrarBahiaPorCurva(b);
        sumLineas += bFilt.lineasCount;
        sumCumplimiento += bFilt.cumplimientoCount;
        bFilt.lpnsSet.forEach(x => sumLpns.add(x));
        bFilt.skusSet.forEach(x => sumSkus.add(x));
    });

    let lineasGlobalesPA = 0;
    for (let p = 201; p <= 228; p++) {
        const pKeyAll = `${p}_AIP01`;
        const pObjAll = DATA[pKeyAll] || {};
        Object.values(pObjAll).forEach(b => {
            const bFilt = filtrarBahiaPorCurva(b);
            lineasGlobalesPA += bFilt.lineasCount;
        });
    }

    const pctPart = lineasGlobalesPA > 0 ? ((sumLineas / lineasGlobalesPA) * 100) : 0;
    const heatmap = getHeatmapColorPct(pctPart);
    const pctCumplimiento = sumLineas > 0 ? Math.round((sumCumplimiento / sumLineas) * 100) : 0;

    if (IS_COMPACT_MODE) {
        card.style.background = heatmap.bg;
        card.style.borderColor = heatmap.border;

        card.innerHTML = `
            <div class="pa-compact-title" style="color:${heatmap.text}">PASILLO ${pasilloNum}</div>
            <div class="pa-compact-metrics-row">
                <span class="pa-kpi-chip" style="color:${heatmap.text}; border-color:${heatmap.border}; font-weight:900;">
                    ${sumLineas.toLocaleString()} Lín. (${pctPart.toFixed(1)}%)
                </span>
                <span class="pa-kpi-chip" style="color:${heatmap.text}; border-color:${heatmap.border};">
                    ${sumLpns.size} LPN | ${sumSkus.size} SKU
                </span>
                <span class="compact-badge-cump ${pctCumplimiento >= 80 ? 'good' : (pctCumplimiento >= 50 ? 'mid' : 'bad')}">
                    ${pctCumplimiento}% Cump.
                </span>
            </div>
        `;
        return card;
    }

    card.innerHTML = `
        <div class="pa-aisle-header">
            PASILLO ${pasilloNum} 
            <span class="pa-cump-badge ${pctCumplimiento >= 80 ? 'good' : (pctCumplimiento >= 50 ? 'mid' : 'bad')}">
                ${pctCumplimiento}% Cump. Curva
            </span>
        </div>
        <div class="pa-bay-grid">
            <div class="pa-bay-row" id="row-imp-${pasilloNum}"></div>
            <div class="pa-bay-row" id="row-par-${pasilloNum}"></div>
        </div>
    `;

    const rowImp = card.querySelector(`#row-imp-${pasilloNum}`);
    const rowPar = card.querySelector(`#row-par-${pasilloNum}`);

    const imparesOrder = [9, 7, 5, 3, 1];
    const paresOrder = [10, 8, 6, 4, 2];

    imparesOrder.forEach(b => rowImp.appendChild(createBayCard(pasilloKey, b)));
    paresOrder.forEach(b => rowPar.appendChild(createBayCard(pasilloKey, b)));

    return card;
}

function createMspCardPA(mspKey, spanClass) {
    const pasillosMsp = MAPA_PA_MSP_AIP01[mspKey] || [];
    let lineasTotal = 0;
    let cumplimientoTotal = 0;

    pasillosMsp.forEach(p => {
        const pKey = `${p}_AIP01`;
        const pObj = DATA[pKey] || {};
        Object.values(pObj).forEach(b => {
            const bFilt = filtrarBahiaPorCurva(b);
            lineasTotal += bFilt.lineasCount;
            cumplimientoTotal += bFilt.cumplimientoCount;
        });
    });

    // Calcular el total general de la vista para la participación global de los MSP
    let lineasGlobalesPA = 0;
    for (let p = 201; p <= 228; p++) {
        const pObj = DATA[`${p}_AIP01`] || {};
        Object.values(pObj).forEach(b => {
            const bFilt = filtrarBahiaPorCurva(b);
            lineasGlobalesPA += bFilt.lineasCount;
        });
    }

    const pctPart = lineasGlobalesPA > 0 ? ((lineasTotal / lineasGlobalesPA) * 100) : 0;
    const heatmap = getHeatmapColorPct(pctPart);
    const pctCumplimiento = lineasTotal > 0 ? Math.round((cumplimientoTotal / lineasTotal) * 100) : 0;

    const el = document.createElement("div");
    el.className = `pa-msp-card ${spanClass} ${IS_COMPACT_MODE ? 'compact' : ''}`;
    el.style.background = heatmap.bg;
    el.style.borderColor = heatmap.border;

    el.innerHTML = `
        <div class="msp-card-title" style="color:${heatmap.text}">${mspKey}</div>
        <div class="msp-kpi-row" style="color:${heatmap.text}; border-color:${heatmap.border}; font-size: 13px;">
            ${lineasTotal.toLocaleString()} Lín. (${pctPart.toFixed(1)}%)
        </div>
        <div style="margin-top: 4px;">
            <span class="compact-badge-cump ${pctCumplimiento >= 80 ? 'good' : (pctCumplimiento >= 50 ? 'mid' : 'bad')}">
                ${pctCumplimiento}% Cump. Curva
            </span>
        </div>
    `;
    return el;
}

function renderAIP02Layout(selectedPasillos) {
    const vista = viewSelect.value;
    const config = CONFIG_AIP02[vista];

    const layoutContainer = document.createElement("div");
    layoutContainer.className = "aip02-layout-grid";

    // Obtener el total de líneas de todo el sector AIP02
    let lineasTotalesAIP02 = 0;
    [...config.arriba, ...config.abajo].forEach(p => {
        const pKey = `${p}_AIP02`;
        for (let b = 1; b <= 8; b++) {
            const bObj = DATA[pKey]?.[b];
            const bFilt = filtrarBahiaPorCurva(bObj);
            if (bFilt) lineasTotalesAIP02 += bFilt.lineasCount;
        }
    });

    const topSector = document.createElement("div");
    topSector.className = "aip02-sector";
    config.arriba.forEach(p => {
        const pKey = `${p}_AIP02`;
        if (selectedPasillos.includes(pKey)) topSector.appendChild(createAipAisleModule(pKey, "TOP", lineasTotalesAIP02));
    });

    const msrTopRow = document.createElement("div");
    msrTopRow.className = "msr-row-grid";
    config.msrTop.forEach(m => {
        let sumLineas = 0;
        let sumCumplimiento = 0;
        m.pasillos.forEach(p => {
            const pKey = `${p}_AIP02`;
            for (let b = 1; b <= 8; b++) {
                const bObj = DATA[pKey]?.[b];
                const bFilt = filtrarBahiaPorCurva(bObj);
                if (bFilt) {
                    sumLineas += bFilt.lineasCount;
                    sumCumplimiento += bFilt.cumplimientoCount;
                }
            }
        });

        const pctPart = lineasTotalesAIP02 > 0 ? ((sumLineas / lineasTotalesAIP02) * 100) : 0;
        const heatmap = getHeatmapColorPct(pctPart);
        const pctCumplimiento = sumLineas > 0 ? Math.round((sumCumplimiento / sumLineas) * 100) : 0;

        const msrEl = document.createElement("div");
        msrEl.className = `msr-card-h msr-span-${m.pasillos.length}`;
        msrEl.style.background = heatmap.bg;
        msrEl.style.borderColor = heatmap.border;

        msrEl.innerHTML = `
            <div class="msp-card-title" style="color:${heatmap.text}">${m.id}</div>
            <div class="msp-kpi-row" style="color:${heatmap.text}; border-color:${heatmap.border}; font-size: 14px; font-weight: 900;">
                ${sumLineas.toLocaleString()} Lín. (${pctPart.toFixed(1)}%) | <span class="pa-cump-badge">${pctCumplimiento}% OK</span>
            </div>
        `;
        msrTopRow.appendChild(msrEl);
    });

    const msrBottomRow = document.createElement("div");
    msrBottomRow.className = "msr-row-grid";
    config.msrBottom.forEach(m => {
        let sumLineas = 0;
        let sumCumplimiento = 0;
        m.pasillos.forEach(p => {
            const pKey = `${p}_AIP02`;
            for (let b = 1; b <= 8; b++) {
                const bObj = DATA[pKey]?.[b];
                const bFilt = filtrarBahiaPorCurva(bObj);
                if (bFilt) {
                    sumLineas += bFilt.lineasCount;
                    sumCumplimiento += bFilt.cumplimientoCount;
                }
            }
        });

        const pctPart = lineasTotalesAIP02 > 0 ? ((sumLineas / lineasTotalesAIP02) * 100) : 0;
        const heatmap = getHeatmapColorPct(pctPart);
        const pctCumplimiento = sumLineas > 0 ? Math.round((sumCumplimiento / sumLineas) * 100) : 0;

        const msrEl = document.createElement("div");
        msrEl.className = `msr-card-h msr-span-${m.pasillos.length}`;
        msrEl.style.background = heatmap.bg;
        msrEl.style.borderColor = heatmap.border;

        msrEl.innerHTML = `
            <div class="msp-card-title" style="color:${heatmap.text}">${m.id}</div>
            <div class="msp-kpi-row" style="color:${heatmap.text}; border-color:${heatmap.border}; font-size: 14px; font-weight: 900;">
                ${sumLineas.toLocaleString()} Lín. (${pctPart.toFixed(1)}%) | <span class="pa-cump-badge">${pctCumplimiento}% OK</span>
            </div>
        `;
        msrBottomRow.appendChild(msrEl);
    });

    const bottomSector = document.createElement("div");
    bottomSector.className = "aip02-sector";
    config.abajo.forEach(p => {
        const pKey = `${p}_AIP02`;
        if (selectedPasillos.includes(pKey)) bottomSector.appendChild(createAipAisleModule(pKey, "BOTTOM", lineasTotalesAIP02));
    });

    layoutContainer.appendChild(topSector);
    layoutContainer.appendChild(msrTopRow);
    layoutContainer.appendChild(msrBottomRow);
    layoutContainer.appendChild(bottomSector);

    mapsContainer.appendChild(layoutContainer);
}

function createAipAisleModule(pasilloKey, ubicacionSector, totalSectorLines = 0) {
    const pasilloNum = pasilloKey.split('_')[0];
    const card = document.createElement("div");
    card.className = IS_COMPACT_MODE ? "horizontal-aisle-card compact" : "horizontal-aisle-card";

    let soloPares = ["101", "301", "501", "208", "408", "608"].includes(pasilloNum);
    let soloImpares = ["108", "308", "201", "401", "601"].includes(pasilloNum);

    if (pasilloNum === "508") {
        soloPares = true;
        soloImpares = false;
    }

    const esUnicaCara = soloPares || soloImpares;

    let sumLineas = 0;
    let sumCumplimiento = 0;
    let sumLpns = new Set();
    let sumSkus = new Set();

    const pObj = DATA[pasilloKey] || {};
    Object.values(pObj).forEach(b => {
        const bFilt = filtrarBahiaPorCurva(b);
        sumLineas += bFilt.lineasCount;
        sumCumplimiento += bFilt.cumplimientoCount;
        bFilt.lpnsSet.forEach(l => sumLpns.add(l));
        bFilt.skusSet.forEach(s => sumSkus.add(s));
    });

    const pctPart = totalSectorLines > 0 ? ((sumLineas / totalSectorLines) * 100) : 0;
    const pctCumplimiento = sumLineas > 0 ? Math.round((sumCumplimiento / sumLineas) * 100) : 0;
    const heatmap = getHeatmapColorPct(pctPart);

    if (IS_COMPACT_MODE) {
        card.style.background = heatmap.bg;
        card.style.borderColor = heatmap.border;

        card.innerHTML = `
            <div class="compact-header-row">
                <span class="compact-aisle-title" style="color:${heatmap.text}">PASILLO ${pasilloNum}</span>
                <span class="compact-badge-cump ${pctCumplimiento >= 80 ? 'good' : (pctCumplimiento >= 50 ? 'mid' : 'bad')}">${pctCumplimiento}% OK</span>
            </div>
            <div class="compact-big-kpi" style="color:${heatmap.text}">${sumLineas.toLocaleString()} <small>Lín. (${pctPart.toFixed(1)}%)</small></div>
            <div class="compact-sub-metrics" style="color:${heatmap.text}">
                <span>${sumLpns.size} LPN</span> | <span>${sumSkus.size} SKU</span>
            </div>
        `;
        return card;
    }

    card.innerHTML = `
        <div class="aisle-title">PASILLO ${pasilloNum} ${esUnicaCara ? '<small>(1 Cara)</small>' : '<small>(2 Caras)</small>'}</div>
        <div class="horizontal-bay-grid ${esUnicaCara ? 'single-face' : 'double-face'}">
            ${!soloImpares ? `
            <div class="bay-col-side" id="col-par-${pasilloNum}">
                <div class="side-label">PARES</div>
            </div>` : ''}

            ${!esUnicaCara ? '<div class="aisle-physical-corridor">PASILLO</div>' : ''}

            ${!soloPares ? `
            <div class="bay-col-side" id="col-imp-${pasilloNum}">
                <div class="side-label">IMPARES</div>
            </div>` : ''}
        </div>
    `;

    const colPar = card.querySelector(`#col-par-${pasilloNum}`);
    const colImp = card.querySelector(`#col-imp-${pasilloNum}`);

    let imparesOrder = [1, 3, 5, 7];
    let paresOrder = [2, 4, 6, 8];

    if (ubicacionSector === "TOP") {
        imparesOrder = imparesOrder.reverse();
        paresOrder = paresOrder.reverse();
    }

    if (colPar) paresOrder.forEach(b => colPar.appendChild(createBayCard(pasilloKey, b)));
    if (colImp) imparesOrder.forEach(b => colImp.appendChild(createBayCard(pasilloKey, b)));

    return card;
}

function render() {
    const vista = viewSelect.value;
    const selected = getSelectedPasillos();

    mapsContainer.innerHTML = "";

    if (selected.length === 0) {
        mapsContainer.innerHTML = `<div class="loading-overlay">Seleccione al menos un pasillo.</div>`;
        return;
    }

    if (vista === "PB") {
        renderPlantaBaja(selected);
    } else if (vista === "PA") {
        renderPlantaAlta(selected);
    } else if (CONFIG_AIP02[vista]) {
        renderAIP02Layout(selected);
    }

    actualizarResumenKPIs(selected);
}

function actualizarResumenKPIs(selectedPasillos) {
    let grandLineas = 0;
    let grandLpnsSet = new Set();
    let grandSkusSet = new Set();
    let grandCumplimientoCount = 0;

    selectedPasillos.forEach(pKey => {
        const rawP = DATA[pKey] || {};
        Object.values(rawP).forEach(b => {
            const bFilt = filtrarBahiaPorCurva(b);
            grandLineas += bFilt.lineasCount;
            grandCumplimientoCount += bFilt.cumplimientoCount;
            bFilt.lpnsSet.forEach(lpn => grandLpnsSet.add(lpn));
            bFilt.skusSet.forEach(sku => grandSkusSet.add(sku));
        });
    });

    const promCumplimiento = grandLineas > 0 ? Math.round((grandCumplimientoCount / grandLineas) * 100) : 0;

    document.getElementById("totalLineas").textContent = grandLineas.toLocaleString();
    document.getElementById("totalLpns").textContent = grandLpnsSet.size.toLocaleString();
    document.getElementById("totalSkus").textContent = grandSkusSet.size.toLocaleString();
    document.getElementById("kpiCumplimiento").textContent = promCumplimiento + "%";
}

function abrirModalNiveles(pasilloKey, bahiaNum, bayData) {
    const pasilloNum = pasilloKey.split('_')[0];
    modalTitle.textContent = `Pasillo ${pasilloNum} - Bahía ${bahiaNum}`;

    const bayFiltrada = filtrarBahiaPorCurva(bayData);
    modalSubtitle.textContent = `Total Líneas (Filtro: ${SELECTED_CURVA}): ${bayFiltrada ? bayFiltrada.lineasCount : 0}`;

    modalBody.innerHTML = "";

    if (!bayData || bayData.lineasCount === 0) {
        modalBody.innerHTML = `<div style="text-align:center; padding: 30px; color: #64748b;">No hay líneas registradas en esta bahía.</div>`;
        modalNiveles.classList.add("active");
        return;
    }

    [5, 4, 3, 2, 1].forEach(n => {
        const nData = bayData.niveles?.[n] || { lineasCount: 0, teorica: 'S/A', cumplimientoCount: 0, items: [] };

        let itemsFiltrados = (nData.items || []).filter(it => {
            if (SELECTED_CURVA === "TODAS") return true;
            return it.curvaReal.startsWith(SELECTED_CURVA);
        });

        const numLineasNivel = itemsFiltrados.length;
        const cumplimientoNivel = itemsFiltrados.filter(it => it.esConforme).length;
        const pctOk = numLineasNivel > 0 ? Math.round((cumplimientoNivel / numLineasNivel) * 100) : 0;

        const levelRow = document.createElement("div");
        levelRow.className = "level-row";

        let itemsHTML = itemsFiltrados.map(it => `
            <span class="item-chip" style="border-left: 3px solid ${it.esConforme ? '#16a34a' : '#dc2626'}">
                LPN: ${it.lpn} | SKU: ${it.sku} [${it.curvaReal}]
            </span>
        `).join('') || '<span style="color:#94a3b8; font-size:11px;">Nivel Vacío</span>';

        levelRow.innerHTML = `
            <div>
                <div class="level-badge">NIVEL ${n}</div>
                <div style="font-size:11px; color:#64748b;">Curva: ${nData.teorica}</div>
            </div>
            <div>
                <strong style="font-size:13px;">${numLineasNivel} Líneas</strong>
                <div style="font-size:11px; font-weight:700; color:${pctOk >= 80 ? '#15803d' : '#b91c1c'};">${numLineasNivel > 0 ? pctOk + '% OK' : 'N/A'}</div>
            </div>
            <div class="level-items">${itemsHTML}</div>
        `;

        modalBody.appendChild(levelRow);
    });

    modalNiveles.classList.add("active");
}

function setupEventListeners() {
    viewSelect.addEventListener("change", () => {
        fillPasillos();
    });

    curvaFilter.addEventListener("change", (e) => {
        SELECTED_CURVA = e.target.value;
        render();
    });

    btnToggleCompact.addEventListener("click", () => {
        IS_COMPACT_MODE = !IS_COMPACT_MODE;
        btnToggleCompact.classList.toggle("active", IS_COMPACT_MODE);
        btnToggleCompact.textContent = IS_COMPACT_MODE ? "🔍 Vista Detallada" : "📊 Vista Compacta (Gerencial)";
        render();
    });

    multiButton.addEventListener("click", (e) => {
        e.stopPropagation();
        multiDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".multi-select")) multiDropdown.classList.remove("open");
    });

    btnSelectAll.addEventListener("click", () => {
        pasilloOptions.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = true);
        render();
    });

    btnClearAll.addEventListener("click", () => {
        pasilloOptions.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
        render();
    });

    modalClose.addEventListener("click", () => modalNiveles.classList.remove("active"));
}
