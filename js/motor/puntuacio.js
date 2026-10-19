/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/motor/puntuacio.js
 * ROL: Com ha anat una gravació respecte de la gràfica objectiu: l'error mitjà
 *      (MAE), les estrelles i, tram a tram, QUÈ ha fet el cos («entre 2 s i 4 s
 *      anaves massa de pressa»), com a molt dos missatges.
 * ARQUITECTURA: Pur, sense DOM. Treballa amb sèries ja remostrejades a la
 *      mateixa quadrícula (js/motor/moviment.js). Tots els llindars són a
 *      CONFIG. Regles per tram (ordre = prioritat), de l'especificació §6.4:
 *        1. sentit contrari   2. calia estar quiet   3. velocitat   4. desplaçament
 *      Afegida (19/10/2026): si calia moure's i l'alumne s'ha quedat quiet
 *      (|m̂| ≤ pendentMogut), és «parat», no «sentit contrari» (el signe de 0
 *      no és el contrari de res) ni «massa a poc a poc».
 *      Cada missatge té un pes = error × durada del tram; es mostren els dos més grans.
 * DEPENDÈNCIES: cap (rep les funcions de moviment com a paràmetre quan cal)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Puntuacio = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var CONFIG = {
        estrelles: [0.4, 0.8, 1.2], // MAE ≤ 0,4 → 3★; ≤ 0,8 → 2★; ≤ 1,2 → 1★
        retall: 0.2, // s que es treuen a cada extrem d'un tram abans d'ajustar-hi el pendent
        pendentMoviment: 0.2, // |m| > això: el tram és de moviment (regla 1)
        pendentQuiet: 0.05, // |m| ≤ això: el tram és de quiet (regla 2)
        pendentMogut: 0.2, // |m̂| > això en un tram quiet: s'ha mogut (regla 2)
        massaRapid: 1.4, // m̂/m > això: massa de pressa (regla 3)
        massaLent: 0.6, // m̂/m < això: massa a poc a poc (regla 3)
        desplacament: 0.8, // |o| > això (m): massa a prop / lluny (regla 4)
        maxMissatges: 2,
        mostresMinimes: 3,
    };

    /** Error absolut mitjà entre dues sèries de la mateixa llargada. */
    function mae(a, b) {
        var s = 0;
        for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
        return a.length ? s / a.length : 0;
    }

    /** 3, 2, 1 o 0 estrelles. */
    function estrelles(e) {
        var c = CONFIG.estrelles;
        return e <= c[0] ? 3 : e <= c[1] ? 2 : e <= c[2] ? 1 : 0;
    }

    /** Pendent per mínims quadrats de [ts, xs]. */
    function pendent(ts, xs) {
        var n = ts.length,
            mt = 0,
            mx = 0,
            num = 0,
            den = 0,
            i;
        for (i = 0; i < n; i++) {
            mt += ts[i];
            mx += xs[i];
        }
        mt /= n;
        mx /= n;
        for (i = 0; i < n; i++) {
            num += (ts[i] - mt) * (xs[i] - mx);
            den += (ts[i] - mt) * (ts[i] - mt);
        }
        return den ? num / den : 0;
    }

    /**
     * Analitza cada tram de la gràfica objectiu.
     * @param {number[][]} vertexs  [[t, x], …] de l'objectiu
     * @param {number[]}   ts       instants de la quadrícula
     * @param {number[]}   alumne   x de l'alumne a cada instant
     * @param {number[]}   objectiu x de l'objectiu a cada instant
     * @returns {Array<{ k, t0, t1, m, mHat, o, regla, sentit?, pes }>}  regla: null si el tram va bé
     */
    function analitzaTrams(vertexs, ts, alumne, objectiu) {
        var C = CONFIG,
            out = [];
        for (var k = 0; k + 1 < vertexs.length; k++) {
            var t0 = vertexs[k][0],
                t1 = vertexs[k + 1][0];
            var m = (vertexs[k + 1][1] - vertexs[k][1]) / (t1 - t0);
            var a = t0 + C.retall,
                b = t1 - C.retall,
                tt = [],
                xx = [],
                dif = 0;
            for (var i = 0; i < ts.length; i++) {
                if (ts[i] < a - 1e-9 || ts[i] > b + 1e-9) continue;
                tt.push(ts[i]);
                xx.push(alumne[i]);
                dif += alumne[i] - objectiu[i];
            }
            if (tt.length < C.mostresMinimes) continue;
            var mHat = pendent(tt, xx),
                o = dif / tt.length,
                durada = b - a,
                r = { k: k, t0: t0, t1: t1, m: m, mHat: mHat, o: o, regla: null, pes: 0 };
            var signe = function (v) {
                return v > 0 ? 1 : v < 0 ? -1 : 0;
            };
            if (Math.abs(m) > C.pendentMoviment && Math.abs(mHat) <= C.pendentMogut) {
                r.regla = 'parat';
                r.pes = Math.abs(mHat - m) * durada;
            } else if (Math.abs(m) > C.pendentMoviment && signe(mHat) !== signe(m)) {
                r.regla = 'sentit';
                r.pes = Math.abs(mHat - m) * durada;
            } else if (Math.abs(m) <= C.pendentQuiet && Math.abs(mHat) > C.pendentMogut) {
                r.regla = 'quiet';
                r.pes = Math.abs(mHat) * durada;
            } else if (Math.abs(m) > C.pendentQuiet && mHat / m > C.massaRapid) {
                r.regla = 'rapid';
                r.pes = Math.abs(mHat - m) * durada;
            } else if (Math.abs(m) > C.pendentQuiet && mHat / m < C.massaLent) {
                r.regla = 'lent';
                r.pes = Math.abs(mHat - m) * durada;
            } else if (Math.abs(o) > C.desplacament) {
                r.regla = o > 0 ? 'lluny' : 'aprop';
                r.pes = Math.abs(o) * durada;
            }
            if (r.regla === 'sentit') r.sentit = m > 0 ? 'allunyar' : 'acostar';
            out.push(r);
        }
        return out;
    }

    /**
     * Si cap tram no té cap regla però la gravació no és bona: la finestra d'1 s on l'alumne
     * s'ha separat més de la línia (perquè el missatge sempre digui on mirar).
     */
    function pitjorFinestra(ts, alumne, objectiu) {
        var millor = null;
        var T = ts[ts.length - 1];
        for (var a = 0; a + 1 <= T + 1e-9; a += 0.5) {
            var s = 0,
                n = 0;
            for (var i = 0; i < ts.length; i++)
                if (ts[i] >= a - 1e-9 && ts[i] <= a + 1 + 1e-9) {
                    s += alumne[i] - objectiu[i];
                    n++;
                }
            var o = n ? s / n : 0;
            if (!millor || Math.abs(o) > Math.abs(millor.o)) millor = { t0: a, t1: a + 1, o: o };
        }
        return millor;
    }

    /**
     * Avalua una gravació.
     * @returns {{ mae, estrelles, missatges: [{ regla, t0, t1, k?, sentit? }], trams }}
     */
    function avalua(vertexs, ts, alumne, objectiu) {
        var e = mae(alumne, objectiu);
        var trams = analitzaTrams(vertexs, ts, alumne, objectiu);
        var amb = trams
            .filter(function (r) {
                return r.regla;
            })
            .sort(function (a, b) {
                return b.pes - a.pes;
            })
            .slice(0, CONFIG.maxMissatges)
            .sort(function (a, b) {
                return a.t0 - b.t0;
            });
        var missatges = amb.map(function (r) {
            return { regla: r.regla, t0: r.t0, t1: r.t1, k: r.k, sentit: r.sentit };
        });
        var est = estrelles(e);
        if (!missatges.length && est < 3) {
            var f = pitjorFinestra(ts, alumne, objectiu);
            if (f) missatges.push({ regla: f.o > 0 ? 'llunyFinestra' : 'apropFinestra', t0: f.t0, t1: f.t1 });
        }
        return { mae: e, estrelles: est, missatges: missatges, trams: trams };
    }

    return {
        CONFIG: CONFIG,
        mae: mae,
        estrelles: estrelles,
        pendent: pendent,
        analitzaTrams: analitzaTrams,
        avalua: avalua,
    };
});
