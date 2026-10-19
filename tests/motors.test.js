/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: tests/motors.test.js
 * ROL: Tests dels motors purs: moviment (limitador, teclat, remostreig),
 *      puntuació (MAE, estrelles, cada regla de missatge), dibuix (què no es
 *      pot dibuixar, condicions) i narrador (històries i falses).
 * ARQUITECTURA: Les sèries de prova es construeixen a mà o amb un «alumne
 *      simulat» que segueix l'objectiu fotograma a fotograma amb el limitador,
 *      amb intervals de temps irregulars (com un navegador de debò).
 * ÚS: node tests/motors.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const M = require('../js/motor/moviment.js');
const P = require('../js/motor/puntuacio.js');
const D = require('../js/motor/dibuix.js');
const N = require('../js/motor/narrador.js');
const Atzar = require('../js/motor/atzar.js');

const prop = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// Un alumne simulat: a cada fotograma (≈ 60 fps amb soroll) apunta a objectiu(t) i es mou amb el limitador
function simula(objectiu, T, llavor = 'sim', x0) {
    const at = Atzar.crea(llavor);
    let t = 0,
        x = x0 !== undefined ? x0 : objectiu(0);
    const mostres = [{ t: 0, x }];
    while (t < T) {
        const dt = 1 / 60 + (at.real() - 0.5) * 0.008;
        t = Math.min(T, t + dt);
        x = M.pas(x, objectiu(t), dt);
        mostres.push({ t, x });
    }
    return mostres;
}
function avalua(vertexs, mostres) {
    const T = vertexs[vertexs.length - 1][0];
    const ts = M.temps(T);
    return P.avalua(vertexs, ts, M.remostreja(mostres, T), M.mostresObjectiu(vertexs, T));
}

suite('1. Moviment: limitador, teclat i posició d’una gràfica');
{
    eq('objectiu a prop: hi arriba', M.pas(2, 2.03, 0.05), 2.03);
    ok('objectiu lluny: avança vMax·dt', prop(M.pas(2, 9, 0.1), 2.25));
    ok('cap enrere també limitat', prop(M.pas(5, 0, 0.2), 4.5));
    ok('amb una altra vMax', prop(M.pas(0, 10, 1, 1), 1));
    eq('no surt del passadís per la porta', M.pas(0.01, -5, 0.1), 0);
    eq('ni per la finestra', M.pas(9.99, 50, 0.1), 10);
    ok('teclat: 1 m/s', prop(M.pasTeclat(3, 1, false, 0.5), 3.5));
    ok('teclat amb Maj: 2 m/s cap a la porta', prop(M.pasTeclat(3, -1, true, 0.5), 2));
    eq('teclat: no passa de la porta', M.pasTeclat(0.2, -1, true, 1), 0);
    const v = [
        [0, 0],
        [4, 6],
        [10, 6],
    ];
    ok('xDe: al mig del primer tram', prop(M.xDe(v, 2), 3));
    eq('xDe: a un vèrtex', M.xDe(v, 4), 6);
    eq('xDe: abans de 0', M.xDe(v, -1), 0);
    eq('xDe: després del final', M.xDe(v, 99), 6);
    const ts = M.temps(10);
    eq('quadrícula de 0 a 10 cada 0,05 s: 201 instants', ts.length, 201);
    eq('…l’últim és exactament 10', ts[200], 10);
}

suite('2. Remostreig');
{
    const r = M.remostreja(
        [
            { t: 0, x: 0 },
            { t: 0.13, x: 1.3 },
            { t: 0.31, x: 3.1 },
            { t: 1, x: 10 },
        ],
        1
    );
    let max = 0;
    M.temps(1).forEach((t, i) => (max = Math.max(max, Math.abs(r[i] - 10 * t))));
    ok('una recta mostrejada irregularment es recupera exacta', max < 1e-9, `error ${max}`);
    const r2 = M.remostreja(
        [
            { t: 0.2, x: 4 },
            { t: 0.6, x: 5 },
        ],
        1
    );
    eq('abans de la primera mostra: el seu valor', r2[0], 4);
    eq('després de l’última: el seu valor', r2[r2.length - 1], 5);
    ok('entremig, interpolació lineal', prop(r2[8], 4.5)); // t = 0,4
    eq(
        'sense mostres: zeros',
        M.remostreja([], 1).every(v => v === 0),
        true
    );
}

