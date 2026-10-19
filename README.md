# Camina la gràfica

Un passadís a la pantalla perquè l'alumnat de 2n i 3r d'ESO aprengui a llegir i a fer gràfiques **distància–temps** amb el seu propi moviment. L'error que vol desmuntar és el més estudiat de les funcions: llegir la gràfica com si fos **un dibuix del camí** («puja una muntanya») i confondre **l'alçada** amb **la velocitat**.

Web: https://camina.step-quiz.net

## Com funciona

Un personatge camina per un passadís de 10 m: la **porta** és a l'esquerra (0 m) i la **finestra**, a la dreta (10 m). La gràfica diu a quina distància de la porta és a cada moment.

- **Moure's:** tocar o arrossegar sobre el passadís (el personatge hi va caminant, com a molt a 2,5 m/s, mai de cop) o les fletxes ← → (1 m/s; amb Maj, 2 m/s).
- **Gravar:** «Comença» (o l'espai) → compte enrere 3, 2, 1 → es grava durant el temps del repte → s'atura sol. Els comentaris surten **només quan s'acaba**.

| Mode | Què fa l'alumne | Què fa l'eina |
|---|---|---|
| Lliure | Camina com vol durant 10 s | Dibuixa la gràfica i fa una pregunta sobre el que ha fet («On la teva línia és plana, què feies?») |
| Reprodueix | Camina per tapar una línia de punts | Estrelles i, com a molt, dos comentaris sobre el que ha fet el cos («Entre 2 s i 4 s anaves massa de pressa»), amb aquells trams marcats a la gràfica |
| Explica | Tria quina de tres històries explica la gràfica | Les dues falses són errors típics: llegir-la com un dibuix del camí, confondre l'alçada amb la velocitat o llegir malament un temps o un lloc. Després, la camina |
| Dibuixa | Llegeix una història i en dibuixa la gràfica | Els punts s'enganxen a 0,5 s i 0,5 m. No deixa tornar enrere en el temps, fer línies verticals («no pots ser a dos llocs alhora») ni anar a més de 2,5 m/s. «Mira-ho»: el personatge camina la gràfica i l'eina diu quina part de la història no compleix |

**Estrelles (Reprodueix):** segons l'error mitjà entre les dues línies: fins a 0,4 m, ★★★; fins a 0,8 m, ★★; fins a 1,2 m, ★. A Explica i a Dibuixa: ★★★ a la primera, ★★ a la segona, ★ després.

**Reptes:** 15 per mode (Reprodueix, Explica i Dibuixa), 3 de cada nivell.

| Nivell | Gràfica |
|---|---|
| N1 | Un sol tram, a velocitat constant |
| N2 | Camina i para |
| N3 | Va, para i torna |
| N4 | Dues velocitats diferents |
| N5 | Comença lluny de la porta |

**Mode projector:** botó «Projector» (o `#projector=1` a l'adreça): la gràfica a tota l'amplada i la lletra gran.

## Adreces

L'estat va a l'adreça, després del `#`, i es pot compartir: `index.html#mode=dibuixa&repte=d-n2-01`. Els modes són `lliure`, `reprodueix`, `explica` i `dibuixa`; els reptes, els de `data/reptes.js`. Els valors estranys s'ignoren.

## Com provar-ho a l'ordinador

No cal instal·lar res: **obre `index.html` amb doble clic**. No fa cap petició a internet. Les estrelles es desen en aquest navegador (i, si no es pot, s'hi juga igual).

## Com està fet

HTML, CSS i JavaScript sense compilació, amb scripts clàssics perquè funcioni amb doble clic.

```
index.html             la pàgina
css/tokens.css         colors (clar i fosc), també els de la gràfica
css/camina.css         estils (i mode projector)
data/reptes.js         els 45 reptes: només els vèrtexs de cada gràfica
js/motor/atzar.js      atzar amb llavor (el de prova1eso)
js/motor/moviment.js   el passadís: limitador de velocitat, teclat, remostreig cada 0,05 s
js/motor/puntuacio.js  error mitjà, estrelles i comentaris per trams
js/motor/dibuix.js     el mode Dibuixa: què es pot dibuixar i les condicions de cada història
js/motor/narrador.js   les històries (a partir dels vèrtexs) i les falses del mode Explica
js/ui/textos.js        tots els textos
js/ui/passadis.js      el passadís i el personatge (SVG)
js/ui/grafica.js       la gràfica (canvas)
js/ui/app.js           el controlador
tools/versio.py        posa al dia els ?v= dels CSS i JS
```

Les històries de Dibuixa, les tres opcions d'Explica i les condicions que es comproven a Dibuixa **no s'escriuen a mà**: es fan a partir dels vèrtexs de cada repte. Així sempre diuen el mateix que la gràfica.

## Tests

```
node tests/run-all.js
```

| Fitxer | Què comprova |
|---|---|
| `tests/motors.test.js` | El limitador, el teclat i el remostreig; que un passeig perfecte dona error 0 i un desplaçat 1 m dona error 1; cada regla dels comentaris; el mode Dibuixa; el narrador |
| `tests/reptes.test.js` | Les dades: temps, llocs, pendents (com a molt 2 m/s), la forma de cada nivell; que cada repte es pot fer amb ★★★ (un alumne simulat); les opcions d'Explica; que cada història de Dibuixa té una solució i diu tot el que cal |
| `tests/repo.test.js` | Que tot fitxer citat existeix, l'ordre dels scripts, cap adreça externa, cap mòdul ES ni `fetch` (doble clic), textos curts |
| `tools/versio.py --comprova` | Que cap `?v=` és vell |
| `tests/docs_vs_codi.py` | Que aquest README diu el mateix que el codi (modes, nivells, reptes, llindars) |

GitHub els passa a cada pujada a `main` (`.github/workflows/tests.yml`).

## Pujar canvis

Els ZIP es pugen a `_uploads/` (GitHub → `_uploads/` → *Add file* → *Upload files*) i el workflow `.github/workflows/unzip-upload.yml` els descomprimeix a l'arrel i en fa commit.

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
