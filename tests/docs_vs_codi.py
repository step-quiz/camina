#!/usr/bin/env python3
"""
PROJECTE: camina (Step Quiz, vanilla JS)
FITXER: tests/docs_vs_codi.py
ROL: Que el README diu el mateix que el codi:
  - les rutes entre `cometes` del README existeixen;
  - els modes i els nivells són els de js/ui/textos.js;
  - els nombres que cita (reptes per mode, total, llindars d'estrelles, velocitats)
    són els de les dades i de la configuració.
ÚS: python3 tests/docs_vs_codi.py   (només biblioteca estàndard)
"""
import pathlib
import re
import sys

ARREL = pathlib.Path(__file__).resolve().parent.parent
llegeix = lambda rel: (ARREL / rel).read_text(encoding='utf-8')
errors = []


def comprova(cond, msg):
    if not cond:
        errors.append(msg)


readme = llegeix('README.md')

# 1. Rutes citades
for ruta in re.findall(r'`([^`\s#]+\.(?:js|css|html|py|yml|md))(?:\?[^`]*)?`', readme):
    if ruta.startswith('.github/'):
        continue  # els workflows es creen des del web de GitHub
    comprova((ARREL / ruta).exists(), f'README.md cita `{ruta}`, que no existeix')

# 2. Modes i nivells
textos = llegeix('js/ui/textos.js')
for clau, nom in re.findall(r"(\w+): \{ nom: '([^']+)', instruccio", textos):
    comprova(f'| {nom} |' in readme, f'README.md: la taula de modes no té «{nom}»')
    comprova(f'`{clau}`' in readme, f'README.md: no diu el valor `{clau}` de l’adreça')
for n in range(1, 6):
    comprova(f'| N{n} |' in readme, f'README.md: la taula de nivells no té N{n}')

# 3. Nombres
reptes = llegeix('data/reptes.js')
per_mode = {m: len(re.findall(rf"R\('[^']+', \d, '{m}'", reptes)) for m in ('reprodueix', 'explica', 'dibuixa')}
total = sum(per_mode.values())
comprova(len(set(per_mode.values())) == 1, f'data/reptes.js: no tots els modes tenen els mateixos reptes {per_mode}')
n = next(iter(per_mode.values()))
comprova(f'{n} per mode' in readme, f'README.md: hi ha {n} reptes per mode')
comprova(f'els {total} reptes' in readme, f'README.md: hi ha {total} reptes en total')
punt = llegeix('js/motor/puntuacio.js')
llindars = re.search(r'estrelles: \[([\d., ]+)\]', punt).group(1).split(',')
for v in llindars:
    comprova(f"{v.strip().replace('.', ',')} m" in readme, f'README.md: falta el llindar {v.strip()} m de les estrelles')
mov = llegeix('js/motor/moviment.js')
vmax = re.search(r'vMax: ([\d.]+)', mov).group(1).replace('.', ',')
comprova(f'{vmax} m/s' in readme, f'README.md: la velocitat màxima és {vmax} m/s')
for clau in ('vTeclat', 'vTeclatRapid'):
    v = re.search(clau + r': ([\d.]+)', mov).group(1).replace('.', ',')
    comprova(f'{v} m/s' in readme, f'README.md: falta la velocitat del teclat {v} m/s')
comprova('cada 0,05 s' in readme and 'dt: 0.05' in mov, 'README.md: el remostreig és cada 0,05 s')

if errors:
    print(f'✗ camina: {len(errors)} discrepàncies entre la documentació i el codi:')
    for e in errors:
        print('  - ' + e)
    sys.exit(1)
print('✓ camina: la documentació quadra amb el codi.')
