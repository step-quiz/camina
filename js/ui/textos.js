/**
 * ============================================================================
 * PROJECTE: camina (Step Quiz, vanilla JS)
 * FITXER: js/ui/textos.js
 * ROL: Tots els textos que veu l'alumne. Curts (com a molt unes 40 paraules a
 *      la vegada). El que es diu després de caminar parla del que ha fet el COS,
 *      no de nombres.
 * ARQUITECTURA: Dades (window.CaminaTextos); també es carrega amb Node (tests).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.CaminaTextos = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    return {
        MODES: {
            lliure: { nom: 'Lliure', instruccio: 'Camina com vulguis pel passadís i mira quina gràfica fas.' },
            reprodueix: { nom: 'Reprodueix', instruccio: 'Camina de manera que la teva línia tapi la línia de punts.' },
            explica: { nom: 'Explica', instruccio: 'Quina història explica aquesta gràfica?' },
            dibuixa: { nom: 'Dibuixa', instruccio: 'Dibuixa la gràfica d’aquesta història.' },
        },
        NIVELLS: {
            1: 'N1 · Un tram',
            2: 'N2 · Camina i para',
            3: 'N3 · Va, para i torna',
            4: 'N4 · Dues velocitats',
            5: 'N5 · Comences lluny',
        },

        // ── Gravar ────────────────────────────────────────────────────────
        comencar: 'Comença',
        tornaAComencar: 'Torna-ho a provar',
        preparat:
            'Preparat? Toca el passadís (o fes servir les fletxes) per caminar. Comença amb el botó o amb l’espai.',
        preparatLliure: 'Toca el passadís per moure’t on vulguis. Quan vulguis, comença: tindràs 10 segons.',
        comAMoure: 'Toca o arrossega sobre el passadís: hi aniràs caminant. Fletxes ← →: 1 m/s; amb Maj, 2 m/s.',
        gravant: 'Camina!',
        aturat: 'S’ha aturat la gravació perquè has canviat de pestanya. Torna-ho a provar.',
        temps: t => `${t} s`,
        distancia: d => `${d} m de la porta`,

        // ── Puntuació ─────────────────────────────────────────────────────
        estrelles: ['Torna-ho a provar.', 'Bé!', 'Molt bé!', 'Perfecte!'],
        entre: (a, b) => `Entre ${a} s i ${b} s`,
        regles: {
            sentit_allunyar: 't’havies d’allunyar de la porta i t’hi has acostat',
            sentit_acostar: 't’havies d’acostar a la porta i te n’has allunyat',
            quiet: 'havies d’estar quiet i t’has mogut',
            parat: 't’havies de moure i t’has quedat quiet',
            rapid: 'anaves massa de pressa',
            lent: 'anaves massa a poc a poc',
            lluny_inici: 'has començat massa lluny de la porta',
            aprop_inici: 'has començat massa a prop de la porta',
            lluny: 'eres massa lluny de la porta',
            aprop: 'eres massa a prop de la porta',
            llunyFinestra: 't’has allunyat massa de la porta',
            apropFinestra: 't’has acostat massa a la porta',
        },
        totBe: 'La teva línia segueix la de punts tota l’estona.',
        pista: 'Pista: mira on comença la línia i on fa angles. Cada tros recte és una manera de caminar.',

        // ── Lliure: preguntes de reflexió ─────────────────────────────────
        preguntes: {
            pla: {
                pregunta: 'On la teva línia és plana, què feies?',
                opcions: [
                    ['bona', 'Estava quiet.'],
                    ['dibuix', 'Caminava per un terra pla.'],
                    ['alcada', 'Anava a la mateixa velocitat, de pressa.'],
                ],
            },
            baixa: {
                pregunta: 'On la teva línia baixa, què feies?',
                opcions: [
                    ['bona', 'M’acostava a la porta.'],
                    ['dibuix', 'Baixava una baixada.'],
                    ['alcada', 'Anava cada cop més a poc a poc.'],
                ],
            },
            inclinada: {
                pregunta: 'Com es veu a la gràfica quan vas de pressa?',
                opcions: [
                    ['bona', 'La línia és molt inclinada.'],
                    ['alcada', 'La línia és molt amunt.'],
                    ['dibuix', 'La línia fa una pujada.'],
                ],
            },
        },
        respostes: {
            bona: 'Exacte.',
            dibuix: 'No: la gràfica no és un dibuix del camí. Diu a quina distància de la porta ets a cada moment.',
            alcada: 'No: com més amunt, més lluny de la porta, no més de pressa. La velocitat es veu en la inclinació.',
            lectura: 'Gairebé: mira bé els temps i els llocs on la línia fa angles.',
        },
        provaUnAltre: 'Torna a caminar',

        // ── Explica ───────────────────────────────────────────────────────
        araCamina: 'Ara camina-la →',
        explicaBe: 'Exacte! Ara comprova-ho caminant.',

        // ── Dibuixa ───────────────────────────────────────────────────────
        dibuixaComo:
            'Toca la gràfica per posar punts: el primer és on ets a l’instant 0. Amb el teclat: fletxes i Retorn.',
        dibuixaFalta: t => `Continua fins al final (${t} s).`,
        miraho: 'Mira-ho',
        desfes: 'Desfés',
        esborra: 'Esborra',
        errorsDibuix: {
            enrere: 'No pots tornar enrere en el temps: cada punt ha d’anar més a la dreta que l’anterior.',
            vertical: 'Una línia vertical voldria dir ser a dos llocs alhora: no pot ser.',
            rapid: 'Tan de pressa no es pot anar: com a molt 2,5 m cada segon.',
            fora: 'Aquest punt és fora de la gràfica.',
            acabat: 'La gràfica ja arriba al final. Desfés l’últim punt si la vols canviar.',
            primer: 'El primer punt va a l’instant 0: és on comences.',
        },
        condicio: {
            punt: (t, lloc, diu) => `Als ${t} s havies de ser ${lloc}; la teva gràfica diu ${diu} m.`,
            quiet: (a, b, lloc) => `De ${a} s a ${b} s havies d’estar quiet ${lloc}.`,
        },
        dibuixaBe: 'La teva gràfica explica la història. En gris, una altra manera de dibuixar-la.',
        miraLaRef: 'Mira la línia grisa: és una solució.',

        // ── Selector ──────────────────────────────────────────────────────
        repte: (i, n) => `Repte ${i} de ${n}`,
        projector: 'Projector',
        sortirProjector: 'Surt del mode projector',
        esborraProgres: 'S’esborraran les estrelles de tots els reptes. Vols continuar?',
    };
});
