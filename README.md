# Fisheye - Portfolios de Photographes Professionnels

## Description

Fisheye est une plateforme web moderne de portfolios de photographes professionnels. L'application permet aux utilisateurs de découvrir des artistes talentueux et de trouver le photographe idéal pour leurs projets.

**100% Vanilla JavaScript** - Aucun framework, uniquement HTML/CSS/JS natif.

## Fonctionnalités

### Navigation et Recherche
- **Page d'accueil** : Affichage de tous les photographes disponibles
- **Barre de recherche** : Recherche avec auto-complétion et debounce
- **Filtres par tags** : Portrait, Événements, Mode, Architecture, etc.
- **Tri des médias** : Par popularité, date ou titre (asc/desc)
- **URLs partageables** : État des filtres sauvegardé dans l'URL

### Galeries et Médias
- **Pages photographes** : Galeries individuelles avec médias (photos/vidéos)
- **Lightbox** : Visualisation plein écran avec navigation clavier
- **Mode plein écran** : Fullscreen API pour immersion totale
- **Lazy loading** : Chargement progressif des images
- **Infinite scroll** : Pagination automatique au défilement

### Interactions
- **Système de likes** : Like optimiste avec persistance localStorage
- **Favoris** : Sauvegarde des photographes/médias préférés
- **Drag & Drop** : Réorganisation des médias
- **Raccourcis clavier** : Navigation rapide (?, Ctrl+K, J/K, L, Escape)
- **Partage** : Share API avec fallback Clipboard

### Formulaires
- **Formulaire de contact** : Validation en temps réel avec regex
- **Auto-save** : Sauvegarde automatique du brouillon (sessionStorage)
- **Notifications Toast** : Feedback utilisateur élégant

### Performance
- **Cache des données** : Évite les requêtes redondantes
- **Web Workers** : Tri/filtrage dans un thread séparé
- **Throttle/Debounce** : Optimisation des événements scroll/input
- **Page Visibility API** : Pause des vidéos quand l'onglet est inactif

## Structure du Projet

```
fisheye-frontend/
├── assets/              # Images, icônes et ressources
├── css/                 # Styles CSS
│   ├── style.css        # Styles principaux
│   ├── photographer.css # Styles page photographe
│   └── stats.css        # Styles page statistiques
├── data/                # Données JSON des photographes
├── docs/
│   └── concepts/        # Documentation des 21 concepts JavaScript
├── scripts/
│   ├── api/             # Couche d'accès aux données
│   ├── db/              # Gestion des données locales
│   ├── factories/       # Factory Pattern (Media, Photographers)
│   ├── models/          # Classes de données
│   ├── pages/           # Logique spécifique aux pages
│   ├── templates/       # Composants UI (création DOM)
│   ├── utils/           # Utilitaires et managers
│   └── workers/         # Web Workers
├── index.html           # Page d'accueil
├── photographer.html    # Page photographe
├── favorites.html       # Page favoris
├── stats.html           # Page statistiques
└── ROADMAP.md           # Plan de développement
```

## Installation

```bash
# Cloner le projet
git clone https://github.com/NathanHallouin/fisheye-frontend.git

# Aller dans le dossier
cd fisheye-frontend

# Installer les dépendances (pour linting)
npm install

# Ouvrir index.html dans votre navigateur
```

## Scripts NPM

```bash
npm run lint      # Vérifier le code avec ESLint
npm run format    # Formater avec Prettier
```

## Concepts JavaScript Documentés

Le projet sert de référence pour apprendre les concepts clés de JavaScript moderne :

| Catégorie | Concepts |
|-----------|----------|
| **ES6+** | Classes, Getters/Setters, Template Literals, Arrow Functions, Destructuring, Spread |
| **Async** | Promises, Async/Await, Fetch API |
| **DOM** | Manipulation, Event Handling, Event Delegation |
| **Patterns** | Factory, Singleton, Observer, Strategy, Decorator |
| **APIs** | localStorage, History, IntersectionObserver, Clipboard, Share, Fullscreen, Page Visibility |
| **Performance** | Debounce, Throttle, Lazy Loading, Web Workers, Caching |
| **Qualité** | Error Handling, Custom Errors, Validation, Accessibility |

Voir la [documentation complète](docs/concepts/README.md) pour chaque concept.

## Technologies

- **HTML5** : Structure sémantique et accessible
- **CSS3** : Variables CSS, Flexbox, Grid, animations
- **JavaScript ES6+** : Classes, modules, async/await
- **WebP** : Format d'image optimisé

## Accessibilité

- Navigation clavier complète
- Attributs ARIA sur tous les éléments interactifs
- Focus visible et gestion du focus trap
- Textes alternatifs pour les images
- Support lecteurs d'écran

## Compatibilité

| Navigateur | Support |
|------------|---------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |

## Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `?` | Afficher l'aide des raccourcis |
| `Ctrl+K` | Ouvrir la recherche |
| `Escape` | Fermer modal/lightbox |
| `J` / `K` | Média suivant/précédent |
| `L` | Liker le média sélectionné |
| `←` / `→` | Navigation lightbox |

## Licence

MIT
