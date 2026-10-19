/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/ui/passadis.js
 * ROL: El passadís a la pantalla (SVG): la porta (x = 0), la finestra (x = 10),
 *      el regle en metres, el personatge, la marca on has de començar i el
 *      compte enrere. També tradueix toc i arrossegament en un objectiu x*.
 * ARQUITECTURA: No sap res de modes ni de puntuació. El controlador crida
 *      posa(x, mirant, caminant), marca(x | null), compte(n | null) i rep
 *      onObjectiu(x) quan l'alumne toca o arrossega sobre el passadís.
 *      El personatge és un dibuix propi i senzill (cap personatge conegut).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel) {
    'use strict';
    var W = 1000,
        H = 230,
        X0 = 90,
        X1 = 910; // x = 0 i x = 10 (m)
    var PISO = 190;

    function crea(svg, opts) {
        var L = opts.L || 10;
        var px = function (x) {
            return X0 + ((X1 - X0) * x) / L;
        };
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('role', 'application');
        svg.setAttribute('tabindex', '0');

        var regle = '';
        for (var m = 0; m <= L; m++) {
            regle +=
                '<line class="p-marca" x1="' +
                px(m) +
                '" y1="' +
                (PISO + 2) +
                '" x2="' +
                px(m) +
                '" y2="' +
                (PISO + (m % 5 ? 10 : 16)) +
                '"/>' +
                '<text class="p-num" x="' +
                px(m) +
                '" y="' +
                (PISO + 33) +
                '">' +
                m +
                '</text>';
        }
        svg.innerHTML =
            '<rect class="p-paret" x="0" y="0" width="' +
            W +
            '" height="' +
            PISO +
            '"/>' +
            '<rect class="p-terra" x="0" y="' +
            PISO +
            '" width="' +
            W +
            '" height="' +
            (H - PISO) +
            '"/>' +
            // Porta (a l'esquerra)
            '<g class="p-porta"><rect x="' +
            (X0 - 70) +
            '" y="58" width="62" height="' +
            (PISO - 58) +
            '" rx="3"/>' +
            '<circle cx="' +
            (X0 - 20) +
            '" cy="128" r="4.5"/><text class="p-rotul" x="' +
            (X0 - 39) +
            '" y="46">porta</text></g>' +
            // Finestra (a la dreta)
            '<g class="p-finestra"><rect x="' +
            (X1 + 12) +
            '" y="52" width="66" height="80" rx="3"/>' +
            '<line x1="' +
            (X1 + 45) +
            '" y1="52" x2="' +
            (X1 + 45) +
            '" y2="132"/><line x1="' +
            (X1 + 12) +
            '" y1="92" x2="' +
            (X1 + 78) +
            '" y2="92"/>' +
            '<text class="p-rotul" x="' +
            (X1 + 45) +
            '" y="40">finestra</text></g>' +
            '<line class="p-linia-terra" x1="0" y1="' +
            PISO +
            '" x2="' +
            W +
            '" y2="' +
            PISO +
            '"/>' +
            regle +
            '<text class="p-unitat" x="' +
            (X1 + 45) +
            '" y="' +
            (PISO + 33) +
            '">m</text>' +
            '<g id="p-fantasma" class="p-fantasma" display="none"><line x1="0" y1="64" x2="0" y2="' +
            PISO +
            '"/><text id="p-fantasma-text" x="8" y="60">surts d’aquí</text></g>' +
            '<g id="p-objectiu" class="p-objectiu" display="none"><circle cx="0" cy="' +
            (PISO - 4) +
            '" r="7"/></g>' +
            // Personatge: cap, cos, braços i cames (cames i braços es mouen en caminar)
            '<g id="p-pers" class="p-pers"><g id="p-pers-gir">' +
            '<line class="p-cama" id="p-cama1" x1="0" y1="150" x2="-9" y2="' +
            PISO +
            '"/>' +
            '<line class="p-cama" id="p-cama2" x1="0" y1="150" x2="9" y2="' +
            PISO +
            '"/>' +
            '<rect class="p-cos" x="-15" y="98" width="30" height="56" rx="13"/>' +
            '<line class="p-brac" id="p-brac1" x1="-11" y1="108" x2="-17" y2="140"/>' +
            '<line class="p-brac" id="p-brac2" x1="11" y1="108" x2="17" y2="140"/>' +
            '<circle class="p-cap" cx="0" cy="80" r="15"/><circle class="p-ull" cx="6" cy="77" r="2.4"/>' +
            '</g></g>' +
            '<text id="p-compte" class="p-compte" x="' +
            W / 2 +
            '" y="120" display="none"></text>';

        var $ = function (id) {
            return svg.querySelector('#' + id);
        };
        var pers = $('p-pers'),
            gir = $('p-pers-gir'),
            fant = $('p-fantasma'),
            obj = $('p-objectiu'),
            compteEl = $('p-compte');
        var cames = [$('p-cama1'), $('p-cama2')],
            bracos = [$('p-brac1'), $('p-brac2')];
        var fase = 0;
        // L'atribut «hidden» no amaga els elements SVG: es fa servir display="none"
        function mostra(el, si) {
            if (si) el.removeAttribute('display');
            else el.setAttribute('display', 'none');
        }
        var fantText = $('p-fantasma-text');

        /** Posa el personatge a x; mirant: 1 (cap a la finestra) o −1; caminant: velocitat (m/s) per moure les cames. */
        function posa(x, mirant, caminant, dt) {
            pers.setAttribute('transform', 'translate(' + px(x).toFixed(1) + ' 0)');
            gir.setAttribute('transform', mirant < 0 ? 'scale(-1 1)' : '');
            fase += Math.min(Math.abs(caminant || 0), 3) * (dt || 0) * 7;
            var a = caminant && !opts.reduit() ? Math.sin(fase) * 11 : 0;
            cames[0].setAttribute('x2', (-9 + a).toFixed(1));
            cames[1].setAttribute('x2', (9 - a).toFixed(1));
            bracos[0].setAttribute('x2', (-17 - a * 0.7).toFixed(1));
            bracos[1].setAttribute('x2', (17 + a * 0.7).toFixed(1));
        }
        var hiEs = function (v) {
            return v !== null && v !== undefined;
        };
        function marca(x) {
            mostra(fant, hiEs(x));
            if (!hiEs(x)) return;
            fant.setAttribute('transform', 'translate(' + px(x) + ' 0)');
            // L'etiqueta, cap a dins del passadís (a la dreta de la línia, o a l'esquerra prop de la finestra)
            var dreta = x > L * 0.75;
            fantText.setAttribute('x', dreta ? -8 : 8);
            fantText.setAttribute('text-anchor', dreta ? 'end' : 'start');
        }
        function objectiu(x) {
            mostra(obj, hiEs(x));
            if (hiEs(x)) obj.setAttribute('transform', 'translate(' + px(x) + ' 0)');
        }
        function compte(n) {
            mostra(compteEl, hiEs(n));
            compteEl.textContent = hiEs(n) ? String(n) : '';
        }

        // ── Toc i arrossegament ─────────────────────────────────────────────
        function xDe(ev) {
            var pt = svg.createSVGPoint();
            pt.x = ev.clientX;
            pt.y = ev.clientY;
            var ctm = svg.getScreenCTM();
            if (!ctm) return null;
            var q = pt.matrixTransform(ctm.inverse());
            return Math.min(L, Math.max(0, ((q.x - X0) * L) / (X1 - X0)));
        }
        var arrossegant = false;
        svg.addEventListener('pointerdown', function (ev) {
            if (ev.button !== 0) return;
            var x = xDe(ev);
            if (x === null) return;
            arrossegant = true;
            try {
                svg.setPointerCapture(ev.pointerId);
            } catch (e) {
                /* navegadors antics */
            }
            opts.onObjectiu(x);
            ev.preventDefault();
        });
        svg.addEventListener('pointermove', function (ev) {
            if (!arrossegant) return;
            var x = xDe(ev);
            if (x !== null) opts.onObjectiu(x);
        });
        var acaba = function () {
            arrossegant = false;
        };
        svg.addEventListener('pointerup', acaba);
        svg.addEventListener('pointercancel', acaba);

        return { posa: posa, marca: marca, objectiu: objectiu, compte: compte };
    }

    arrel.Passadis = { crea: crea };
})(typeof self !== 'undefined' ? self : this);
