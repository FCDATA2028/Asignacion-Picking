const SUPABASE_URL = "https://qaxxggokkclsfsjfmtbs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xbiL5biH5Y9jUf9wfM-7Fg_C2TqshKs";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let MAP_SKU = new Map();
let MAP_UBICACION = new Map();
let DATA = {};

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
const areaSelect = document.getElementById("area");
const multiButton = document.getElementById("multiButton");
const multiDropdown = document.getElementById("multiDropdown");
const pasilloOptions = document.getElementById("pasilloOptions");
const mapsContainer = document.getElementById("mapsContainer");
const btnSelectAll = document.getElementById("btnSelectAll");
const btnClearAll = document.getElementById("btnClearAll");
const statusSub = document.getElementById("status-sub");

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
        fillAreas();
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
            const area = partes[0].toUpperCase();
            const pasillo = partes[1];
            const bahia = parseInt(partes[2], 10);
            const nivel = partes.length >= 4 ? parseInt(partes[3], 10) : 1;

            if (!isNaN(bahia)) {
                if (!DATA[area]) DATA[area] = {};
                if (!DATA[area][pasillo]) DATA[area][pasillo] = {};
                if (!DATA[area][pasillo][bahia]) {
                    DATA[area][pasillo][bahia] = {
                        lineasCount: 0,
                        lpnsSet: new Set(),
                        skusSet: new Set(),
                        teorica: 'S/A',
                        niveles: {},
                        cumplimientoCount: 0
                    };
                }

                const bahiaObj = DATA[area][pasillo][bahia];
                const codigoProd = row.codigo ? String(row.codigo).trim() : '';
                const lpnCod = row.lpn ? String(row.lpn).trim() : 'SIN LPN';
                const curvaReal = MAP_SKU.get(codigoProd) || 'S/C';

                const metaUbi = MAP_UBICACION.get(ubClean) || { curvaTeorica: 'S/A' };
                if (metaUbi.curvaTeorica !== 'S/A') bahiaObj.teorica = metaUbi.curvaTeorica;

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

function fillAreas() {
    areaSelect.innerHTML = "";
    const areas = Object.keys(DATA).sort();
    areas.forEach(area => {
        const opt = document.createElement("option");
        opt.value = area;
        opt.textContent = area;
        areaSelect.appendChild(opt);
    });

    if (areas.length > 0) {
        areaSelect.value = areas[0];
    }
    fillPasillos();
}

function fillPasillos() {
    const area = areaSelect.value;
    const vista = viewSelect.value;
    pasilloOptions.innerHTML = "";

    const todosPasillos = Object.keys(DATA[area] || {}).sort((a, b) => Number(a) - Number(b));
    let pasillosFiltrados = [];

    if (vista === "PB") {
        pasillosFiltrados = todosPasillos.filter(p => Number(p) === 101 || Number(p) === 102);
    } else if (vista === "PA") {
        pasillosFiltrados = todosPasillos.filter(p => Number(p) >= 201 && Number(p) <= 228);
    } else if (CONFIG_AIP02[vista]) {
        const conf = CONFIG_AIP02[vista];
        pasillosFiltrados = [...conf.arriba, ...conf.abajo];
    }

    pasillosFiltrados.forEach(pasillo => {
        const label = document.createElement("label");
        label.className = "checkbox-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = pasillo;
        checkbox.checked = true;
        checkbox.addEventListener("change", render);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode("Pasillo " + pasillo));
        pasilloOptions.appendChild(label);
    });

    render();
}

function getSelectedPasillos() {
    return Array.from(pasilloOptions.querySelectorAll("input[type='checkbox']:checked")).map(cb => cb.value);
}

function getFillColor(count, max) {
    if (count === 0 || max === 0) return "#ffffff";
    const ratio = Math.min(1, count / max);
    const lightness = Math.round(98 - (ratio * 18));
    return `hsl(210, 20%, ${lightness}%)`;
}

