/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/ui/app.js
 * ROL: Controlador de «Camina la gràfica» (index.html): els quatre modes, la
 *      gravació (preparat → 3, 2, 1 → 10 s → fet), la puntuació, «Explica»,
 *      «Dibuixa» i «Mira-ho», el mode projector, el progrés i l'adreça.
 * ARQUITECTURA:
 * - La matemàtica és als motors purs (js/motor/*); aquí només hi ha l'estat de
 *   la pàgina, el bucle d'animació i els missatges.
 * - Un sol bucle requestAnimationFrame amb performance.now(): mou el personatge
 *   (limitador de velocitat o fletxes), desa les mostres (t, x) en gravar i fa
 *   caminar el personatge sobre la gràfica dibuixada a «Mira-ho».
 * - Els missatges de la puntuació surten NOMÉS quan s'acaba la gravació.
 * - Estat a l'adreça: #mode=reprodueix&repte=r-n2-01&projector=1 (els valors
 *   estranys s'ignoren). Progrés: localStorage «camina:v1:progres» (amb
 *   try/catch: sense desat també funciona).
 * DEPENDÈNCIES (ordre a index.html): data/reptes.js, js/motor/atzar.js,
 *      moviment.js, puntuacio.js, dibuix.js, narrador.js, js/ui/textos.js,
 *      passadis.js, grafica.js, aquest fitxer.
 * ============================================================================
 */
(function () {
    'use strict';
    var M = window.Moviment,
        P = window.Puntuacio,
        D = window.Dibuix,
        N = window.Narrador,
        Atzar = window.Atzar,
        T_ = window.CaminaTextos,
        REPTES = window.CAMINA_REPTES;
    var C = M.CONFIG;
    var $ = function (id) {
        return document.getElementById(id);
    };
    var esc = function (s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var coma = N.nombre;
    var reduit = function () {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    var MODES = ['lliure', 'reprodueix', 'explica', 'dibuixa'];
    var T_LLIURE = 10;

    // ── Progrés ─────────────────────────────────────────────────────────────
    var CLAU = 'camina:v1:progres';
    var progres = (function () {
        try {
            var d = JSON.parse(localStorage.getItem(CLAU));
            if (d && typeof d === 'object' && !Array.isArray(d)) {
                var net = {};
                Object.keys(d).forEach(function (k) {
                    if (Number.isInteger(d[k]) && d[k] >= 0 && d[k] <= 3) net[k] = d[k];
                });
                return net;
            }
        } catch (e) {
            /* sense localStorage o dades trencades */
        }
        return {};
    })();
    function desaProgres(id, est) {
        if ((progres[id] || 0) >= est) return;
        progres[id] = est;
        try {
            localStorage.setItem(CLAU, JSON.stringify(progres));
        } catch (e) {
            /* sense localStorage */
        }
    }
    var estrellesText = function (n) {
        return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
    };

    // ── Adreça ──────────────────────────────────────────────────────────────
    function llegeixHash() {
        var h = {};
        try {
            new URLSearchParams(String(location.hash || '').replace(/^#/, '')).forEach(function (v, k) {
                h[k] = v;
            });
        } catch (e) {
            /* ignora */
        }
        return h;
    }
    function escriuHash() {
        var q = 'mode=' + estat.mode + (repte ? '&repte=' + repte.id : '') + (estat.projector ? '&projector=1' : '');
        try {
            history.replaceState(null, '', '#' + q);
        } catch (e) {
            /* file:// en alguns navegadors */
        }
    }

    // ── Estat ───────────────────────────────────────────────────────────────
    var hash = llegeixHash();
    var estat = {
        mode: MODES.indexOf(hash.mode) >= 0 ? hash.mode : 'lliure',
        projector: hash.projector === '1' || new URLSearchParams(location.search).get('projector') === '1',
        fase: 'preparat', // preparat · compte · gravant · fet · triant · dibuixant · mirant
        x: 0,
        xObj: null,
        dir: 0,
        rapid: false,
        mirant: 1,
        mostres: [],
        t0: 0,
        T: T_LLIURE,
        caminantExplica: false,
        errors: 0,
        dibuix: [],
        cursor: null,
        seleccionat: -1,
        destacats: [],
        referencia: null,
        compte: null,
    };
    var repte = null;
    var index = {};
    MODES.slice(1).forEach(function (m) {
        index[m] = 0;
    });
    if (hash.repte) {
        var trobat = REPTES.find(function (r) {
            return r.id === hash.repte && r.mode === estat.mode;
        });
        if (trobat) index[estat.mode] = llista(estat.mode).indexOf(trobat);
    }
    function llista(mode) {
        return REPTES.filter(function (r) {
            return r.mode === mode;
        });
    }

    var els = {
        modes: $('modes'),
        selector: $('selector'),
        tria: $('tria-repte'),
        anterior: $('btn-anterior'),
        seguent: $('btn-seguent'),
        nivell: $('nivell'),
        instruccio: $('instruccio'),
        historia: $('historia'),
        feedback: $('feedback'),
        accions: $('accions'),
        lectura: $('lectura'),
        anunci: $('anunci'),
        projector: $('btn-projector'),
        svg: $('passadis'),
        canvas: $('grafica'),
    };

    var passadis = window.Passadis.crea(els.svg, {
        L: C.L,
        reduit: reduit,
        onObjectiu: function (x) {
            if (estat.fase === 'gravant' || (estat.fase === 'preparat' && estat.mode === 'lliure')) {
                estat.xObj = x;
                estat.dir = 0;
                passadis.objectiu(x);
            } else if (estat.fase === 'compte' || estat.fase === 'preparat') {
                estat.xObj = x; // es farà servir en començar a gravar
                passadis.objectiu(x);
            }
        },
    });
    var grafica = window.Grafica.crea(els.canvas, {
        L: C.L,
        onPunt: dibuixaPunt,
        onArrossega: dibuixaArrossega,
        onTecla: dibuixaTecla,
    });

    // ── Pintar ──────────────────────────────────────────────────────────────
    function liniaAlumne() {
        return estat.mostres.map(function (m) {
            return [m.t, m.x];
        });
    }
    function pintaGrafica() {
        var m = estat.mode;
        grafica.pinta({
            T: estat.T,
            projector: estat.projector,
            objectiu:
                repte && (m === 'reprodueix' || (m === 'explica' && (estat.fase === 'triant' || estat.caminantExplica)))
                    ? repte.vertexs
                    : null,
            alumne: m !== 'dibuixa' ? liniaAlumne() : null,
            dibuix: m === 'dibuixa' ? estat.dibuix : null,
            referencia: m === 'dibuixa' ? estat.referencia : null,
            editable: m === 'dibuixa' && estat.fase === 'dibuixant',
            cursor: m === 'dibuixa' && estat.fase === 'dibuixant' ? estat.cursor : null,
            seleccionat: estat.seleccionat,
            destacats: estat.destacats,
            punt: estat.fase === 'mirant' ? [estat.tMira, estat.x] : null,
        });
    }
    function missatges(llista, tipus) {
        els.feedback.innerHTML = llista
            .map(function (m) {
                var t = m.tipus || tipus || 'error';
                var icona = t === 'be' ? '✓' : t === 'info' ? 'ℹ' : '✗';
                var num = m.n ? '<span class="num" aria-hidden="true">' + m.n + '</span> ' : '';
                return (
                    '<p class="fb fb-' +
                    t +
                    '"><span class="fb-icona" aria-hidden="true">' +
                    icona +
                    '</span> ' +
                    num +
                    m.text +
                    '</p>'
                );
            })
            .join('');
    }
    function neteja() {
        els.feedback.innerHTML = '';
    }
    function boto(text, fn, principal, id) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn' + (principal ? ' btn-principal' : '');
        b.textContent = text;
        if (id) b.id = id;
        b.addEventListener('click', fn);
        els.accions.appendChild(b);
        return b;
    }
    function accions() {
        els.accions.innerHTML = '';
    }
    function anuncia(t) {
        els.anunci.textContent = t;
    }

    // ── Modes i selector ────────────────────────────────────────────────────
    function pintaModes() {
        els.modes.innerHTML = '';
        MODES.forEach(function (m) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'mode' + (m === estat.mode ? ' actual' : '');
            b.textContent = T_.MODES[m].nom;
            if (m === estat.mode) b.setAttribute('aria-current', 'page');
            b.addEventListener('click', function () {
                if (m === estat.mode) return;
                estat.mode = m;
                carrega();
            });
            els.modes.appendChild(b);
        });
    }
    function pintaSelector() {
        if (estat.mode === 'lliure') {
            els.selector.hidden = true;
            return;
        }
        els.selector.hidden = false;
        var l = llista(estat.mode),
            i = index[estat.mode];
        els.tria.innerHTML = l
            .map(function (r, k) {
                return (
                    '<option value="' +
                    k +
                    '"' +
                    (k === i ? ' selected' : '') +
                    '>' +
                    esc(T_.repte(k + 1, l.length) + ' · N' + r.nivell + ' · ' + estrellesText(progres[r.id] || 0)) +
                    '</option>'
                );
            })
            .join('');
        els.nivell.textContent = T_.NIVELLS[repte.nivell];
        els.anterior.disabled = i === 0;
        els.seguent.disabled = i === l.length - 1;
    }
    els.tria.addEventListener('change', function () {
        index[estat.mode] = +els.tria.value;
        carrega();
    });
    els.anterior.addEventListener('click', function () {
        index[estat.mode] = Math.max(0, index[estat.mode] - 1);
        carrega();
    });
    els.seguent.addEventListener('click', seguent);
    function seguent() {
        index[estat.mode] = Math.min(llista(estat.mode).length - 1, index[estat.mode] + 1);
        carrega();
    }

    // ── Carregar un mode o un repte ─────────────────────────────────────────
    function carrega() {
        cancelaCompte();
        repte = estat.mode === 'lliure' ? null : llista(estat.mode)[index[estat.mode]];
        estat.T = repte ? repte.durada : T_LLIURE;
        estat.mostres = [];
        estat.destacats = [];
        estat.referencia = null;
        estat.caminantExplica = false;
        estat.errors = 0;
        estat.dir = 0;
        estat.xObj = null;
        passadis.objectiu(null);
        passadis.compte(null);
        els.historia.innerHTML = '';
        neteja();
        pintaModes();
        pintaSelector();
        escriuHash();
        els.instruccio.textContent = T_.MODES[estat.mode].instruccio;
        if (estat.mode === 'explica') iniciaExplica();
        else if (estat.mode === 'dibuixa') iniciaDibuixa();
        else preparaGravacio();
        pintaGrafica();
    }

    // ── Gravació: preparat → 3, 2, 1 → T s → fet ────────────────────────────
    var tempsCompte = [];
    function cancelaCompte() {
        tempsCompte.forEach(clearTimeout);
        tempsCompte = [];
        passadis.compte(null);
    }
    function x0() {
        return repte ? repte.vertexs[0][1] : estat.x;
    }
    function preparaGravacio() {
        estat.fase = 'preparat';
        if (repte) {
            estat.x = x0();
            passadis.marca(estat.x);
        } else passadis.marca(null);
        estat.mostres = [];
        els.lectura.textContent = '';
        var nota = estat.mode === 'lliure' ? T_.preparatLliure : T_.preparat;
        if (!els.historia.innerHTML || estat.mode !== 'explica')
            els.historia.innerHTML =
                '<p class="nota">' + esc(nota) + '</p><p class="nota petita">' + esc(T_.comAMoure) + '</p>';
        accions();
        boto(T_.comencar + ' (espai)', comenca, true, 'btn-comenca');
        if (estat.mode === 'reprodueix')
            boto('Pista', function () {
                missatges([{ text: esc(T_.pista) }], 'info');
            });
        pintaGrafica();
    }
    function comenca() {
        if (estat.fase === 'compte' || estat.fase === 'gravant') return;
        if (estat.fase === 'fet') {
            estat.mostres = [];
            estat.destacats = [];
        }
        neteja();
        if (repte) {
            estat.x = x0();
            passadis.marca(estat.x);
        }
        estat.dir = 0;
        estat.fase = 'compte';
        accions();
        pintaGrafica();
        [3, 2, 1].forEach(function (n, i) {
            tempsCompte.push(
                setTimeout(function () {
                    passadis.compte(n);
                    anuncia(String(n));
                }, i * 1000)
            );
        });
        tempsCompte.push(setTimeout(grava, 3000));
    }
    function grava() {
        passadis.compte(null);
        passadis.marca(null);
        estat.fase = 'gravant';
        estat.t0 = performance.now();
        estat.mostres = [{ t: 0, x: estat.x }];
        anuncia(T_.gravant);
        accions();
        boto('Atura', function () {
            cancelaCompte();
            preparaGravacio();
        });
    }
    function acabaGravacio() {
        estat.fase = 'fet';
        estat.xObj = null;
        estat.dir = 0;
        passadis.objectiu(null);
        var T = estat.T,
            ts = M.temps(T),
            serie = M.remostreja(estat.mostres, T);
        accions();
        if (estat.mode === 'lliure') {
            preguntaLliure(N.preguntaLliure(ts, serie));
            boto(T_.provaUnAltre, comenca, true);
            pintaGrafica();
            return;
        }
        var a = P.avalua(repte.vertexs, ts, serie, M.mostresObjectiu(repte.vertexs, T));
        if (estat.mode === 'reprodueix') desaProgres(repte.id, a.estrelles);
        var llistaM = [
            {
                text:
                    '<strong class="estrelles" aria-label="' +
                    a.estrelles +
                    ' estrelles de 3">' +
                    estrellesText(a.estrelles) +
                    '</strong> ' +
                    esc(T_.estrelles[a.estrelles]),
                tipus: a.estrelles ? 'be' : 'error',
            },
        ];
        estat.destacats = a.missatges.map(function (m, i) {
            return { t0: m.t0, t1: m.t1, n: i + 1 };
        });
        a.missatges.forEach(function (m, i) {
            llistaM.push({
                n: i + 1,
                text: esc(T_.entre(coma(m.t0), coma(m.t1)) + ' ' + textRegla(m) + '.'),
                tipus: 'error',
            });
        });
        if (!a.missatges.length && a.estrelles === 3) llistaM.push({ text: esc(T_.totBe), tipus: 'be' });
        missatges(llistaM);
        boto(T_.tornaAComencar + ' (espai)', comenca, a.estrelles < 3);
        var l = llista(estat.mode);
        if (index[estat.mode] < l.length - 1) boto('Repte següent →', seguent, a.estrelles === 3);
        pintaSelector();
        pintaGrafica();
        anuncia(T_.estrelles[a.estrelles]);
    }
    function textRegla(m) {
        var R = T_.regles;
        if (m.regla === 'sentit') return R['sentit_' + m.sentit];
        if ((m.regla === 'lluny' || m.regla === 'aprop') && m.k === 0) return R[m.regla + '_inici'];
        return R[m.regla];
    }

    // ── Lliure: una pregunta de reflexió ────────────────────────────────────
    function preguntaLliure(clau) {
        var q = T_.preguntes[clau];
        var at = Atzar.crea(clau + '|' + estat.mostres.length);
        var ops = at.barreja(q.opcions);
        els.historia.innerHTML =
            '<p class="pregunta">' +
            esc(q.pregunta) +
            '</p><div class="opcions" role="group">' +
            ops
                .map(function (o) {
                    return '<button type="button" class="opcio" data-tipus="' + o[0] + '">' + esc(o[1]) + '</button>';
                })
                .join('') +
            '</div>';
        [].forEach.call(els.historia.querySelectorAll('.opcio'), function (b) {
            b.addEventListener('click', function () {
                var t = b.dataset.tipus;
                if (t === 'bona') {
                    b.classList.add('bona');
                    [].forEach.call(els.historia.querySelectorAll('.opcio'), function (x) {
                        x.disabled = true;
                    });
                    missatges([{ text: esc(T_.respostes.bona) }], 'be');
                } else {
                    b.classList.add('dolenta');
                    b.disabled = true;
                    missatges([{ text: esc(T_.respostes[t]) }]);
                }
            });
        });
    }

    // ── Explica ─────────────────────────────────────────────────────────────
    function iniciaExplica() {
        estat.fase = 'triant';
        passadis.marca(null);
        estat.x = repte.vertexs[0][1];
        var ops = N.opcions(repte.vertexs, Atzar.crea(repte.id), C.vMax);
        els.historia.innerHTML =
            '<div class="opcions" role="group" aria-label="Històries">' +
            ops
                .map(function (o, i) {
                    return (
                        '<button type="button" class="opcio historia" data-tipus="' +
                        o.tipus +
                        '"><span class="lletra">' +
                        'ABC'[i] +
                        '</span> ' +
                        esc(o.text) +
                        '</button>'
                    );
                })
                .join('') +
            '</div>';
        [].forEach.call(els.historia.querySelectorAll('.opcio'), function (b) {
            b.addEventListener('click', function () {
                triaExplica(b);
            });
        });
        accions();
    }
    function triaExplica(b) {
        var t = b.dataset.tipus;
        if (t !== 'bona') {
            estat.errors++;
            b.classList.add('dolenta');
            b.disabled = true;
            b.setAttribute('aria-label', 'Incorrecta: ' + b.textContent);
            missatges([{ text: esc(T_.respostes[t]) }]);
            return;
        }
        b.classList.add('bona');
        [].forEach.call(els.historia.querySelectorAll('.opcio'), function (x) {
            if (x !== b) x.hidden = true;
            x.disabled = true;
        });
        desaProgres(repte.id, Math.max(1, 3 - estat.errors));
        pintaSelector();
        missatges([{ text: esc(T_.explicaBe) }], 'be');
        accions();
        boto(
            T_.araCamina,
            function () {
                estat.caminantExplica = true;
                neteja();
                preparaGravacio();
            },
            true
        );
    }

    // ── Dibuixa ─────────────────────────────────────────────────────────────
    function iniciaDibuixa() {
        estat.fase = 'dibuixant';
        estat.dibuix = [];
        estat.cursor = [0, 0];
        estat.seleccionat = -1;
        passadis.marca(null);
        estat.x = 0;
        els.historia.innerHTML =
            '<p class="historia-text">' +
            esc(N.historia(repte.vertexs)) +
            '</p><p class="nota petita">' +
            esc(T_.dibuixaComo) +
            '</p>';
        botonsDibuixa();
    }
    function botonsDibuixa() {
        accions();
        var mira = boto(T_.miraho, miraho, true, 'btn-miraho');
        mira.disabled = !D.completa(estat.dibuix, estat.T);
        boto(T_.desfes, function () {
            estat.dibuix = estat.dibuix.slice(0, -1);
            despresDeCanviar();
        });
        boto(T_.esborra, function () {
            estat.dibuix = [];
            despresDeCanviar();
        });
    }
    function despresDeCanviar() {
        estat.referencia = null;
        estat.destacats = [];
        var b = $('btn-miraho');
        if (b) b.disabled = !D.completa(estat.dibuix, estat.T);
        if (estat.dibuix.length && !D.completa(estat.dibuix, estat.T))
            missatges([{ text: esc(T_.dibuixaFalta(coma(estat.T))) }], 'info');
        else if (D.completa(estat.dibuix, estat.T))
            missatges([{ text: 'Ja arriba al final. Toca «' + T_.miraho + '».' }], 'info');
        pintaGrafica();
    }
    var opcionsDibuix = function () {
        return { T: estat.T, L: C.L, vMax: C.vMax };
    };
    function dibuixaPunt(t, x) {
        if (estat.fase !== 'dibuixant') return;
        var p = D.enganxa(t, x, estat.T, C.L);
        var r = D.afegeix(estat.dibuix, p, opcionsDibuix());
        if (!r.ok) {
            missatges([{ text: esc(T_.errorsDibuix[r.error]) }]);
            return;
        }
        estat.dibuix = r.vertexs;
        estat.cursor = estat.dibuix[estat.dibuix.length - 1].slice();
        despresDeCanviar();
        if (r.primer) missatges([{ text: esc(T_.errorsDibuix.primer) }], 'info');
        anuncia('Punt a ' + coma(estat.cursor[0]) + ' s, ' + coma(estat.cursor[1]) + ' m');
    }
    function dibuixaArrossega(i, t, x, final) {
        if (estat.fase !== 'dibuixant') return;
        var p = D.enganxa(t, x, estat.T, C.L);
        var r = D.mou(estat.dibuix, i, p, opcionsDibuix());
        if (r.ok) {
            estat.dibuix = r.vertexs;
            estat.seleccionat = final ? -1 : i;
            if (final) despresDeCanviar();
            else pintaGrafica();
        } else if (final) {
            estat.seleccionat = -1;
            missatges([{ text: esc(T_.errorsDibuix[r.error]) }]);
            pintaGrafica();
        }
    }
    function dibuixaTecla(k) {
        if (estat.fase !== 'dibuixant') return false;
        var c = estat.cursor || [0, 0],
            d = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] }[k];
        if (d) {
            estat.cursor = [Math.min(estat.T, Math.max(0, c[0] + d[0])), Math.min(C.L, Math.max(0, c[1] + d[1]))];
            anuncia(coma(estat.cursor[0]) + ' s, ' + coma(estat.cursor[1]) + ' m');
            pintaGrafica();
            return true;
        }
        if (k === 'Enter' || k === ' ') {
            dibuixaPunt(c[0], c[1]);
            return true;
        }
        if (k === 'Backspace' || k === 'Delete') {
            estat.dibuix = estat.dibuix.slice(0, -1);
            despresDeCanviar();
            return true;
        }
        return false;
    }
    function miraho() {
        if (!D.completa(estat.dibuix, estat.T)) return;
        neteja();
        estat.fase = 'mirant';
        estat.t0 = performance.now();
        estat.tMira = 0;
        accions();
        if (reduit()) acabaMiraho();
    }
    function acabaMiraho() {
        estat.fase = 'dibuixant';
        estat.x = M.xDe(estat.dibuix, estat.T);
        var falla = D.comprova(estat.dibuix, D.condicions(repte.vertexs));
        falla.sort(function (a, b) {
            return (a.c.tipus === 'punt' ? a.c.t : a.c.t[0]) - (b.c.tipus === 'punt' ? b.c.t : b.c.t[0]);
        });
        if (!falla.length) {
            desaProgres(repte.id, Math.max(1, 3 - estat.errors));
            estat.referencia = repte.vertexs;
            estat.destacats = [];
            estat.fase = 'fet';
            missatges([{ text: esc(T_.dibuixaBe) }], 'be');
            accions();
            boto(T_.desfes, function () {
                estat.fase = 'dibuixant';
                estat.referencia = null;
                estat.dibuix = estat.dibuix.slice(0, -1);
                botonsDibuixa();
                despresDeCanviar();
            });
            if (index.dibuixa < llista('dibuixa').length - 1) boto('Repte següent →', seguent, true);
            pintaSelector();
            pintaGrafica();
            return;
        }
        estat.errors++;
        var mostra = falla.slice(0, 2);
        estat.destacats = mostra.map(function (f, i) {
            var c = f.c;
            return c.tipus === 'punt'
                ? { t0: Math.max(0, c.t - 0.25), t1: Math.min(estat.T, c.t + 0.25), n: i + 1 }
                : { t0: c.t[0], t1: c.t[1], n: i + 1 };
        });
        missatges(
            mostra.map(function (f, i) {
                var c = f.c;
                var t =
                    c.tipus === 'punt'
                        ? T_.condicio.punt(coma(c.t), N.llocA(c.x), coma(Math.round(f.valor * 2) / 2))
                        : T_.condicio.quiet(coma(c.t[0]), coma(c.t[1]), N.llocA(c.x));
                return { n: i + 1, text: esc(t) };
            })
        );
        botonsDibuixa();
        pintaGrafica();
    }

    // ── Bucle d'animació ────────────────────────────────────────────────────
    var darrer = performance.now(),
        darrerText = 0;
    function fotograma(ara) {
        var dt = Math.min((ara - darrer) / 1000, C.dtMaxFotograma);
        darrer = ara;
        var abans = estat.x,
            mou = estat.fase === 'gravant' || (estat.fase === 'preparat' && estat.mode === 'lliure');
        if (mou) {
            if (estat.dir) estat.x = M.pasTeclat(estat.x, estat.dir, estat.rapid, dt);
            else if (estat.xObj !== null) estat.x = M.pas(estat.x, estat.xObj, dt);
        }
        if (estat.fase === 'gravant') {
            var t = (ara - estat.t0) / 1000;
            if (t >= estat.T) {
                estat.mostres.push({ t: estat.T, x: estat.x });
                acabaGravacio();
            } else {
                estat.mostres.push({ t: t, x: estat.x });
                pintaGrafica();
            }
        }
        if (estat.fase === 'mirant') {
            estat.tMira = Math.min(estat.T, (ara - estat.t0) / 1000);
            estat.x = M.xDe(estat.dibuix, estat.tMira);
            pintaGrafica();
            if (estat.tMira >= estat.T) acabaMiraho();
        }
        var v = dt > 0 ? (estat.x - abans) / dt : 0;
        if (Math.abs(v) > 0.05) estat.mirant = v > 0 ? 1 : -1;
        passadis.posa(estat.x, estat.mirant, Math.abs(v) > 0.05 ? v : 0, dt);
        if (ara - darrerText > 100) {
            darrerText = ara;
            var tTxt =
                estat.fase === 'gravant'
                    ? coma(Math.min(estat.T, (ara - estat.t0) / 1000))
                    : estat.fase === 'mirant'
                      ? coma(estat.tMira)
                      : '';
            els.lectura.textContent =
                (tTxt ? T_.temps(tTxt) + ' · ' : '') + T_.distancia(coma(Math.round(estat.x * 10) / 10));
        }
        requestAnimationFrame(fotograma);
    }

    // ── Teclat ──────────────────────────────────────────────────────────────
    var esCamp = function (el) {
        return el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    };
    document.addEventListener('keydown', function (e) {
        if (esCamp(e.target) || e.target === els.canvas) return;
        var caminant = estat.fase === 'gravant' || (estat.fase === 'preparat' && estat.mode === 'lliure');
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && caminant) {
            estat.dir = e.key === 'ArrowLeft' ? -1 : 1;
            estat.rapid = e.shiftKey;
            estat.xObj = null;
            passadis.objectiu(null);
            e.preventDefault();
        } else if ((e.key === ' ' || e.code === 'Space') && !(e.target && e.target.tagName === 'BUTTON')) {
            if (
                (estat.fase === 'preparat' || estat.fase === 'fet') &&
                estat.mode !== 'dibuixa' &&
                (estat.mode !== 'explica' || estat.caminantExplica)
            ) {
                comenca();
                e.preventDefault();
            }
        } else if (e.key === 'Escape' && (estat.fase === 'compte' || estat.fase === 'gravant')) {
            cancelaCompte();
            preparaGravacio();
        }
    });
    document.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            estat.dir = 0;
            estat.xObj = estat.x;
        }
        if (e.key === 'Shift') estat.rapid = false;
    });
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && (estat.fase === 'compte' || estat.fase === 'gravant')) {
            cancelaCompte();
            preparaGravacio();
            missatges([{ text: esc(T_.aturat) }], 'info');
        }
    });

    // ── Projector ───────────────────────────────────────────────────────────
    function aplicaProjector() {
        document.body.classList.toggle('projector', estat.projector);
        els.projector.textContent = estat.projector ? T_.sortirProjector : T_.projector;
        els.projector.setAttribute('aria-pressed', String(estat.projector));
        escriuHash();
        pintaGrafica();
    }
    els.projector.addEventListener('click', function () {
        estat.projector = !estat.projector;
        aplicaProjector();
    });
    $('btn-esborra-progres').addEventListener('click', function () {
        if (!confirm(T_.esborraProgres)) return;
        progres = {};
        try {
            localStorage.removeItem(CLAU);
        } catch (e) {
            /* sense localStorage */
        }
        pintaSelector();
    });

    // Si algú canvia l'adreça a mà (o tria un enllaç a un repte), es carrega aquell repte
    window.addEventListener('hashchange', function () {
        var h = llegeixHash();
        var mode = MODES.indexOf(h.mode) >= 0 ? h.mode : estat.mode;
        var r = REPTES.find(function (x) {
            return x.id === h.repte && x.mode === mode;
        });
        if (mode === estat.mode && (!r || r === repte) && (h.projector === '1') === estat.projector) return;
        estat.mode = mode;
        if (r) index[mode] = llista(mode).indexOf(r);
        estat.projector = h.projector === '1';
        carrega();
        aplicaProjector();
    });

    // ── Arrencada ───────────────────────────────────────────────────────────
    carrega();
    aplicaProjector();
    requestAnimationFrame(fotograma);
})();
