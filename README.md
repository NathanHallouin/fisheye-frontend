<p align="center">
  <img src="assets/images/logo.png" alt="Fisheye Logo" width="200">
</p>

<h1 align="center">Fisheye</h1>

<p align="center">
  <strong>Plateforme de portfolios pour photographes professionnels</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/No_Framework-100%25_Vanilla-green?style=flat-square" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/Accessible-WCAG_2.1-blue?style=flat-square" alt="Accessibility">
</p>

<p align="center">
  <a href="#-fonctionnalités">Fonctionnalités</a> •
  <a href="#-démo">Démo</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-documentation">Documentation</a>
</p>

---

## A propos

Fisheye est une application web qui met en valeur le travail de photographes professionnels à travers des portfolios élégants et interactifs. Conçue entièrement en **JavaScript vanilla** (sans framework), elle démontre les bonnes pratiques du développement web moderne tout en offrant une expérience utilisateur fluide et accessible.

### Pourquoi ce projet ?

Ce projet a été développé dans un contexte d'apprentissage pour explorer et maîtriser les concepts fondamentaux de JavaScript moderne, incluant :

- **Architecture modulaire** sans dépendance externe
- **Design Patterns** (Factory, Singleton, Observer, Strategy)
- **APIs Web modernes** (Fetch, IntersectionObserver, Web Workers)
- **Accessibilité** (WCAG 2.1, navigation clavier, ARIA)
- **Performance** (lazy loading, caching, debounce/throttle)

---

## Fonctionnalités

<table>
  <tr>
    <td width="50%">
      <h3>Navigation & Recherche</h3>
      <ul>
        <li>Recherche instantanée avec debounce</li>
        <li>Filtrage par catégories (tags)</li>
        <li>Tri multi-critères (popularité, date, titre)</li>
        <li>URLs partageables avec état des filtres</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Galerie & Médias</h3>
      <ul>
        <li>Lightbox immersive avec mode plein écran</li>
        <li>Support photos et vidéos</li>
        <li>Lazy loading intelligent</li>
        <li>Infinite scroll fluide</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Interactions</h3>
      <ul>
        <li>Système de likes optimiste</li>
        <li>Gestion des favoris</li>
        <li>Drag & Drop pour réorganiser</li>
        <li>Raccourcis clavier complets</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Performance</h3>
      <ul>
        <li>Cache intelligent des données</li>
        <li>Web Workers pour le tri</li>
        <li>Optimisation scroll/input</li>
        <li>Pause auto des vidéos (Page Visibility)</li>
      </ul>
    </td>
  </tr>
</table>

---

## Démo

### Page d'accueil
Découvrez tous les photographes avec filtres par spécialité.

### Page photographe
Explorez la galerie d'un artiste, likez ses photos, et contactez-le.

### Lightbox
Visualisez les médias en plein écran avec navigation au clavier.

---

## Installation

```bash
# Cloner le repository
git clone https://github.com/NathanHallouin/fisheye-frontend.git

# Accéder au dossier
cd fisheye-frontend

# Installer les dépendances de développement
npm install

# Lancer un serveur local (ex: avec Live Server ou Python)
# Option 1: Extension VSCode Live Server
# Option 2: Python
python -m http.server 5500

# Ouvrir http://localhost:5500 dans votre navigateur
```

### Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run lint` | Vérification du code avec ESLint |
| `npm run format` | Formatage avec Prettier |

---

## Architecture

```
fisheye-frontend/
│
├── assets/                 # Ressources statiques
│   ├── images/            # Images UI et logo
│   ├── media/             # Photos et vidéos des photographes
│   └── photographers/     # Portraits des photographes
│
├── css/                    # Feuilles de style
│   ├── style.css          # Styles globaux
│   ├── photographer.css   # Page photographe
│   └── stats.css          # Page statistiques
│
├── data/
│   └── photographers.json # Base de données JSON
│
├── docs/
│   └── concepts/          # Documentation technique (21 concepts JS)
│
├── scripts/
│   ├── api/               # Couche d'accès aux données
│   ├── db/                # Gestion données locales
│   ├── factories/         # Factory Pattern
│   ├── models/            # Classes métier
│   ├── pages/             # Contrôleurs de pages
│   ├── templates/         # Composants UI
│   ├── utils/             # Utilitaires
│   └── workers/           # Web Workers
│
├── index.html             # Page d'accueil
├── photographer.html      # Page photographe
├── favorites.html         # Page favoris
└── stats.html             # Tableau de bord
```

### Patterns utilisés

| Pattern | Utilisation |
|---------|-------------|
| **Factory** | Création de médias (photo/vidéo) et cartes |
| **Singleton** | Gestionnaires (Cache, Toast, EventBus) |
| **Observer** | Communication entre composants |
| **Strategy** | Algorithmes de tri interchangeables |
| **Decorator** | Logging et memoization |

---

## Documentation

Une documentation complète des **21 concepts JavaScript** utilisés est disponible :

<details>
<summary><strong>ES6+ Fondamentaux</strong></summary>

- [Classes ES6](docs/concepts/01-classes-es6.md)
- [Getters & Setters](docs/concepts/02-getters-setters.md)
- [Template Literals](docs/concepts/03-template-literals.md)
- [Arrow Functions](docs/concepts/04-arrow-functions.md)
- [Destructuring](docs/concepts/05-destructuring.md)
- [Spread Operator](docs/concepts/06-spread-operator.md)

</details>

<details>
<summary><strong>Asynchrone & DOM</strong></summary>

- [Array Methods](docs/concepts/07-array-methods.md)
- [Async/Await](docs/concepts/08-async-await.md)
- [DOM Manipulation](docs/concepts/09-dom-manipulation.md)
- [Event Handling](docs/concepts/10-event-handling.md)

</details>

<details>
<summary><strong>Patterns & APIs</strong></summary>

- [Design Patterns](docs/concepts/11-design-patterns.md)
- [Browser APIs](docs/concepts/12-browser-apis.md)
- [Data Structures](docs/concepts/13-data-structures.md)
- [Performance](docs/concepts/14-performance.md)

</details>

<details>
<summary><strong>Avancé</strong></summary>

- [Error Handling](docs/concepts/15-error-handling.md)
- [Closures](docs/concepts/16-closures.md)
- [Accessibility](docs/concepts/17-accessibility.md)
- [Decorator Pattern](docs/concepts/18-decorator-pattern.md)
- [Custom Errors](docs/concepts/19-custom-errors.md)
- [State Management](docs/concepts/20-state-management.md)
- [Web Workers](docs/concepts/21-web-workers.md)

</details>

---

## Accessibilité

L'application respecte les standards **WCAG 2.1** :

- Navigation clavier complète (Tab, Enter, Escape, flèches)
- Attributs ARIA sur tous les éléments interactifs
- Focus visible et gestion du focus trap dans les modales
- Textes alternatifs descriptifs pour les images
- Contraste suffisant et responsive design

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `?` | Afficher l'aide |
| `Ctrl+K` | Ouvrir la recherche |
| `Escape` | Fermer modal/lightbox |
| `J` / `K` | Média suivant/précédent |
| `L` | Liker le média |
| `←` / `→` | Navigation lightbox |
| `F` | Mode plein écran |

---

## Technologies

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint">
  <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier">
</p>

---

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<p align="center">
  Fait avec ❤️ pour l'apprentissage du JavaScript moderne
</p>