suite('3. Puntuació: MAE i estrelles');
{
    const v = [
        [0, 0],
        [3, 6],
        [6, 6],
        [10, 0],
    ];
    const perfecte = avalua(
        v,
        simula(t => M.xDe(v, t), 10)
    );
    ok('un passeig perfecte dona MAE ≈ 0', perfecte.mae < 0.02, `MAE ${perfecte.mae}`);
    eq('…3 estrelles', perfecte.estrelles, 3);
    eq('…cap missatge', perfecte.missatges.length, 0);
    const pla = [
        [0, 2],
        [10, 2],
    ];
    const desplacat = avalua(
        pla,
        simula(() => 3, 10, 's', 3)
    );
    ok('1 m de desplaçament dona MAE ≈ 1', prop(desplacat.mae, 1, 0.01), `MAE ${desplacat.mae}`);
    eq('estrelles: 0,4 → 3', P.estrelles(0.4), 3);
    eq('estrelles: 0,41 → 2', P.estrelles(0.41), 2);
    eq('estrelles: 1,2 → 1', P.estrelles(1.2), 1);
    eq('estrelles: 1,3 → 0', P.estrelles(1.3), 0);
}

suite('4. Puntuació: cada regla');
{
    const regles = r => r.missatges.map(m => m.regla).join(',');
    // 1. Sentit contrari: calia allunyar-se (0→6) i s'acosta (6→0)
    let r = avalua(
        [
            [0, 0],
            [5, 6],
        ],
        simula(t => 6 - 1.2 * t, 5, 'a', 6)
    );
    eq('sentit contrari', regles(r), 'sentit');
    eq('…«t’havies d’allunyar»', r.missatges[0].sentit, 'allunyar');
    // 1b. Calia moure's i s'ha quedat quiet: «parat» (no «sentit contrari»)
    r = avalua(
        [
            [0, 6],
            [4, 0],
        ],
        simula(() => 6, 4, 'p', 6)
    );
    eq('calia moure’s i s’ha quedat quiet', regles(r), 'parat');
    // 2. Calia estar quiet i es mou
    r = avalua(
        [
            [0, 3],
            [5, 3],
        ],
        simula(t => 3 + 0.6 * t, 5)
    );
    eq('calia estar quiet', regles(r), 'quiet');
    // 3. Massa de pressa i massa a poc a poc
    r = avalua(
        [
            [0, 0],
            [10, 5],
        ],
        simula(t => Math.min(10, 1 * t), 10)
    );
    ok('massa de pressa (m̂/m ≈ 2)', regles(r).startsWith('rapid'), regles(r));
    r = avalua(
        [
            [0, 0],
            [5, 10],
        ],
        simula(t => 0.8 * t, 5)
    );
    eq('massa a poc a poc (m̂/m ≈ 0,4)', regles(r), 'lent');
    // 4. Bon pendent però desplaçat
    r = avalua(
        [
            [0, 1],
            [10, 6],
        ],
        simula(t => 2.2 + 0.5 * t, 10, 'd', 2.2)
    );
    eq('massa lluny de la porta', regles(r), 'lluny');
    r = avalua(
        [
            [0, 4],
            [10, 9],
        ],
        simula(t => 2.8 + 0.5 * t, 10, 'e', 2.8)
    );
    eq('massa a prop de la porta', regles(r), 'aprop');
    // Prioritat: un tram amb sentit contrari i desplaçat només dona «sentit»
    r = avalua(
        [
            [0, 2],
            [4, 6],
        ],
        simula(t => 9 - t, 4, 'f', 9)
    );
    eq('prioritat: sentit abans que desplaçament', regles(r), 'sentit');
    // Com a molt dos missatges, els de més pes, en ordre de temps
    const v = [
        [0, 0],
        [2, 4],
        [4, 4],
        [6, 0],
        [8, 0],
        [10, 4],
    ];
    r = avalua(
        v,
        simula(t => (t < 2 ? 0 : t < 4 ? 1.5 * (t - 2) : t < 6 ? 3 : t < 8 ? 3 : 3), 10, 'g', 0)
    );
    ok('màxim dos missatges', r.missatges.length === 2, regles(r));
    ok('…ordenats per temps', r.missatges[0].t0 < r.missatges[1].t0);
    // Sense regla però amb error: la finestra pitjor
    r = avalua(
        [
            [0, 0],
            [1, 2],
            [2, 0],
            [3, 2],
            [4, 0],
        ],
        simula(() => 1, 4, 'h', 1)
    );
    ok('sense cap regla però malament: un missatge amb una finestra d’1 s', r.missatges.length >= 1, regles(r));
}