function createBayCard(area, pasillo, bahiaNum, maxLineas) {
    const rawData = DATA[area]?.[pasillo]?.[bahiaNum];
    const totalLineas = rawData ? rawData.lineasCount : 0;
    const totalLpns = rawData ? rawData.lpnsSet.size : 0;
    const totalSkus = rawData ? rawData.skusSet.size : 0;
    const teorica = rawData ? rawData.teorica : 'S/A';
    const cumplimiento = (rawData && rawData.lineasCount > 0) ? Math.round((rawData.cumplimientoCount / rawData.lineasCount) * 100) : 0;

    let seccionTag = "A";
    if (bahiaNum >= 4 && bahiaNum <= 6) seccionTag = "B";
    if (bahiaNum >= 7) seccionTag = "C";

    const el = document.createElement("div");
    el.className = "bay-card";
    el.style.backgroundColor = getFillColor(totalLineas, maxLineas);

    let kpiClass = "kpi-none";
    if (totalLineas > 0) {
        if (cumplimiento >= 80) kpiClass = "kpi-good";
        else if (cumplimiento >= 50) kpiClass = "kpi-mid";
        else kpiClass = "kpi-bad";
    }

    el.innerHTML = `
        <div class="bay-header-line">
            <span class="bay-num">B.${bahiaNum} <small style="color:#0284c7;">(${seccionTag})</small></span>
            <span class="bay-curva-tag">${teorica}</span>
        </div>
        <div class="bay-main-info">
            <div class="bay-metrics">
                <span class="bay-lpn-val">${totalLineas} <small style="font-size:9px;">Lín.</small></span>
                <span class="bay-sku-val">${totalLpns} LPN | ${totalSkus} SKU</span>
            </div>
            <span class="bay-kpi-badge ${kpiClass}">${totalLineas > 0 ? cumplimiento + '%' : 'N/A'}</span>
        </div>
    `;

    el.addEventListener("click", () => abrirModalNiveles(area, pasillo, bahiaNum, rawData));
    return el;
}

function renderPlantaBaja(area, selectedPasillos) {
    const cedisGrid = document.createElement("div");
    cedisGrid.className = "cedis-grid-pb";

    if (selectedPasillos.includes("101")) {
        cedisGrid.appendChild(createAisleModulePB(area, "101"));
    } else {
        cedisGrid.appendChild(document.createElement("div"));
    }

    const centralCorridor = document.createElement("div");
    centralCorridor.className = "central-rep-corridor";
    centralCorridor.textContent = "PASILLO CENTRAL REP";
    cedisGrid.appendChild(centralCorridor);

    if (selectedPasillos.includes("102")) {
        cedisGrid.appendChild(createAisleModulePB(area, "102"));
    } else {
        cedisGrid.appendChild(document.createElement("div"));
    }

    mapsContainer.appendChild(cedisGrid);
}

function createAisleModulePB(area, pasillo) {
    const aisleBlock = document.createElement("div");
    aisleBlock.className = "aisle-block";

    aisleBlock.innerHTML = `
        <div class="aisle-title">PASILLO ${pasillo}</div>
        <div class="aisle-sub-headers">
            <div>IMPARES</div>
            <div>MSP</div>
            <div>PARES</div>
        </div>
        <div class="aisle-content-grid-pb">
            <div class="bay-column" id="col-imp-${pasillo}"></div>
            <div class="msp-column-grid" id="col-msp-${pasillo}"></div>
            <div class="bay-column" id="col-par-${pasillo}"></div>
        </div>
    `;

    const colImp = aisleBlock.querySelector(`#col-imp-${pasillo}`);
    const colMsp = aisleBlock.querySelector(`#col-msp-${pasillo}`);
    const colPar = aisleBlock.querySelector(`#col-par-${pasillo}`);

    for (let b = 1; b <= 20; b += 2) colImp.appendChild(createBayCard(area, pasillo, b, 250));
    for (let b = 2; b <= 20; b += 2) colPar.appendChild(createBayCard(area, pasillo, b, 250));

    const mspList = CONFIG_MSP_PB_AIP01[pasillo] || [];
    mspList.forEach(item => {
        let mspLineas = 0;
        for (let b = item.min; b <= item.max; b++) {
            const bObj = DATA[area]?.[pasillo]?.[b];
            if (bObj) mspLineas += bObj.lineasCount;
        }

        const mspBlock = document.createElement("div");
        mspBlock.className = "msp-card-block";
        mspBlock.innerHTML = `
            <div class="msp-card-title">${item.msp}</div>
            <div class="msp-card-sub">Bahías ${item.min} - ${item.max}</div>
            <div class="msp-kpi-row">${mspLineas.toLocaleString()} Líneas</div>
        `;
        colMsp.appendChild(mspBlock);
    });

    return aisleBlock;
}

