/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: tests/reptes.test.js
 * ROL: Validació de les dades (data/reptes.js):
 *   - forma: t creixent des de 0 fins a «durada», 0 ≤ x ≤ 10, múltiples de 0,5;
 *   - cada tram es pot fer: pendent ≤ 0,8 · vMax;
 *   - cada nivell té la forma que diu (N1 un tram, N2 camina i para…);
 *   - 10 o més reptes per mode, amb tots els nivells N1–N5;
 *   - Reprodueix: un alumne simulat que segueix la línia hi treu 3 estrelles;
 *   - Explica: tres opcions diferents, una de bona, deterministes;
 *   - Dibuixa: la referència compleix les seves condicions i la història diu
 *     tots els instants i llocs que calen per dibuixar-la.
 * ÚS: node tests/reptes.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const REPTES = require('../data/reptes.js');
const M = require('../js/motor/moviment.js');
const P = require('../js/motor/puntuacio.js');
const D = require('../js/motor/dibuix.js');
const N = require('../js/motor/narrador.js');
const Atzar = require('../js/motor/atzar.js');

const MODES = ['reprodueix', 'explica', 'dibuixa'];
const trams = v =>
    v.slice(1).map((p, i) => ({ dt: p[0] - v[i][0], dx: p[1] - v[i][1], m: (p[1] - v[i][1]) / (p[0] - v[i][0]) }));
const multiple = v => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9;

suite('1. Forma de les dades');
{
    const ids = new Set(),
        mal = [];
    for (const r of REPTES) {
        const v = r.vertexs;
        if (ids.has(r.id)) mal.push(`${r.id}: repetit`);
        ids.add(r.id);
        if (!MODES.includes(r.mode)) mal.push(`${r.id}: mode ${r.mode}`);
        if (![1, 2, 3, 4, 5].includes(r.nivell)) mal.push(`${r.id}: nivell ${r.nivell}`);
        if (!r.id.startsWith(r.mode[0] + '-n' + r.nivell)) mal.push(`${r.id}: l’id no diu el mode i el nivell`);
        if (v[0][0] !== 0) mal.push(`${r.id}: no comença a t = 0`);
        if (v[v.length - 1][0] !== r.durada) mal.push(`${r.id}: no acaba a la durada`);
        if (![6, 8, 10, 12].includes(r.durada)) mal.push(`${r.id}: durada ${r.durada}`);
        v.forEach((p, i) => {
            if (i && p[0] <= v[i - 1][0]) mal.push(`${r.id}: t no creix`);
            if (p[1] < 0 || p[1] > 10) mal.push(`${r.id}: x fora del passadís`);
            if (!multiple(p[0]) || !multiple(p[1])) mal.push(`${r.id}: no és múltiple de 0,5`);
        });
        trams(v).forEach(q => {
            if (Math.abs(q.m) > 0.8 * M.CONFIG.vMax + 1e-9) mal.push(`${r.id}: tram a ${q.m} m/s`);
        });
    }
    ok(`${REPTES.length} reptes: ids, modes, nivells, temps, llocs i pendents correctes`, !mal.length, mal.join(' · '));
}

suite('2. Quants n’hi ha');
{
    for (const mode of MODES) {
        const d = REPTES.filter(r => r.mode === mode);
        ok(`${mode}: 10 o més reptes (${d.length})`, d.length >= 10);
        ok(
            `${mode}: tots els nivells de N1 a N5`,
            [1, 2, 3, 4, 5].every(n => d.some(r => r.nivell === n))
        );
    }
}

suite('3. Cada nivell té la seva forma');
{
    const mal = [];
    const quiet = q => Math.abs(q.m) <= 0.05;
    for (const r of REPTES) {
        const t = trams(r.vertexs),
            x0 = r.vertexs[0][1];
        const err = msg => mal.push(`${r.id}: ${msg}`);
        if (r.nivell <= 4 && x0 !== 0) err('N1–N4 comencen a la porta');
        if (r.nivell === 5 && x0 === 0) err('N5 comença lluny de la porta');
        if (r.nivell === 1 && t.length !== 1) err('N1: un sol tram');
        if (r.nivell === 2 && !(t.filter(q => !quiet(q)).length === 1 && t.some(quiet) && t.every(q => q.m >= 0)))
            err('N2: camina i para (un sol tram en moviment, algun de quiet, sense tornar)');
        if (r.nivell === 3 && !(t.length === 3 && t[0].m > 0 && quiet(t[1]) && t[2].m < 0)) err('N3: va, para i torna');
        if (r.nivell === 4) {
            if (!(t.length === 2 && t[0].m > 0 && t[1].m > 0)) err('N4: dos trams endavant');
            else if (N.categoria(t[0].m) === N.categoria(t[1].m)) err('N4: les dues velocitats s’han de dir diferent');
        }
        // Dos trams seguits no poden ser iguals (seria un sol tram)
        t.forEach((q, i) => {
            if (i && Math.abs(q.m - t[i - 1].m) < 1e-9) err('dos trams seguits amb el mateix pendent');
        });
    }
    ok(
        'N1 un tram · N2 camina i para · N3 va, para i torna · N4 dues velocitats · N5 lluny',
        !mal.length,
        mal.join(' · ')
    );
}

