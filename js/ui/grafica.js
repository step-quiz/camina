/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/ui/grafica.js
 * ROL: La gràfica distància–temps (<canvas>, escalat pel devicePixelRatio):
 *      eixos t (s) i d (m) amb quadrícula cada 1 s i 1 m, la línia objectiu (de
 *      punts), la de l'alumne, la gràfica que dibuixa, els trams destacats, el
 *      cursor del teclat i el punt que es mou a «Mira-ho».
 *      En mode dibuix tradueix toc, arrossegament i teclat a punts (t, x).
 * ARQUITECTURA: pinta(model) dibuixa de nou tot el canvas (és petit). No sap
 *      res de modes: el controlador decideix què hi ha al model.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel) {
    'use strict';

    function crea(canvas, opts) {
        var ctx = canvas.getContext('2d');
        var model = null,
            dpr = 1,
            amp = 0,
            alt = 0;
        var L = opts.L || 10;

        function marges() {
            var g = model && model.projector ? 1.7 : 1;
            return { e: 52 * g, d: 16 * g, a: 16 * g, b: 44 * g, lletra: 14 * g };
        }
        function color(nom) {
            return getComputedStyle(canvas).getPropertyValue(nom).trim() || '#000';
        }
        function mida() {
            var r = canvas.getBoundingClientRect();
            dpr = window.devicePixelRatio || 1;
            amp = Math.max(200, r.width);
            alt = Math.max(160, r.height);
            canvas.width = Math.round(amp * dpr);
            canvas.height = Math.round(alt * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        // Coordenades
        function X(t) {
            var m = marges();
            return m.e + ((amp - m.e - m.d) * t) / model.T;
        }
        function Y(x) {
            var m = marges();
            return alt - m.b - ((alt - m.a - m.b) * x) / L;
        }
        function inversa(px, py) {
            var m = marges();
            return { t: ((px - m.e) * model.T) / (amp - m.e - m.d), x: ((alt - m.b - py) * L) / (alt - m.a - m.b) };
        }
        var coma = function (v) {
            return String(Math.round(v * 10) / 10).replace('.', ',');
        };

        function linia(punts, estil) {
            if (!punts || punts.length < 2) return;
            ctx.save();
            ctx.strokeStyle = estil.color;
            ctx.lineWidth = estil.gruix;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.setLineDash(estil.ratlla || []);
            ctx.beginPath();
            punts.forEach(function (p, i) {
                if (i) ctx.lineTo(X(p[0]), Y(p[1]));
                else ctx.moveTo(X(p[0]), Y(p[1]));
            });
            ctx.stroke();
            ctx.restore();
        }

        function pinta(m) {
            model = m || model;
            if (!model) return;
            mida();
            var mg = marges(),
                t,
                x;
            ctx.clearRect(0, 0, amp, alt);
            ctx.fillStyle = color('--g-fons');
            ctx.fillRect(0, 0, amp, alt);
            // Trams destacats (per sota de tot)
            (model.destacats || []).forEach(function (d) {
                ctx.fillStyle = color('--g-destacat');
                ctx.fillRect(X(d.t0), mg.a, X(d.t1) - X(d.t0), alt - mg.a - mg.b);
                ctx.fillStyle = color('--g-destacat-text');
                ctx.font = '700 ' + mg.lletra + 'px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(String(d.n), (X(d.t0) + X(d.t1)) / 2, mg.a + 4);
            });
            // Quadrícula
            ctx.lineWidth = 1;
            ctx.strokeStyle = color('--g-quadricula');
            ctx.beginPath();
            for (t = 0; t <= model.T + 1e-9; t += 1) {
                ctx.moveTo(Math.round(X(t)) + 0.5, Y(0));
                ctx.lineTo(Math.round(X(t)) + 0.5, Y(L));
            }
            for (x = 0; x <= L; x += 1) {
                ctx.moveTo(X(0), Math.round(Y(x)) + 0.5);
                ctx.lineTo(X(model.T), Math.round(Y(x)) + 0.5);
            }
            ctx.stroke();
            // Eixos
            ctx.strokeStyle = color('--g-eix');
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(X(0), Y(L));
            ctx.lineTo(X(0), Y(0));
            ctx.lineTo(X(model.T), Y(0));
            ctx.stroke();
            ctx.fillStyle = color('--g-text');
            ctx.font = mg.lletra + 'px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            var pasT = amp < 420 && model.T > 8 ? 2 : 1;
            for (t = 0; t <= model.T + 1e-9; t += pasT) ctx.fillText(coma(t), X(t), Y(0) + 5);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (x = 0; x <= L; x += 2) ctx.fillText(coma(x), X(0) - 6, Y(x));
            ctx.font = '600 ' + mg.lletra + 'px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('t (s)', X(model.T), alt - 2);
            ctx.save();
            ctx.translate(14 * (model.projector ? 1.7 : 1), Y(L / 2));
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('d (m)', 0, 0);
            ctx.restore();

            // Línies
            var g = model.projector ? 1.6 : 1;
            linia(model.referencia, { color: color('--g-referencia'), gruix: 5 * g });
            linia(model.objectiu, { color: color('--g-objectiu'), gruix: 3 * g, ratlla: [9 * g, 7 * g] });
            linia(model.alumne, { color: color('--g-alumne'), gruix: 3.5 * g });
            linia(model.dibuix, { color: color('--g-alumne'), gruix: 3.5 * g });
            (model.dibuix || []).forEach(function (p, i) {
                ctx.fillStyle = i === model.seleccionat ? color('--g-cursor') : color('--g-alumne');
                ctx.beginPath();
                ctx.arc(X(p[0]), Y(p[1]), 6 * g, 0, 2 * Math.PI);
                ctx.fill();
            });
            if (model.punt) {
                ctx.fillStyle = color('--g-alumne');
                ctx.strokeStyle = color('--g-fons');
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(X(model.punt[0]), Y(model.punt[1]), 8 * g, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
            if (model.cursor) {
                ctx.strokeStyle = color('--g-cursor');
                ctx.lineWidth = 2.5;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.arc(X(model.cursor[0]), Y(model.cursor[1]), 11 * g, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // ── Mode dibuix: toc, arrossegament i teclat ────────────────────────
        var drag = null;
        function local(ev) {
            var r = canvas.getBoundingClientRect();
            return [ev.clientX - r.left, ev.clientY - r.top];
        }
        canvas.addEventListener('pointerdown', function (ev) {
            if (!model || !model.editable || ev.button !== 0) return;
            var p = local(ev),
                q = inversa(p[0], p[1]);
            var i = (model.dibuix || []).findIndex(function (v) {
                return Math.hypot(X(v[0]) - p[0], Y(v[1]) - p[1]) < 16;
            });
            drag = { i: i, inici: p, mogut: false, q: q };
            try {
                canvas.setPointerCapture(ev.pointerId);
            } catch (e) {
                /* navegadors antics */
            }
            ev.preventDefault();
        });
        canvas.addEventListener('pointermove', function (ev) {
            if (!drag) return;
            var p = local(ev);
            if (Math.hypot(p[0] - drag.inici[0], p[1] - drag.inici[1]) > 6) drag.mogut = true;
            if (drag.mogut && drag.i >= 0) {
                var q = inversa(p[0], p[1]);
                opts.onArrossega(drag.i, q.t, q.x, false);
            }
        });
        canvas.addEventListener('pointerup', function (ev) {
            if (!drag) return;
            var d = drag;
            drag = null;
            var p = local(ev),
                q = inversa(p[0], p[1]);
            if (d.mogut && d.i >= 0) opts.onArrossega(d.i, q.t, q.x, true);
            else if (!d.mogut) opts.onPunt(q.t, q.x);
        });
        canvas.addEventListener('pointercancel', function () {
            drag = null;
        });
        canvas.addEventListener('keydown', function (ev) {
            if (!model || !model.editable) return;
            if (opts.onTecla(ev.key, ev.shiftKey)) ev.preventDefault();
        });

        if (typeof ResizeObserver === 'function')
            new ResizeObserver(function () {
                pinta();
            }).observe(canvas);
        else
            window.addEventListener('resize', function () {
                pinta();
            });

        return { pinta: pinta };
    }

    arrel.Grafica = { crea: crea };
})(typeof self !== 'undefined' ? self : this);