function renderPlantaAlta(area, selectedPasillos) {
    const gridPA = document.createElement("div");
    gridPA.className = "cedis-grid-pa";

    const stackImpares = document.createElement("div");
    stackImpares.className = "pa-aisle-stack";

    const stackMspLeft = document.createElement("div");
    stackMspLeft.className = "pa-msp-stack";

    const stackMspRight = document.createElement("div");
    stackMspRight.className = "pa-msp-stack";

    const stackPares = document.createElement("div");
    stackPares.className = "pa-aisle-stack";

    for (let p = 201; p <= 227; p += 2) {
        const pStr = String(p);
        if (selectedPasillos.includes(pStr)) stackImpares.appendChild(createAisleRowPA(area, pStr));
    }

    stackMspLeft.appendChild(createMspCardPA(area, "MSP201", "span-4"));
    stackMspLeft.appendChild(createMspCardPA(area, "MSP202", "span-3"));
    stackMspLeft.appendChild(createMspCardPA(area, "MSP203", "span-3"));
    stackMspLeft.appendChild(createMspCardPA(area, "MSP204", "span-4"));

    stackMspRight.appendChild(createMspCardPA(area, "MSP208", "span-4"));
    stackMspRight.appendChild(createMspCardPA(area, "MSP207", "span-3"));
    stackMspRight.appendChild(createMspCardPA(area, "MSP206", "span-3"));
    stackMspRight.appendChild(createMspCardPA(area, "MSP205", "span-4"));

    for (let p = 202; p <= 228; p += 2) {
        const pStr = String(p);
        if (selectedPasillos.includes(pStr)) stackPares.appendChild(createAisleRowPA(area, pStr));
    }

    gridPA.appendChild(stackImpares);
    gridPA.appendChild(stackMspLeft);
    gridPA.appendChild(stackMspRight);
    gridPA.appendChild(stackPares);

    mapsContainer.appendChild(gridPA);
}

function createAisleRowPA(area, pasillo) {
    const card = document.createElement("div");
    card.className = "pa-aisle-card";
    card.innerHTML = `
        <div class="pa-aisle-header">PASILLO ${pasillo}</div>
        <div class="pa-bay-grid">
            <div class="pa-bay-row" id="row-imp-${pasillo}"></div>
            <div class="pa-bay-row" id="row-par-${pasillo}"></div>
        </div>
    `;

    const rowImp = card.querySelector(`#row-imp-${pasillo}`);
    const rowPar = card.querySelector(`#row-par-${pasillo}`);

    for (let b = 1; b <= 9; b += 2) rowImp.appendChild(createBayCard(area, pasillo, b, 200));
    for (let b = 2; b <= 10; b += 2) rowPar.appendChild(createBayCard(area, pasillo, b, 200));

    return card;
}

function createMspCardPA(area, mspKey, spanClass) {
    const pasillosMsp = MAPA_PA_MSP_AIP01[mspKey] || [];
    let lineasTotal = 0;

    pasillosMsp.forEach(p => {
        const pObj = DATA[area]?.[p] || {};
        Object.values(pObj).forEach(b => {
            lineasTotal += b.lineasCount;
        });
    });

    const el = document.createElement("div");
    el.className = `pa-msp-card ${spanClass}`;
    el.innerHTML = `
        <div class="msp-card-title">${mspKey}</div>
        <div class="msp-kpi-row" style="margin-top:8px;">${lineasTotal.toLocaleString()} Líneas</div>
    `;
    return el;
}

