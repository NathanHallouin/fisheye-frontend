<p align="center">
  <img src="assets/images/logo.png" alt="Fisheye Logo" width="200">
</p>

<h1 align="center">Fisheye</h1>

<p align="center">
  <strong>Professional Photographer Portfolio Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/No_Framework-100%25_Vanilla-green?style=flat-square" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/Accessible-WCAG_2.1-blue?style=flat-square" alt="Accessibility">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-documentation">Documentation</a>
</p>

---

## About

Fisheye is a web application that showcases professional photographers' work through elegant and interactive portfolios. Built entirely with **vanilla JavaScript** (no frameworks), it demonstrates modern web development best practices while delivering a smooth and accessible user experience.

### Why this project?

This project was developed as a learning exercise to explore and master core concepts of modern JavaScript, including:

- **Modular architecture** without external dependencies
- **Design Patterns** (Factory, Singleton, Observer, Strategy)
- **Modern Web APIs** (Fetch, IntersectionObserver, Web Workers)
- **Accessibility** (WCAG 2.1, keyboard navigation, ARIA)
- **Performance** (lazy loading, caching, debounce/throttle)

---

## Features

<table>
  <tr>
    <td width="50%">
      <h3>Navigation & Search</h3>
      <ul>
        <li>Instant search with debounce</li>
        <li>Category filtering (tags)</li>
        <li>Multi-criteria sorting (popularity, date, title)</li>
        <li>Shareable URLs with filter state</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Gallery & Media</h3>
      <ul>
        <li>Immersive lightbox with fullscreen mode</li>
        <li>Photo and video support</li>
        <li>Smart lazy loading</li>
        <li>Smooth infinite scroll</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Interactions</h3>
      <ul>
        <li>Optimistic like system</li>
        <li>Favorites management</li>
        <li>Drag & Drop to reorganize</li>
        <li>Complete keyboard shortcuts</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Performance</h3>
      <ul>
        <li>Smart data caching</li>
        <li>Web Workers for sorting</li>
        <li>Scroll/input optimization</li>
        <li>Auto video pause (Page Visibility)</li>
      </ul>
    </td>
  </tr>
</table>

---

## Demo

### Homepage
Discover all photographers with specialty filters.

### Photographer Page
Explore an artist's gallery, like their photos, and contact them.

### Lightbox
View media in fullscreen with keyboard navigation.

---

## Installation

```bash
# Clone the repository
git clone https://github.com/NathanHallouin/fisheye-frontend.git

# Navigate to folder
cd fisheye-frontend

# Install dev dependencies
npm install

# Start a local server (e.g., Live Server or Python)
# Option 1: VSCode Live Server extension
# Option 2: Python
python -m http.server 5500

# Open http://localhost:5500 in your browser
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | Check code with ESLint |
| `npm run format` | Format with Prettier |

---

## Architecture

```
fisheye-frontend/
│
├── assets/                 # Static resources
│   ├── images/            # UI images and logo
│   ├── media/             # Photographers' photos and videos
│   └── photographers/     # Photographer portraits
│
├── css/                    # Stylesheets
│   ├── style.css          # Global styles
│   ├── photographer.css   # Photographer page
│   └── stats.css          # Stats page
│
├── data/
│   └── photographers.json # JSON database
│
├── docs/
│   └── concepts/          # Technical documentation (21 JS concepts)
│
├── scripts/
│   ├── api/               # Data access layer
│   ├── db/                # Local data management
│   ├── factories/         # Factory Pattern
│   ├── models/            # Business classes
│   ├── pages/             # Page controllers
│   ├── templates/         # UI components
│   ├── utils/             # Utilities
│   └── workers/           # Web Workers
│
├── index.html             # Homepage
├── photographer.html      # Photographer page
├── favorites.html         # Favorites page
└── stats.html             # Dashboard
```

### Design Patterns Used

| Pattern | Usage |
|---------|-------|
| **Factory** | Media creation (photo/video) and cards |
| **Singleton** | Managers (Cache, Toast, EventBus) |
| **Observer** | Component communication |
| **Strategy** | Interchangeable sorting algorithms |
| **Decorator** | Logging and memoization |

---

## Documentation

Complete documentation of **21 JavaScript concepts** used is available:

<details>
<summary><strong>ES6+ Fundamentals</strong></summary>

- [ES6 Classes](docs/concepts/01-classes-es6.md)
- [Getters & Setters](docs/concepts/02-getters-setters.md)
- [Template Literals](docs/concepts/03-template-literals.md)
- [Arrow Functions](docs/concepts/04-arrow-functions.md)
- [Destructuring](docs/concepts/05-destructuring.md)
- [Spread Operator](docs/concepts/06-spread-operator.md)

</details>

<details>
<summary><strong>Async & DOM</strong></summary>

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
<summary><strong>Advanced</strong></summary>

- [Error Handling](docs/concepts/15-error-handling.md)
- [Closures](docs/concepts/16-closures.md)
- [Accessibility](docs/concepts/17-accessibility.md)
- [Decorator Pattern](docs/concepts/18-decorator-pattern.md)
- [Custom Errors](docs/concepts/19-custom-errors.md)
- [State Management](docs/concepts/20-state-management.md)
- [Web Workers](docs/concepts/21-web-workers.md)

</details>

---

## Accessibility

The application follows **WCAG 2.1** standards:

- Full keyboard navigation (Tab, Enter, Escape, arrows)
- ARIA attributes on all interactive elements
- Visible focus and focus trap management in modals
- Descriptive alt text for images
- Sufficient contrast and responsive design

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show help |
| `Ctrl+K` | Open search |
| `Escape` | Close modal/lightbox |
| `J` / `K` | Next/previous media |
| `L` | Like media |
| `←` / `→` | Lightbox navigation |
| `F` | Fullscreen mode |

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for learning modern JavaScript
</p>
