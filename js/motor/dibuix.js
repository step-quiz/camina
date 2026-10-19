/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/motor/dibuix.js
 * ROL: Mode «Dibuixa»: les gràfiques que dibuixa l'alumne (vèrtexs arrodonits a
 *      0,5 s i 0,5 m), què no es pot dibuixar i per què, i les condicions de
 *      cada història (deduïdes de la gràfica de referència).
 * ARQUITECTURA: Pur, sense DOM. Una gràfica és [[t, x], …] amb t creixent.
 *      Errors (els textos són a js/ui/textos.js):
 *        'enrere'  → un vèrtex abans de l'anterior: tornar enrere en el temps
 *        'vertical'→ dos vèrtexs al mateix instant: ser a dos llocs alhora
 *        'rapid'   → més de vMax: no es pot anar tan de pressa
 *        'fora'    → fora dels eixos
 *      Condicions: { tipus: 'punt', t, x, tol } (als t s, a x ± tol)
 *                  { tipus: 'quiet', t: [a, b], x, tol } (de a a b, sempre a x ± tol)
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Dibuix = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var PAS = 0.5,
        TOL = 0.5,
        EPS = 1e-9;

    var arrodoneix = function (v) {
        return Math.round(v / PAS) * PAS;
    };

    /** Arrodoneix un punt a la quadrícula de 0,5 i el posa dins dels eixos. */
    function enganxa(t, x, T, L) {
        return [Math.min(Math.max(arrodoneix(t), 0), T), Math.min(Math.max(arrodoneix(x), 0), L)];
    }

    /** Pot anar el punt p just després del vèrtex a? Retorna null o el codi d'error. */
    function errorTram(a, p, vMax) {
        if (p[0] < a[0] - EPS) return 'enrere';
        if (Math.abs(p[0] - a[0]) < EPS) return 'vertical';
        if (Math.abs(p[1] - a[1]) / (p[0] - a[0]) > vMax + EPS) return 'rapid';
        return null;
    }

    /**
     * Afegeix un vèrtex al final. El primer va sempre a t = 0 (és on comences).
     * @returns {{ ok: true, vertexs } | { ok: false, error }}
     */
    function afegeix(vertexs, p, o) {
        if (p[0] < -EPS || p[0] > o.T + EPS || p[1] < -EPS || p[1] > o.L + EPS) return { ok: false, error: 'fora' };
        if (!vertexs.length) return { ok: true, vertexs: [[0, p[1]]], primer: p[0] !== 0 };
        var u = vertexs[vertexs.length - 1];
        if (u[0] >= o.T - EPS) return { ok: false, error: 'acabat' };
        var e = errorTram(u, p, o.vMax);
        if (e) return { ok: false, error: e };
        return { ok: true, vertexs: vertexs.concat([p]) };
    }

    /** Mou el vèrtex i a p (el primer només amunt i avall, a t = 0). */
    function mou(vertexs, i, p, o) {
        if (p[1] < -EPS || p[1] > o.L + EPS || p[0] < -EPS || p[0] > o.T + EPS) return { ok: false, error: 'fora' };
        var q = i === 0 ? [0, p[1]] : p;
        if (i > 0) {
            var e = errorTram(vertexs[i - 1], q, o.vMax);
            if (e) return { ok: false, error: e };
        }
        if (i + 1 < vertexs.length) {
            var e2 = errorTram(q, vertexs[i + 1], o.vMax);
            if (e2) return { ok: false, error: e2 === 'enrere' ? 'enrere' : e2 };
        }
        var nou = vertexs.slice();
        nou[i] = q;
        return { ok: true, vertexs: nou };
    }

    /** La gràfica arriba fins al final (t = T)? */
    function completa(vertexs, T) {
        return vertexs.length >= 2 && Math.abs(vertexs[vertexs.length - 1][0] - T) < EPS;
    }

    // Posició d'una gràfica en un instant (còpia mínima per no dependre de moviment.js)
    function xDe(v, t) {
        if (t <= v[0][0]) return v[0][1];
        for (var i = 1; i < v.length; i++)
            if (t <= v[i][0] + EPS)
                return v[i - 1][1] + ((v[i][1] - v[i - 1][1]) * (t - v[i - 1][0])) / (v[i][0] - v[i - 1][0]);
        return v[v.length - 1][1];
    }

    /**
     * Les condicions d'una història, a partir de la gràfica de referència: on has de ser a cada
     * vèrtex i, als trams de quiet, que no et moguis.
     */
    function condicions(ref) {
        var out = [];
        ref.forEach(function (p) {
            out.push({ tipus: 'punt', t: p[0], x: p[1], tol: TOL });
        });
        for (var k = 0; k + 1 < ref.length; k++)
            if (ref[k][1] === ref[k + 1][1])
                out.push({ tipus: 'quiet', t: [ref[k][0], ref[k + 1][0]], x: ref[k][1], tol: TOL });
        return out;
    }

    /**
     * Comprova una gràfica amb les condicions. En una gràfica poligonal, el màxim i el mínim d'un
     * interval són als extrems o a un vèrtex de dins: n'hi ha prou de mirar aquests punts.
     * @returns {Array<{ c, valor }>} les condicions que no es compleixen (valor: on és la gràfica)
     */
    function comprova(vertexs, conds) {
        var falla = [];
        conds.forEach(function (c) {
            if (c.tipus === 'punt') {
                var v = xDe(vertexs, c.t);
                if (Math.abs(v - c.x) > c.tol + EPS) falla.push({ c: c, valor: v });
            } else {
                var punts = [c.t[0], c.t[1]];
                vertexs.forEach(function (p) {
                    if (p[0] > c.t[0] && p[0] < c.t[1]) punts.push(p[0]);
                });
                var pitjor = null;
                punts.forEach(function (t) {
                    var v = xDe(vertexs, t);
                    if (
                        Math.abs(v - c.x) > c.tol + EPS &&
                        (!pitjor || Math.abs(v - c.x) > Math.abs(pitjor.valor - c.x))
                    )
                        pitjor = { c: c, valor: v, t: t };
                });
                if (pitjor) falla.push(pitjor);
            }
        });
        return falla;
    }

    return {
        PAS: PAS,
        TOL: TOL,
        enganxa: enganxa,
        errorTram: errorTram,
        afegeix: afegeix,
        mou: mou,
        completa: completa,
        condicions: condicions,
        comprova: comprova,
    };
});