function renderAIP02Layout(area, selectedPasillos) {
    const vista = viewSelect.value;
    const config = CONFIG_AIP02[vista];

    const layoutContainer = document.createElement("div");
    layoutContainer.className = "aip02-layout-grid";

    // SECTOR SUPERIOR
    const topSector = document.createElement("div");
    topSector.className = "aip02-sector";
    config.arriba.forEach(p => {
        if (selectedPasillos.includes(p)) topSector.appendChild(createAipAisleModule(area, p, "TOP"));
    });

    // MSR SUPERIOR
    const msrTopRow = document.createElement("div");
    msrTopRow.className = "msr-row-grid";
    config.msrTop.forEach(m => {
        let sumLineas = 0;
        m.pasillos.forEach(p => {
            for (let b = 1; b <= 8; b++) {
                const bObj = DATA[area]?.[p]?.[b];
                if (bObj) sumLineas += bObj.lineasCount;
            }
        });

        const msrEl = document.createElement("div");
        msrEl.className = `msr-card-h msr-span-${m.pasillos.length}`;
        msrEl.innerHTML = `
            <div class="msp-card-title">${m.id}</div>
            <div class="msp-kpi-row">${sumLineas.toLocaleString()} Líneas</div>
        `;
        msrTopRow.appendChild(msrEl);
    });

    // MSR INFERIOR
    const msrBottomRow = document.createElement("div");
    msrBottomRow.className = "msr-row-grid";
    config.msrBottom.forEach(m => {
        let sumLineas = 0;
        m.pasillos.forEach(p => {
            for (let b = 1; b <= 8; b++) {
                const bObj = DATA[area]?.[p]?.[b];
                if (bObj) sumLineas += bObj.lineasCount;
            }
        });

        const msrEl = document.createElement("div");
        msrEl.className = `msr-card-h msr-span-${m.pasillos.length}`;
        msrEl.innerHTML = `
            <div class="msp-card-title">${m.id}</div>
            <div class="msp-kpi-row">${sumLineas.toLocaleString()} Líneas</div>
        `;
        msrBottomRow.appendChild(msrEl);
    });

    // SECTOR INFERIOR
    const bottomSector = document.createElement("div");
    bottomSector.className = "aip02-sector";
    config.abajo.forEach(p => {
        if (selectedPasillos.includes(p)) bottomSector.appendChild(createAipAisleModule(area, p, "BOTTOM"));
    });

    layoutContainer.appendChild(topSector);
    layoutContainer.appendChild(msrTopRow);
    layoutContainer.appendChild(msrBottomRow);
    layoutContainer.appendChild(bottomSector);

    mapsContainer.appendChild(layoutContainer);
}

function createAipAisleModule(area, pasillo, ubicacionSector) {
    const card = document.createElement("div");
    card.className = "horizontal-aisle-card";

    const soloPares = ["101", "301", "501", "208", "408", "608"].includes(pasillo);
    const soloImpares = ["108", "308", "508", "201", "401", "601"].includes(pasillo);
    const esUnicaCara = soloPares || soloImpares;

    card.innerHTML = `
        <div class="aisle-title">PASILLO ${pasillo} ${esUnicaCara ? '<small>(1 Cara)</small>' : '<small>(2 Caras)</small>'}</div>
        <div class="horizontal-bay-grid ${esUnicaCara ? 'single-face' : 'double-face'}">
            ${!soloImpares ? `
            <div class="bay-col-side" id="col-par-${pasillo}">
                <div class="side-label">PARES</div>
            </div>` : ''}

            ${!esUnicaCara ? '<div class="aisle-physical-corridor">PASILLO</div>' : ''}

            ${!soloPares ? `
            <div class="bay-col-side" id="col-imp-${pasillo}">
                <div class="side-label">IMPARES</div>
            </div>` : ''}
        </div>
    `;

    const colPar = card.querySelector(`#col-par-${pasillo}`);
    const colImp = card.querySelector(`#col-imp-${pasillo}`);

    let imparesOrder = [1, 3, 5, 7];
    let paresOrder = [2, 4, 6, 8];

    if (ubicacionSector === "TOP") {
        imparesOrder = imparesOrder.reverse();
        paresOrder = paresOrder.reverse();
    }

    if (colPar) paresOrder.forEach(b => colPar.appendChild(createBayCard(area, pasillo, b, 150)));
    if (colImp) imparesOrder.forEach(b => colImp.appendChild(createBayCard(area, pasillo, b, 150)));

    return card;
}

