# Les six pieges, et ou ils sont traites

Deplace depuis le README le 2026-10-31. Rien n'a ete coupe.

1. **Pas de re-rendu à la frappe.** `js/vue-seance.js` : les gestionnaires d'entrée
   écrivent dans le modèle, rafraîchissent trois `textContent` de totaux, et s'arrêtent
   là. Ajouter, retirer ou déplacer une série insère / retire / déplace **un** nœud.
   Vérifié : focus et position du curseur conservés sur quatre frappes consécutives.
2. **Rien en dur.** Aucun programme, aucun exercice, aucun outil livré, et pas davantage
   de routine de récupération. Les trois catalogues (exercices, outils, catégories)
   n'existent que par ce qui a été saisi.
   Il y avait **une exception** — un bouton « Ajouter mon matériel » posant douze outils
   écrits dans le code. Elle a été **retirée** : opt-in ou non, une liste écrite dans le
   code est une liste imposée, et elle revenait indéfiniment pour tout outil supprimé.
   Remonter un équipement d'un coup, c'est le travail de l'import d'une sauvegarde.
3. **Ni `confirm()` ni `alert()`.** Deux formes : le bouton qui s'arme et se désarme
   seul après 4 s (`A.ui.confirmer2`), et la feuille de choix (`A.ui.feuille`) qui
   nomme ce qui va disparaître.
4. **Persistance.** Lecture et écriture sous `try/catch` ; un échec affiche un bandeau
   qui dit quoi faire, au lieu de perdre la saisie en silence. Écriture groupée à
   400 ms, immédiate quand la page passe en arrière-plan. Export et import vérifiés
   par un aller-retour complet : export → tout effacer → import → état identique.
5. **Mobile d'abord.** Vérifié à 320 px : aucun défilement horizontal sur les cinq
   écrans ni dans les panneaux, et aucun contrôle sous 44 px.
6. **Thème clair et sombre**, déduits du système, surchargeables dans Réglages.

---

