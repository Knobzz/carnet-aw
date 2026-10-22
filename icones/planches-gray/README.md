# Les planches de Gray, telles qu'elles ont été trouvées

Henry Gray, *Anatomy of the Human Body*, 1918 — **domaine public**. C'est la
seule raison de ces planches-là : une image trouvée au hasard aurait une
licence invérifiable sur une app publiée.

Chaque fichier montre le membre entier avec **un** muscle teinté en rouge.
Elles sont rangées sous leur nom **latin**, parce que c'est le nom écrit sur
la gravure — et c'est aussi ce qui permet de les retrouver à la source.

Ce dossier est une **archive de sources**, pas ce que l'app sert. Les
illustrations servies sont `icones/muscle-*.png`, dérivées de
`icones/planches/` par `outils/recadrer-planches.py`.

Recomposées sur blanc et réduites à 32 couleurs sans tramage, comme le reste :
3.6 Mo au lieu de 13.3 Mo, et indistinguables à l'œil sur des gravures à
quatre teintes.

## Les 24 qui correspondent à un muscle du modèle

Deux muscles du modèle portent **deux** planches : les fléchisseurs des doigts
(*superficialis* et *profundus*) et les extenseurs du pouce (*longus* et
*brevis*). Le modèle les tient pour un seul muscle chacun.

| planche | muscle du modèle |
|---|---|
| `deltoideus.png` | `deltoide` |
| `anconeus.png` | `ancone` |
| `biceps_brachii.png` | `biceps` |
| `brachialis.png` | `brachial` |
| `brachioradialis.png` | `brachio_radial` |
| `coracobrachialis.png` | `coraco_brachial` |
| `extensor_carpi_radialis_brevis.png` | `ecrb` |
| `extensor_carpi_radialis_longus.png` | `ecrl` |
| `extensor_carpi_ulnaris.png` | `ecu` |
| `extensor_digiti_minimi.png` | `extenseur_petit_doigt` |
| `extensor_digitorum.png` | `extenseurs_doigts` |
| `extensor_pollicis_brevis.png` | `extenseurs_pouce` |
| `extensor_pollicis_longus.png` | `extenseurs_pouce` |
| `flexor_carpi_radialis.png` | `fcr` |
| `flexor_carpi_ulnaris.png` | `fcu` |
| `flexor_digitorum_profundus.png` | `flechisseurs_doigts` |
| `flexor_digitorum_superficialis.png` | `flechisseurs_doigts` |
| `palmaris_longus.png` | `long_palmaire` |
| `pronator_quadratus.png` | `carre_pronateur` |
| `pronator_teres.png` | `rond_pronateur` |
| `supinator.png` | `supinateur` |
| `triceps_brachii.png` | `triceps` |
| `latissimus_dorsi.png` | `grand_dorsal` |
| `pectoralis_major.png` | `grand_pectoral` |

## Les 13 qui ne sont PAS dans le modèle

Treize muscles sans illustration servie, parce qu'ils n'existent pas encore
dans `js/model.js`. Les y ajouter demande plus qu'un fichier : un nom court,
ce que le muscle FAIT, l'articulation qu'il mobilise, une zone ressentie qui
le nomme sans jargon, et sa place dans les mouvements du bras de fer.

| planche | taille |
|---|---|
| `abductor_digiti_minimi.png` | 637 × 887 |
| `abductor_pollicis_brevis.png` | 637 × 887 |
| `abductor_pollicis_longus.png` | 406 × 983 |
| `adductor_pollicis.png` | 637 × 887 |
| `extensor_indicis.png` | 406 × 983 |
| `flexor_digiti_minimi_brevis.png` | 637 × 887 |
| `flexor_pollicis_brevis.png` | 637 × 887 |
| `flexor_pollicis_longus.png` | 406 × 1241 |
| `lumbricales.png` | 637 × 887 |
| `opponens_digiti_minimi.png` | 457 × 475 |
| `opponens_pollicis.png` | 637 × 887 |
| `palmaris_brevis.png` | 637 × 887 |
| `subscapularis.png` | 520 × 504 |