function render() {
    const area = areaSelect.value;
    const vista = viewSelect.value;
    const selected = getSelectedPasillos();

    mapsContainer.innerHTML = "";

    if (selected.length === 0) {
        mapsContainer.innerHTML = `<div class="loading-overlay">Seleccione al menos un pasillo.</div>`;
        return;
    }

    if (vista === "PB") {
        renderPlantaBaja(area, selected);
    } else if (vista === "PA") {
        renderPlantaAlta(area, selected);
    } else if (CONFIG_AIP02[vista]) {
        renderAIP02Layout(area, selected);
    }

    actualizarResumenKPIs(area, selected);
}

function actualizarResumenKPIs(area, selectedPasillos) {
    let grandLineas = 0;
    let grandLpnsSet = new Set();
    let grandSkusSet = new Set();
    let totalCumplimientoSum = 0;
    let bahiasConLineas = 0;

    selectedPasillos.forEach(p => {
        const rawP = DATA[area]?.[p] || {};
        Object.values(rawP).forEach(b => {
            grandLineas += b.lineasCount;
            b.lpnsSet.forEach(lpn => grandLpnsSet.add(lpn));
            b.skusSet.forEach(sku => grandSkusSet.add(sku));
            if (b.lineasCount > 0) {
                const pct = (b.cumplimientoCount / b.lineasCount) * 100;
                totalCumplimientoSum += pct;
                bahiasConLineas++;
            }
        });
    });

    const promCumplimiento = bahiasConLineas > 0 ? Math.round(totalCumplimientoSum / bahiasConLineas) : 0;

    document.getElementById("totalLineas").textContent = grandLineas.toLocaleString();
    document.getElementById("totalLpns").textContent = grandLpnsSet.size.toLocaleString();
    document.getElementById("totalSkus").textContent = grandSkusSet.size.toLocaleString();
    document.getElementById("kpiCumplimiento").textContent = promCumplimiento + "%";
}

function abrirModalNiveles(area, pasillo, bahiaNum, bayData) {
    modalTitle.textContent = `Área: ${area} | Pasillo ${pasillo} - Bahía ${bahiaNum}`;
    modalSubtitle.textContent = `Total Líneas: ${bayData ? bayData.lineasCount : 0}`;

    modalBody.innerHTML = "";

    if (!bayData || bayData.lineasCount === 0) {
        modalBody.innerHTML = `<div style="text-align:center; padding: 30px; color: #64748b;">No hay líneas registradas en esta bahía.</div>`;
        modalNiveles.classList.add("active");
        return;
    }

    [5, 4, 3, 2, 1].forEach(n => {
        const nData = bayData.niveles?.[n] || { lineasCount: 0, teorica: 'S/A', cumplimientoCount: 0, items: [] };
        const pctOk = nData.lineasCount > 0 ? Math.round((nData.cumplimientoCount / nData.lineasCount) * 100) : 0;

        const levelRow = document.createElement("div");
        levelRow.className = "level-row";

        let itemsHTML = nData.items.map(it => `
            <span class="item-chip" style="border-left: 3px solid ${it.esConforme ? '#16a34a' : '#dc2626'}">
                LPN: ${it.lpn} | SKU: ${it.sku} [${it.curvaReal}]
            </span>
        `).join('') || '<span style="color:#94a3b8; font-size:11px;">Nivel Vacío</span>';

        levelRow.innerHTML = `
            <div>
                <div class="level-badge">NIVEL ${n}</div>
                <div style="font-size:10px; color:#64748b;">Curva: ${nData.teorica}</div>
            </div>
            <div>
                <strong style="font-size:12px;">${nData.lineasCount} Líneas</strong>
                <div style="font-size:10px; font-weight:700; color:${pctOk >= 80 ? '#15803d' : '#b91c1c'};">${nData.lineasCount > 0 ? pctOk + '% OK' : 'N/A'}</div>
            </div>
            <div class="level-items">${itemsHTML}</div>
        `;

        modalBody.appendChild(levelRow);
    });

    modalNiveles.classList.add("active");
}

function setupEventListeners() {
    viewSelect.addEventListener("change", fillPasillos);
    areaSelect.addEventListener("change", fillPasillos);

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
