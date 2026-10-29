# Recherche — AVANT-BRAS (19 mouvements, 48 écritures)

## Autre exercice (C)

| écriture | sous | pourquoi |
|---|---|---|
| **Farmer walk** | Dead hang | port de charge **en marchant**, bras le long du corps. Rien ne le rattache au suspendu sinon la prise tenue |
| **Marche du fermier** | Dead hang | traduction du précédent |

**PRIX À CONNAÎTRE AVANT DE LES RETIRER** : il n'existe **aucune entrée « Farmer walk »**
au dictionnaire. Les retirer rend le nom introuvable à la recherche, alors que les listes
de mots-clés musculaires continuent de le reconnaître. Il faut donc soit retirer le mot
**aux deux endroits**, soit en faire **sa propre fiche**.

## En trop — coût mesuré, pas estimé

L'agent a d'abord mesuré **ce qu'une suppression coûte** : les écritures sont des clés de
recherche, et `placeParMots` exige **tous** les mots dans **une seule** écriture. Une
écriture n'est donc gratuite que si une autre écriture de la même fiche contient tous ses
mots.

| écriture | ce qu'on perd exactement |
|---|---|
| Gripper ▸ **Serrage** | rien — « serrage » est contenu dans « Serrage de poing » |
| Curl pronation à la poulie ▸ **Pronation curl à la poulie** | rien — tous ses mots sont dans le nom principal |
| Curl Larratt ▸ **Tenue de coude** | le rang seulement — {tenue, coude} ⊂ « Tenue isométrique de coude » |
| Dead hang ▸ **Barre fixe en tenue** | le rang seulement — {tenue, barre} déjà dans « Tenue à la barre » |
| Wrist curl côté pouce ▸ **Wrist curl accentué pouce** | le seul mot « accentué » |
| Extenseurs à élastique ▸ **une** des deux « Ouverture… » | une frappe à deux mots |

**ET UNE SUPPRESSION SE FAIT DEUX FOIS** : les mêmes chaînes sont recopiées dans les
listes de mots-clés musculaires. Les oublier les ferait diverger.

## Ce qu'il REFUSE de lister en trop, et il a raison

Les écritures d'engin (`Poignée de pronation`, `Poignée à ressort`, `Pinch block`,
`Élastique autour des doigts`, `Supination à la clé`). **C'est une décision de MB du 29/10,
déjà prise et écrite dans le code.** La contredire ici serait la reprendre à sa place.

Et `Wrist curl côté auriculaire` reste : c'est le seul endroit de la fiche qui porte le mot
« auriculaire », qu'un utilisateur tape vraiment.

## À trancher par MB

1. **« Chop »** — **aucune source externe** ne le définit. Ni Wikipédia (hand pressures :
   cupping, pronation, supination, rising, side/back pressure, posting), ni ArmProgress
   (66 exercices, **aucune** entrée « chop » ni « ulnar »), ni les sites de rééducation.
   Classé « même geste » uniquement parce que c'est **le mot de MB**.
2. **« Cupping » est-il sous la bonne fiche ?** Wikipédia donne raison au rangement actuel
   (cupping = la flexion, donc *Wrist curl*). Mais ArmProgress sépare « Cupping » de
   « Wrist Curls », et au bras de fer cupping nomme d'ordinaire une **pression tenue**.
   **Conséquence mesurable** : taper « cupping » tombe sur une fiche en **reps**, pas sur
   `Cup hold` qui est en **charge + durée** — exactement le doublon déjà payé avec
   « Tenue en cup ».
3. **« Supination à la clé » — conflit INTERNE**, pas d'arbitrage externe. Le catalogue
   d'équipement envoie la clé de poignet (`wrist wrench`) sur *Wrist curl* / *Wrist curl
   inversé*, les bords pouce/petit doigt étant un **réglage de mousqueton** ; cette
   écriture-ci l'envoie sur *Supination*. Une seule fiche produit de faible qualité parle
   de « pronation & supination drills ». **Ne sait pas** si « à la clé » désigne la clé de
   poignet ou un levier chargé au bout.
4. **« Curl Larratt » a six écritures** qui disent toutes la même chose avec un mot
   différent. Toutes justes ; en garder six est un **choix de confort de frappe**, pas une
   exigence de vocabulaire.
5. **Collision de recherche** : taper « rouleau » seul tombe sur *Finger curl* (« Rouleau
   de doigts ») alors que `rouleau de poignet` est un engin routé vers *Wrist curl*.
   Rien n'est faux, le classement peut surprendre.

## Note de périmètre, dite par l'agent

La liste fournie était un **extrait réduit** : le dictionnaire porte en plus, sur ces mêmes
fiches, `Inclinaison radiale`, `Cable Chop`, `Déviation ulnaire au cable/à la poulie`,
`Pronation à la poulie`, `Supination à la poulie / avec haltère / avec élastique`,
`Wrist curl à la poulie/barre/haltères`, `Finger curl à la barre`, `Cup hold à la poulie`…
**Son classement ne porte pas sur elles** — ce sont les écritures d'engin, déjà classées
« variantes » par la mesure locale.