suite('4. Reprodueix: es pot fer amb 3 estrelles');
{
    const mal = [];
    for (const r of REPTES) {
        // Un alumne que apunta exactament a la línia, amb fotogrames irregulars (com un navegador)
        const at = Atzar.crea(r.id);
        let t = 0,
            x = r.vertexs[0][1];
        const mostres = [{ t: 0, x }];
        while (t < r.durada) {
            const dt = 1 / 60 + (at.real() - 0.5) * 0.01;
            t = Math.min(r.durada, t + dt);
            x = M.pas(x, M.xDe(r.vertexs, t), dt);
            mostres.push({ t, x });
        }
        const ts = M.temps(r.durada);
        const a = P.avalua(r.vertexs, ts, M.remostreja(mostres, r.durada), M.mostresObjectiu(r.vertexs, r.durada));
        if (a.estrelles !== 3 || a.missatges.length)
            mal.push(`${r.id}: ${a.estrelles}★, ${a.missatges.length} missatges`);
    }
    ok(
        'tots els reptes (també els d’Explica, que després es caminen) donen 3★ sense cap missatge',
        !mal.length,
        mal.join(' · ')
    );
}

suite('5. Explica: tres opcions, una de bona');
{
    const mal = [];
    for (const r of REPTES.filter(r => r.mode === 'explica')) {
        const a = N.opcions(r.vertexs, Atzar.crea(r.id), M.CONFIG.vMax),
            b = N.opcions(r.vertexs, Atzar.crea(r.id), M.CONFIG.vMax);
        if (JSON.stringify(a) !== JSON.stringify(b)) mal.push(`${r.id}: no és determinista`);
        if (a.length !== 3 || a.filter(o => o.tipus === 'bona').length !== 1)
            mal.push(`${r.id}: no hi ha 3 opcions amb una de bona`);
        if (new Set(a.map(o => o.text)).size !== 3) mal.push(`${r.id}: textos repetits`);
        if (new Set(a.map(o => o.tipus)).size !== 3) mal.push(`${r.id}: dues falses del mateix tipus`);
        a.forEach(o => {
            if (/undefined|NaN|null/.test(o.text)) mal.push(`${r.id}: ${o.text}`);
            if (o.text.split(/\s+/).length > 70) mal.push(`${r.id}: text massa llarg`);
        });
    }
    ok(
        'opcions deterministes, diferents, sense forats, una de bona i dues falses de tipus diferents',
        !mal.length,
        mal.join(' · ')
    );
    const tipus = {};
    REPTES.filter(r => r.mode === 'explica').forEach(r =>
        N.opcions(r.vertexs, Atzar.crea(r.id), 2.5).forEach(o => (tipus[o.tipus] = (tipus[o.tipus] || 0) + 1))
    );
    ok(
        'surten els tres errors típics (dibuix, alçada, lectura)',
        tipus.dibuix && tipus.alcada && tipus.lectura,
        JSON.stringify(tipus)
    );
}

suite('6. Dibuixa: la història es pot dibuixar');
{
    const mal = [];
    for (const r of REPTES.filter(r => r.mode === 'dibuixa')) {
        const c = D.condicions(r.vertexs);
        if (D.comprova(r.vertexs, c).length) mal.push(`${r.id}: la referència no compleix les condicions`);
        const h = N.historia(r.vertexs);
        // Tots els instants dels vèrtexs (menys el 0) i tots els llocs hi han de sortir
        r.vertexs.slice(1).forEach(p => {
            if (!h.includes(N.nombre(p[0]) + ' s')) mal.push(`${r.id}: la història no diu ${p[0]} s`);
        });
        r.vertexs.forEach((p, i) => {
            const quietAbans = i > 0 && r.vertexs[i - 1][1] === p[1];
            if (!quietAbans && !h.includes(N.llocA(p[1]))) mal.push(`${r.id}: la història no diu ${N.llocA(p[1])}`);
        });
        // I una gràfica que fa una altra cosa no les compleix
        const altra = r.vertexs.map(p => [p[0], p[1] <= 5 ? p[1] + 2 : p[1] - 2]);
        if (!D.comprova(altra, c).length) mal.push(`${r.id}: una gràfica desplaçada 2 m també passaria`);
    }
    ok('referència vàlida, història completa i condicions que distingeixen', !mal.length, mal.join(' · '));
}

finish('REPTES');