suite('5. Dibuix');
{
    const o = { T: 10, L: 10, vMax: 2.5 };
    eq('enganxa a 0,5', D.enganxa(2.26, 3.74, 10, 10).join(), '2.5,3.5');
    eq('enganxa: dins dels eixos', D.enganxa(-1, 12, 10, 10).join(), '0,10');
    let r = D.afegeix([], [3, 2], o);
    ok('el primer vèrtex va a t = 0', r.ok && r.vertexs[0].join() === '0,2');
    r = D.afegeix(
        [
            [0, 2],
            [4, 3],
        ],
        [3, 5],
        o
    );
    eq('tornar enrere en el temps', r.error, 'enrere');
    r = D.afegeix(
        [
            [0, 2],
            [4, 3],
        ],
        [4, 6],
        o
    );
    eq('vertical: dos llocs alhora', r.error, 'vertical');
    r = D.afegeix([[0, 0]], [1, 3], o);
    eq('massa de pressa (3 m/s)', r.error, 'rapid');
    ok('2,5 m/s sí', D.afegeix([[0, 0]], [2, 5], o).ok);
    eq(
        'després del final no',
        D.afegeix(
            [
                [0, 0],
                [10, 4],
            ],
            [10, 5],
            o
        ).error,
        'acabat'
    );
    eq(
        'moure un vèrtex fa que el següent torni enrere',
        D.mou(
            [
                [0, 0],
                [4, 2],
                [6, 3],
            ],
            1,
            [7, 2],
            o
        ).error,
        'enrere'
    );
    ok(
        'moure el primer: només x',
        D.mou(
            [
                [0, 0],
                [4, 2],
            ],
            0,
            [3, 1],
            o
        ).vertexs[0].join() === '0,1'
    );
    ok(
        'completa',
        D.completa(
            [
                [0, 1],
                [10, 1],
            ],
            10
        ) &&
            !D.completa(
                [
                    [0, 1],
                    [9.5, 1],
                ],
                10
            )
    );
    const ref = [
        [0, 0],
        [2, 0],
        [4, 5],
        [10, 5],
    ];
    const c = D.condicions(ref);
    eq('condicions: un punt per vèrtex + un per tram quiet', c.length, 6);
    eq('la referència les compleix', D.comprova(ref, c).length, 0);
    eq(
        'una gràfica bona però diferent també',
        D.comprova(
            [
                [0, 0.5],
                [2, 0],
                [3.5, 4.5],
                [4, 5],
                [10, 5.5],
            ],
            c
        ).length,
        0
    );
    const f = D.comprova(
        [
            [0, 0],
            [2, 0],
            [4, 5],
            [7, 5],
            [10, 8],
        ],
        c
    );
    ok('si al final se’n va: falla el punt de 10 s i el tram quiet', f.length === 2, JSON.stringify(f));
    const f2 = D.comprova(
        [
            [0, 0],
            [1, 1.5],
            [2, 0],
            [4, 5],
            [10, 5],
        ],
        c
    );
    ok('un pic dins d’un tram quiet es detecta (al vèrtex de dins)', f2.length === 1 && f2[0].t === 1);
}

suite('6. Narrador');
{
    const v = [
        [0, 2],
        [2, 2],
        [4, 7],
        [6, 7],
        [10, 3],
    ];
    const h = N.historia(v);
    ok('la història diu on comences', h.startsWith('Comences a 2 m de la porta.'));
    ok(
        '…i tots els instants dels vèrtexs',
        ['2', '4', '6', '10'].every(t => h.includes(`${t} s`)),
        h
    );
    eq('nombres amb coma', N.nombre(1.5), '1,5');
    eq(
        'llocs: porta, finestra, mig',
        [0, 10, 5].map(N.llocA).join('|'),
        'a la porta|a la finestra|al mig del passadís'
    );
    const a = N.opcions(v, Atzar.crea('x'), 2.5),
        b = N.opcions(v, Atzar.crea('x'), 2.5);
    eq('opcions deterministes', JSON.stringify(a), JSON.stringify(b));
    eq('tres opcions, una de bona', a.filter(o => o.tipus === 'bona').length + '/' + a.length, '1/3');
    ok('tots tres textos diferents', new Set(a.map(o => o.text)).size === 3);
    ok('la falsa de lectura no és la bona', N.falsaLectura(v, Atzar.crea('y'), 2.5) !== h);
    ok(
        'la falsa de lectura d’un sol tram canvia el lloc (8 m → 5 m, «al mig»)',
        N.falsaLectura(
            [
                [0, 0],
                [10, 8],
            ],
            Atzar.crea('z'),
            2.5
        ).includes('al mig del passadís')
    );
    eq(
        'pregunta lliure: quiet → pla',
        N.preguntaLliure(
            M.temps(4),
            M.temps(4).map(t => (t < 2 ? t : 2))
        ),
        'pla'
    );
    eq(
        'pregunta lliure: torna → baixa',
        N.preguntaLliure(
            M.temps(4),
            M.temps(4).map(t => (t < 2 ? 2 * t : 4 - 1.5 * (t - 2)))
        ),
        'baixa'
    );
    eq(
        'pregunta lliure: sempre endavant → inclinada',
        N.preguntaLliure(
            M.temps(4),
            M.temps(4).map(t => t)
        ),
        'inclinada'
    );
}

finish('MOTORS');
