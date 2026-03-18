# Concepts JavaScript - Index

Ce dossier contient la documentation détaillée de tous les concepts JavaScript utilisés dans le projet Fisheye.

## Structure

Chaque concept est documenté dans un fichier séparé avec :
- Explication du concept
- Syntaxe et exemples
- Implémentation dans Fisheye (avec liens vers les fichiers)
- Cas d'usage courants
- Exercice pratique

---

## ES6+ Features

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 01 | [Classes ES6](01-classes-es6.md) | Syntaxe moderne pour la POO | Tous les fichiers |
| 02 | [Getters/Setters](02-getters-setters.md) | Accès contrôlé aux propriétés | Models, Templates |
| 03 | [Template Literals](03-template-literals.md) | Interpolation de chaînes | Tous les templates |
| 04 | [Arrow Functions](04-arrow-functions.md) | Syntaxe concise pour les fonctions | Callbacks, events |
| 05 | [Destructuring](05-destructuring.md) | Extraction de valeurs | EventBus, CacheManager |
| 06 | [Spread Operator](06-spread-operator.md) | Copie et fusion | App.js, SortFilters |

---

## Manipulation de données

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 07 | [Array Methods](07-array-methods.md) | map, filter, reduce, etc. | Tous les fichiers |
| 13 | [Data Structures](13-data-structures.md) | Map, Set, Array, Object | CacheManager, TagFilter |

---

## Asynchrone

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 08 | [Async/Await](08-async-await.md) | Gestion de l'asynchrone | Api.js, App.js |

---

## DOM et Événements

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 09 | [DOM Manipulation](09-dom-manipulation.md) | Création et modification du DOM | Tous les templates |
| 10 | [Event Handling](10-event-handling.md) | Gestion des événements | Tous les fichiers |

---

## Architecture et Patterns

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 11 | [Design Patterns](11-design-patterns.md) | Factory, Singleton, Observer | Factories, Managers |
| 16 | [Closures](16-closures.md) | Fonctions avec état | debounce.js |
| 18 | [Decorator Pattern](18-decorator-pattern.md) | Higher-order functions, AOP | withLogging.js |
| 20 | [State Management](20-state-management.md) | Mini Redux, flux unidirectionnel | Store.js |

---

## APIs et Stockage

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 12 | [Browser APIs](12-browser-apis.md) | fetch, History, localStorage | Api.js, managers |

---

## Performance et Qualité

| # | Concept | Description | Fichier |
|---|---------|-------------|---------|
| 14 | [Performance](14-performance.md) | Debounce, lazy loading, cache | Utils |
| 15 | [Error Handling](15-error-handling.md) | try/catch, validation | Api.js, managers |
| 17 | [Accessibility](17-accessibility.md) | ARIA, navigation clavier | Templates |
| 19 | [Custom Errors](19-custom-errors.md) | Classes d'erreurs typées | CustomErrors.js |
| 21 | [Web Workers](21-web-workers.md) | Calculs en thread séparé | sortWorker.js |

---

## Progression suggérée

### Niveau Débutant
1. [Classes ES6](01-classes-es6.md) - Base de la POO
2. [Template Literals](03-template-literals.md) - Manipulation de chaînes
3. [Arrow Functions](04-arrow-functions.md) - Syntaxe moderne
4. [Array Methods](07-array-methods.md) - Manipulation de tableaux
5. [DOM Manipulation](09-dom-manipulation.md) - Création d'interface

### Niveau Intermédiaire
6. [Getters/Setters](02-getters-setters.md) - Encapsulation
7. [Destructuring](05-destructuring.md) - Extraction de données
8. [Spread Operator](06-spread-operator.md) - Copie immutable
9. [Event Handling](10-event-handling.md) - Interactivité
10. [Async/Await](08-async-await.md) - Asynchrone

### Niveau Avancé
11. [Design Patterns](11-design-patterns.md) - Architecture
12. [Closures](16-closures.md) - Fonctions avancées
13. [Data Structures](13-data-structures.md) - Map, Set
14. [Browser APIs](12-browser-apis.md) - APIs natives
15. [Performance](14-performance.md) - Optimisation

### Niveau Expert
16. [Error Handling](15-error-handling.md) - Robustesse
17. [Accessibility](17-accessibility.md) - A11Y
18. [Decorator Pattern](18-decorator-pattern.md) - AOP
19. [Custom Errors](19-custom-errors.md) - Erreurs typées
20. [State Management](20-state-management.md) - Mini Redux
21. [Web Workers](21-web-workers.md) - Multi-threading

---

## Comment utiliser cette documentation

1. **Apprentissage** - Suivre la progression suggérée
2. **Référence** - Consulter un concept spécifique
3. **Révision** - Relire les implémentations Fisheye
4. **Pratique** - Faire les exercices de chaque fichier

---

## Liens avec la ROADMAP

Chaque feature de la [ROADMAP](../../ROADMAP.md) utilise plusieurs concepts :

| Feature | Concepts utilisés |
|---------|-------------------|
| Filtres par tags | Array methods, Set, Event handling |
| Recherche | Closures, Debounce, String methods |
| Tri des médias | Array.sort, Spread, Strategy pattern |
| Favoris | localStorage, Singleton, Observer |
| Lazy loading | IntersectionObserver, Async |
| Raccourcis clavier | Event handling, Map |

---

## Ressources complémentaires

- [MDN Web Docs](https://developer.mozilla.org/fr/)
- [JavaScript.info](https://javascript.info/)
- [W3C ARIA](https://www.w3.org/WAI/ARIA/)
