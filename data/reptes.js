/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: data/reptes.js
 * ROL: Els reptes dels modes «Reprodueix», «Explica» i «Dibuixa».
 * ARQUITECTURA: Dades (window.CAMINA_REPTES; també es carrega amb Node).
 *   vertexs: [[t (s), x (m)], …]: t creixent, comença a 0 i acaba a «durada»;
 *            0 ≤ x ≤ 10; cap tram més de pressa que 0,8 · vMax = 2 m/s; tot
 *            múltiple de 0,5 (perquè al mode «Dibuixa» es pugui dibuixar exacte).
 *   Les històries (Dibuixa), les opcions (Explica) i les condicions (Dibuixa) les
 *   fan js/motor/narrador.js i js/motor/dibuix.js a partir dels vèrtexs.
 *   Nivells: N1 un tram · N2 camina i para (un tram en moviment i algun de quiet) · N3 va, para i torna ·
 *            N4 dues velocitats · N5 comença lluny de la porta.
 *   tests/reptes.test.js comprova totes aquestes regles.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.CAMINA_REPTES = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    var R = function (id, nivell, mode, vertexs) {
        return { id: id, nivell: nivell, mode: mode, durada: vertexs[vertexs.length - 1][0], vertexs: vertexs };
    };
    // prettier-ignore
    return [
        // ── Reprodueix ─────────────────────────────────────────────────────
        R('r-n1-01', 1, 'reprodueix', [[0, 0], [10, 8]]),
        R('r-n1-02', 1, 'reprodueix', [[0, 0], [6, 10]]),
        R('r-n1-03', 1, 'reprodueix', [[0, 0], [8, 4]]),
        R('r-n2-01', 2, 'reprodueix', [[0, 0], [4, 6], [10, 6]]),
        R('r-n2-02', 2, 'reprodueix', [[0, 0], [3, 0], [8, 5]]),
        R('r-n2-03', 2, 'reprodueix', [[0, 0], [6, 3], [10, 3]]),
        R('r-n3-01', 3, 'reprodueix', [[0, 0], [3, 6], [6, 6], [10, 0]]),
        R('r-n3-02', 3, 'reprodueix', [[0, 0], [5, 8], [8, 8], [12, 0]]),
        R('r-n3-03', 3, 'reprodueix', [[0, 0], [2, 3], [6, 3], [10, 1]]),
        R('r-n4-01', 4, 'reprodueix', [[0, 0], [6, 3], [10, 9]]),
        R('r-n4-02', 4, 'reprodueix', [[0, 0], [3, 6], [10, 9.5]]),
        R('r-n4-03', 4, 'reprodueix', [[0, 0], [4, 2], [8, 8]]),
        R('r-n5-01', 5, 'reprodueix', [[0, 8], [5, 2], [10, 2]]),
        R('r-n5-02', 5, 'reprodueix', [[0, 10], [4, 10], [10, 1]]),
        R('r-n5-03', 5, 'reprodueix', [[0, 4], [3, 10], [6, 10], [10, 4]]),

        // ── Explica ────────────────────────────────────────────────────────
        R('e-n1-01', 1, 'explica', [[0, 0], [10, 5]]),
        R('e-n1-02', 1, 'explica', [[0, 0], [6, 9]]),
        R('e-n1-03', 1, 'explica', [[0, 0], [10, 10]]),
        R('e-n2-01', 2, 'explica', [[0, 0], [5, 8], [10, 8]]),
        R('e-n2-02', 2, 'explica', [[0, 0], [4, 0], [10, 6]]),
        R('e-n2-03', 2, 'explica', [[0, 0], [2, 4], [10, 4]]),
        R('e-n3-01', 3, 'explica', [[0, 0], [4, 8], [6, 8], [10, 0]]),
        R('e-n3-02', 3, 'explica', [[0, 0], [5, 5], [8, 5], [12, 1]]),
        R('e-n3-03', 3, 'explica', [[0, 0], [2, 2], [6, 2], [10, 0]]),
        R('e-n4-01', 4, 'explica', [[0, 0], [3, 6], [10, 9.5]]),
        R('e-n4-02', 4, 'explica', [[0, 0], [5, 2.5], [8, 8.5]]),
        R('e-n4-03', 4, 'explica', [[0, 0], [4, 6], [10, 9]]),
        R('e-n5-01', 5, 'explica', [[0, 9], [6, 3], [10, 3]]),
        R('e-n5-02', 5, 'explica', [[0, 6], [4, 6], [8, 0]]),
        R('e-n5-03', 5, 'explica', [[0, 3], [3, 9], [6, 9], [10, 5]]),

        // ── Dibuixa ────────────────────────────────────────────────────────
        R('d-n1-01', 1, 'dibuixa', [[0, 0], [8, 8]]),
        R('d-n1-02', 1, 'dibuixa', [[0, 0], [10, 4]]),
        R('d-n1-03', 1, 'dibuixa', [[0, 0], [8, 10]]),
        R('d-n2-01', 2, 'dibuixa', [[0, 0], [2, 0], [5, 5], [10, 5]]),
        R('d-n2-02', 2, 'dibuixa', [[0, 0], [6, 6], [10, 6]]),
        R('d-n2-03', 2, 'dibuixa', [[0, 0], [3, 0], [10, 7]]),
        R('d-n3-01', 3, 'dibuixa', [[0, 0], [4, 6], [6, 6], [10, 0]]),
        R('d-n3-02', 3, 'dibuixa', [[0, 0], [3, 3], [7, 3], [10, 0]]),
        R('d-n3-03', 3, 'dibuixa', [[0, 0], [5, 10], [7, 10], [12, 2]]),
        R('d-n4-01', 4, 'dibuixa', [[0, 0], [4, 2], [10, 10]]),
        R('d-n4-02', 4, 'dibuixa', [[0, 0], [2, 4], [10, 8]]),
        R('d-n4-03', 4, 'dibuixa', [[0, 0], [6, 6], [8, 10]]),
        R('d-n5-01', 5, 'dibuixa', [[0, 10], [10, 0]]),
        R('d-n5-02', 5, 'dibuixa', [[0, 5], [3, 5], [8, 0]]),
        R('d-n5-03', 5, 'dibuixa', [[0, 2], [4, 8], [7, 8], [10, 5]]),
    ];
});
