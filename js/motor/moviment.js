/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/motor/moviment.js
 * ROL: El món del passadís: com es mou el personatge (limitador de velocitat,
 *      teclat), la posició d'una gràfica poligonal en un instant i el
 *      remostreig d'una gravació a una quadrícula de temps uniforme.
 * ARQUITECTURA: Pur, sense DOM. El fan servir la interfície (js/ui/*) i els
 *      tests de Node. Unitats: segons i metres; x és la distància a la porta
 *      (0 = porta, L = 10 = finestra).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Moviment = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var CONFIG = {
        L: 10, // llargada del passadís (m)
        vMax: 2.5, // velocitat màxima (m/s), aprovada per l'usuari el 19/10/2026
        vTeclat: 1, // fletxes (m/s)
        vTeclatRapid: 2, // fletxes + Maj (m/s)
        dt: 0.05, // quadrícula del remostreig (s)
        dtMaxFotograma: 0.1, // un fotograma més llarg (pestanya en segon pla) es retalla
    };

    var limita = function (v, a, b) {
        return v < a ? a : v > b ? b : v;
    };

    /**
     * Un pas del personatge cap a l'objectiu xObj, sense passar de vMax:
     * x_{k+1} = x_k + clamp(x* − x_k, −vMax·dt, vMax·dt), i sempre dins del passadís.
     */
    function pas(x, xObj, dt, vMax) {
        if (vMax === undefined) vMax = CONFIG.vMax;
        var d = vMax * dt;
        return limita(x + limita(xObj - x, -d, d), 0, CONFIG.L);
    }

    /** Un pas amb les fletxes: dir = −1 (cap a la porta), 0 o +1; rapid = Maj premuda. */
    function pasTeclat(x, dir, rapid, dt) {
        var v = rapid ? CONFIG.vTeclatRapid : CONFIG.vTeclat;
        return limita(x + dir * v * dt, 0, CONFIG.L);
    }

    /** La posició d'una gràfica poligonal [[t, x], …] en l'instant t (fora del rang, l'extrem més proper). */
    function xDe(vertexs, t) {
        var n = vertexs.length;
        if (t <= vertexs[0][0]) return vertexs[0][1];
        if (t >= vertexs[n - 1][0]) return vertexs[n - 1][1];
        for (var i = 1; i < n; i++) {
            var a = vertexs[i - 1],
                b = vertexs[i];
            if (t <= b[0]) return a[1] + ((b[1] - a[1]) * (t - a[0])) / (b[0] - a[0]);
        }
        return vertexs[n - 1][1];
    }

    /** Els instants de la quadrícula: 0, dt, 2·dt, …, T (sense errors d'arrodoniment acumulats). */
    function temps(T, dt) {
        if (dt === undefined) dt = CONFIG.dt;
        var n = Math.round(T / dt),
            out = [];
        for (var i = 0; i <= n; i++) out.push(Math.round(i * dt * 1e6) / 1e6);
        return out;
    }

    /**
     * Remostreja una gravació [{t, x}] (instants creixents, no uniformes) a la quadrícula de 0 a T
     * per interpolació lineal. Abans de la primera mostra i després de l'última, el valor de l'extrem.
     * @returns {number[]} x a cada instant de temps(T, dt)
     */
    function remostreja(mostres, T, dt) {
        var ts = temps(T, dt),
            out = [],
            j = 0,
            n = mostres.length;
        if (!n)
            return ts.map(function () {
                return 0;
            });
        for (var i = 0; i < ts.length; i++) {
            var t = ts[i];
            while (j < n - 1 && mostres[j + 1].t < t) j++;
            var a = mostres[j],
                b = mostres[Math.min(j + 1, n - 1)];
            if (t <= mostres[0].t) out.push(mostres[0].x);
            else if (t >= mostres[n - 1].t) out.push(mostres[n - 1].x);
            else if (b.t === a.t) out.push(b.x);
            else out.push(a.x + ((b.x - a.x) * (t - a.t)) / (b.t - a.t));
        }
        return out;
    }

    /** La gràfica objectiu a la quadrícula. */
    function mostresObjectiu(vertexs, T, dt) {
        return temps(T, dt).map(function (t) {
            return xDe(vertexs, t);
        });
    }

    return {
        CONFIG: CONFIG,
        pas: pas,
        pasTeclat: pasTeclat,
        xDe: xDe,
        temps: temps,
        remostreja: remostreja,
        mostresObjectiu: mostresObjectiu,
    };
});
