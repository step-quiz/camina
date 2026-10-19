/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/motor/narrador.js
 * ROL: Converteix una gràfica en una història en català («Comences a la porta.
 *      Camines a poc a poc cap a la finestra i als 4 s ets a 3 m de la porta…»)
 *      i fabrica les històries falses del mode «Explica», cadascuna feta amb un
 *      error típic de lectura de gràfiques:
 *        'dibuix'  → llegir la gràfica com un dibuix del camí («puges una pujada»)
 *        'alcada'  → confondre l'alçada amb la velocitat («més amunt, més de pressa»)
 *        'lectura' → la història bona, però amb un temps o un lloc mal llegit
 * ARQUITECTURA: Pur, sense DOM. Els textos depenen només de la gràfica (i, per
 *      triar i barrejar, d'una llavor): el mateix repte sempre dona el mateix.
 * DEPENDÈNCIES: un objecte d'atzar amb .tria i .barreja (js/motor/atzar.js)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Narrador = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var L = 10;
    var VEL = { lent: 0.7, normal: 1.3 }; // |m| ≤ 0,7 a poc a poc · ≤ 1,3 a pas normal · més, de pressa
    var QUIET = 0.05;

    /** 1.5 → «1,5»; 2 → «2» */
    function nombre(v) {
        var r = Math.round(v * 100) / 100;
        return String(r).replace('.', ',');
    }
    function majuscula(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function velocitat(m) {
        var a = Math.abs(m);
        return a <= VEL.lent ? 'a poc a poc' : a <= VEL.normal ? 'a pas normal' : 'de pressa';
    }
    /** La categoria de velocitat (0 lent, 1 normal, 2 de pressa): els tests la fan servir. */
    function categoria(m) {
        var a = Math.abs(m);
        return a <= VEL.lent ? 0 : a <= VEL.normal ? 1 : 2;
    }
    /** «a la porta», «a la finestra», «al mig del passadís», «a 3 m de la porta» */
    function llocA(x) {
        if (x === 0) return 'a la porta';
        if (x === L) return 'a la finestra';
        if (x === L / 2) return 'al mig del passadís';
        return 'a ' + nombre(x) + ' m de la porta';
    }
    var s = function (t) {
        return nombre(t) + ' s';
    };
    function trams(v) {
        var out = [];
        for (var k = 0; k + 1 < v.length; k++) {
            var dt = v[k + 1][0] - v[k][0],
                dx = v[k + 1][1] - v[k][1];
            out.push({
                k: k,
                t0: v[k][0],
                t1: v[k + 1][0],
                x0: v[k][1],
                x1: v[k + 1][1],
                m: dx / dt,
                quiet: Math.abs(dx / dt) <= QUIET,
            });
        }
        return out;
    }

    /**
     * La història d'una gràfica.
     * @param {number[][]} v  [[t, x], …]
     * @returns {string}
     */
    // Connectors entre frases: —, Després, Llavors, Després… i «Finalment» a l'última (si n'hi ha 3 o més)
    function connector(i, n) {
        if (i === 0) return '';
        if (i === n - 1 && n >= 3) return 'Finalment';
        return i % 2 ? 'Després' : 'Llavors';
    }

    function historia(v) {
        var tr = trams(v),
            T = v[v.length - 1][0],
            frases = ['Comences ' + llocA(v[0][1]) + '.'];
        tr.forEach(function (q, i) {
            var ultim = i === tr.length - 1,
                f;
            if (q.quiet) {
                if (i === 0)
                    f = ultim ? 'Hi esperes tota l’estona, ' + s(T) + '.' : 'Hi esperes fins als ' + s(q.t1) + '.';
                else
                    f =
                        connector(i, tr.length) +
                        ' t’hi quedes quiet ' +
                        (ultim ? 'fins al final (' + s(T) + ').' : 'fins als ' + s(q.t1) + '.');
            } else {
                var verb = q.m > 0 ? 'camines' : 'tornes',
                    cap = q.m > 0 ? 'cap a la finestra' : 'cap a la porta';
                var fiLandmark = (q.m > 0 && q.x1 === L) || (q.m < 0 && q.x1 === 0);
                f = verb + ' ' + velocitat(q.m) + ' ';
                f += fiLandmark
                    ? 'fins ' + llocA(q.x1) + ', on arribes als ' + s(q.t1) + '.'
                    : cap + ' i als ' + s(q.t1) + ' ets ' + llocA(q.x1) + '.';
                f = (i === 0 ? '' : connector(i, tr.length) + ' ') + f;
            }
            frases.push(majuscula(f));
        });
        return frases.join(' ');
    }

    // Uneix accions amb temps: «Fins als 4 s A; després B fins als 7 s i al final C.»
    function ambTemps(tr, accio) {
        var parts = [];
        tr.forEach(function (q, i) {
            var a = accio(q, i);
            if (i === 0) parts.push((tr.length === 1 ? 'Durant ' + s(q.t1) + ' ' : 'Fins als ' + s(q.t1) + ' ') + a);
            else if (i === tr.length - 1) parts.push('i al final ' + a);
            else parts.push((i % 2 ? 'després ' : 'llavors ') + a + ' fins als ' + s(q.t1));
        });
        return majuscula(parts.join(tr.length > 2 ? '; ' : ' ').replace('; i al final', ' i al final')) + '.';
    }

    /** Error 'dibuix': la gràfica com si fos el perfil d'un camí de muntanya. */
    function falsaDibuix(v) {
        var tr = trams(v);
        var inici = v[0][1] <= 2 ? 'Comences al peu d’una muntanya.' : 'Comences a mitja muntanya.';
        var adj = function (m) {
            var c = categoria(m);
            return c === 0 ? ' suau' : c === 2 ? ' molt costeruda' : '';
        };
        return (
            inici +
            ' ' +
            ambTemps(tr, function (q) {
                if (q.quiet) return 'camines per un tros pla';
                return q.m > 0 ? 'puges una pujada' + adj(q.m) : 'baixes una baixada' + adj(q.m);
            })
        );
    }

    /** Error 'alcada': com més amunt és la línia, més de pressa vas. */
    function falsaAlcada(v) {
        var tr = trams(v);
        return (
            'Comences ' +
            llocA(v[0][1]) +
            '. ' +
            ambTemps(tr, function (q, i) {
                if (q.quiet) {
                    if (q.x0 === 0) return 'estàs quiet';
                    return q.x0 >= L / 2 ? 'vas sempre igual, molt de pressa' : 'vas sempre igual, a poc a poc';
                }
                // Com més inclinada, més «accelera» o «frena» (la mateixa confusió)
                var c = categoria(q.m);
                if (q.m > 0) return ['acceleres a poc a poc', 'vas accelerant', 'acceleres de cop'][c];
                var frena = ['frenes a poc a poc', 'vas frenant', 'frenes de cop'][c];
                return q.x1 === 0 ? frena + ' fins que t’atures' : frena;
            })
        );
    }

    /**
     * Error 'lectura': la història bona amb una dada mal llegida. Amb 2 trams o més es mou un vèrtex
     * de dins 1,5 o 2 s (sense passar dels veïns ni de vMax); amb un tram, el lloc d'arribada canvia 3 m.
     */
    function falsaLectura(v, atzar, vMax) {
        var tr = trams(v);
        if (tr.length >= 2) {
            var opcions = [];
            for (var j = 1; j < v.length - 1; j++)
                [-2, -1.5, 1.5, 2].forEach(function (d) {
                    var t = v[j][0] + d;
                    if (t <= v[j - 1][0] + 0.5 || t >= v[j + 1][0] - 0.5) return;
                    var w = v.map(function (p) {
                        return p.slice();
                    });
                    w[j][0] = t;
                    var ok = true;
                    for (var k = 0; k + 1 < w.length; k++)
                        if (Math.abs(w[k + 1][1] - w[k][1]) / (w[k + 1][0] - w[k][0]) > vMax) ok = false;
                    if (ok) opcions.push(w);
                });
            if (opcions.length) return historia(atzar.tria(opcions));
        }
        var w2 = v.map(function (p) {
            return p.slice();
        });
        var u = w2[w2.length - 1];
        u[1] = u[1] >= 6 ? u[1] - 3 : u[1] + 3;
        return historia(w2);
    }

    /**
     * Les tres opcions del mode «Explica»: la bona i dues falses (de tipus diferents), barrejades.
     * @returns {Array<{ tipus: 'bona'|'dibuix'|'alcada'|'lectura', text }>}
     */
    function opcions(v, atzar, vMax) {
        var falses = atzar.barreja(['dibuix', 'alcada', 'lectura']).slice(0, 2);
        var fab = { dibuix: falsaDibuix, alcada: falsaAlcada, lectura: falsaLectura };
        var llista = [{ tipus: 'bona', text: historia(v) }].concat(
            falses.map(function (t) {
                return { tipus: t, text: fab[t](v, atzar, vMax || 2.5) };
            })
        );
        return atzar.barreja(llista);
    }

    /**
     * Mode «Lliure»: quina pregunta de reflexió fer segons el que ha fet l'alumne.
     * 'pla' si s'ha estat quiet almenys 1 s; si no, 'baixa' si ha tornat cap a la porta; si no, 'inclinada'.
     */
    function preguntaLliure(ts, xs) {
        var dt = ts.length > 1 ? ts[1] - ts[0] : 0.05,
            n = Math.round(1 / dt),
            quiet = false,
            baixa = false;
        for (var i = 0; i + n < xs.length; i++) {
            if (Math.abs(xs[i + n] - xs[i]) < 0.1) {
                var tot = true;
                for (var j = i; j <= i + n; j++) if (Math.abs(xs[j] - xs[i]) > 0.1) tot = false;
                if (tot) quiet = true;
            }
            if (xs[i + n] - xs[i] < -0.5) baixa = true;
        }
        return quiet ? 'pla' : baixa ? 'baixa' : 'inclinada';
    }

    return {
        VEL: VEL,
        nombre: nombre,
        categoria: categoria,
        llocA: llocA,
        historia: historia,
        falsaDibuix: falsaDibuix,
        falsaAlcada: falsaAlcada,
        falsaLectura: falsaLectura,
        opcions: opcions,
        preguntaLliure: preguntaLliure,
    };
});
