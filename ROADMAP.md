# ROADMAP - Fisheye Frontend

## Objectif

Pratiquer les concepts clés de JavaScript à travers des features concrètes.

## Documentation des concepts

Tous les concepts JavaScript sont documentés individuellement dans le dossier [docs/concepts/](docs/concepts/README.md).

---

## Phase 1 : Fondamentaux ✅

### 1.1 Système de filtres par tags ✅
**Concepts**: `Array.filter()`, `Array.map()`, `Array.includes()`, `Set`, event listeners, DOM manipulation

**Description**: Ajouter des tags aux photographes (Portrait, Événements, Mode, etc.) et permettre le filtrage.

**Fichiers**: `scripts/templates/TagFilter.js`

**Tâches**:
- [x] Ajouter les tags dans `photographers.json`
- [x] Créer les boutons de filtre dynamiquement
- [x] Filtrer les photographes au clic
- [x] Gérer les filtres multiples (intersection/union)
- [x] Ajouter un bouton "Réinitialiser"

---

### 1.2 Barre de recherche avec auto-complétion ✅
**Concepts**: `String.includes()`, `String.toLowerCase()`, debounce, closures, input events

**Description**: Rechercher des photographes par nom, ville ou tagline avec suggestions.

**Fichiers**: `scripts/templates/SearchBar.js`, `scripts/utils/debounce.js`

**Tâches**:
- [x] Créer l'input de recherche
- [x] Implémenter le debounce (éviter trop de requêtes)
- [x] Filtrer les résultats en temps réel
- [x] Afficher les suggestions dans une dropdown
- [x] Gérer la navigation clavier dans les suggestions (ArrowUp/Down, Enter)

```javascript
// Concept: Debounce avec closure
function debounce(fn, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

---

### 1.3 Tri des médias amélioré ✅
**Concepts**: `Array.sort()`, fonctions de comparaison, spread operator, immutabilité, Strategy pattern

**Description**: Trier les médias par popularité, date, titre (ascendant/descendant).

**Fichiers**: `scripts/templates/SortFilters.js`, `scripts/templates/MediaFilter.js`

**Tâches**:
- [x] Créer un composant dropdown personnalisé accessible
- [x] Implémenter le tri multi-critères
- [x] Conserver l'ordre original (copie avec spread)
- [x] Ajouter l'ordre ascendant/descendant
- [ ] Animer la réorganisation des cartes

---

## Phase 2 : Manipulation avancée des données ✅

### 2.1 Système de favoris avec LocalStorage ✅
**Concepts**: `localStorage`, `JSON.parse()`, `JSON.stringify()`, `Array.find()`, Singleton pattern, Observer pattern

**Description**: Permettre aux utilisateurs de sauvegarder leurs photographes/médias favoris.

**Fichiers**: `scripts/utils/FavoritesManager.js`, `scripts/templates/FavoriteButton.js`, `favorites.html`

**Tâches**:
- [x] Créer une classe `FavoritesManager`
- [x] Sauvegarder/charger depuis localStorage
- [x] Ajouter des boutons coeur sur les cartes
- [x] Créer une page "Mes favoris"
- [x] Synchroniser l'état entre les pages

```javascript
// Concept: Classe avec localStorage
class FavoritesManager {
  constructor(storageKey) {
    this._key = storageKey
    this._favorites = this._load()
  }

  _load() {
    const data = localStorage.getItem(this._key)
    return data ? JSON.parse(data) : []
  }

  _save() {
    localStorage.setItem(this._key, JSON.stringify(this._favorites))
  }

  toggle(id) {
    const index = this._favorites.indexOf(id)
    if (index === -1) {
      this._favorites.push(id)
    } else {
      this._favorites.splice(index, 1)
    }
    this._save()
  }
}
```

---

### 2.2 Statistiques avec Array.reduce() ✅
**Concepts**: `Array.reduce()`, `Object.entries()`, `Object.keys()`, agrégation de données

**Description**: Afficher des statistiques sur les photographes et leurs médias.

**Fichiers**: `scripts/utils/StatsCalculator.js`, `scripts/templates/StatsDashboard.js`, `stats.html`

**Tâches**:
- [x] Calculer le total de likes par photographe
- [x] Calculer la moyenne des prix
- [x] Grouper les médias par catégorie
- [x] Trouver le photographe le plus populaire
- [x] Afficher un dashboard de stats

```javascript
// Concept: reduce pour grouper
const mediaByCategory = media.reduce((acc, item) => {
  const category = item.category || 'other'
  acc[category] = acc[category] || []
  acc[category].push(item)
  return acc
}, {})
```

---

### 2.3 Historique de navigation avec History API ✅
**Concepts**: `history.pushState()`, `popstate` event, `URLSearchParams`, état de l'application, Singleton

**Description**: Permettre la navigation arrière/avant et les URLs partageables.

**Fichiers**: `scripts/utils/UrlStateManager.js`

**Tâches**:
- [x] Sauvegarder les filtres dans l'URL
- [x] Restaurer l'état depuis l'URL au chargement
- [x] Gérer le bouton retour du navigateur
- [x] Créer des URLs partageables pour les filtres

```javascript
// Concept: History API
function updateURL(filters) {
  const params = new URLSearchParams(filters)
  history.pushState({ filters }, '', `?${params}`)
}

window.addEventListener('popstate', (e) => {
  if (e.state?.filters) {
    applyFilters(e.state.filters)
  }
})
```

---

## Phase 3 : Programmation asynchrone ✅

### 3.1 Chargement paresseux des images (Lazy Loading) ✅
**Concepts**: `IntersectionObserver`, callbacks, async loading, Singleton, performance

**Description**: Charger les images uniquement quand elles sont visibles.

**Fichiers**: `scripts/utils/LazyLoader.js`

**Tâches**:
- [x] Utiliser `data-src` au lieu de `src`
- [x] Créer un IntersectionObserver
- [x] Charger l'image quand elle entre dans le viewport
- [x] Ajouter un placeholder/skeleton pendant le chargement
- [x] Gérer les erreurs de chargement

```javascript
// Concept: IntersectionObserver
class LazyLoader {
  constructor() {
    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      { rootMargin: '100px' }
    )
  }

  observe(element) {
    this._observer.observe(element)
  }

  _onIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this._loadImage(entry.target)
        this._observer.unobserve(entry.target)
      }
    })
  }
}
```

---

### 3.2 Infinite Scroll / Pagination ✅
**Concepts**: `IntersectionObserver`, `Promise`, état de chargement, throttle

**Description**: Charger plus de médias au scroll au lieu de tout afficher.

**Fichiers**: `scripts/utils/InfiniteScroll.js`

**Tâches**:
- [x] Limiter l'affichage initial (ex: 9 médias)
- [x] Détecter le scroll vers le bas
- [x] Charger le batch suivant
- [x] Afficher un loader pendant le chargement
- [x] Gérer la fin des données

---

### 3.3 Cache des données avec Promise ✅
**Concepts**: `Promise`, `Map`, memoization, Singleton pattern

**Description**: Mettre en cache les appels API pour éviter les requêtes redondantes.

**Fichiers**: `scripts/utils/CacheManager.js`

**Tâches**:
- [x] Créer une classe `CacheManager`
- [x] Stocker les promesses (pas les résultats)
- [x] Définir une durée d'expiration
- [x] Invalider le cache manuellement

```javascript
// Concept: Cache de Promises
class CacheManager {
  constructor(ttl = 60000) {
    this._cache = new Map()
    this._ttl = ttl
  }

  async get(key, fetchFn) {
    const cached = this._cache.get(key)
    if (cached && Date.now() - cached.timestamp < this._ttl) {
      return cached.promise
    }

    const promise = fetchFn()
    this._cache.set(key, { promise, timestamp: Date.now() })
    return promise
  }
}
```

---

### 3.4 Chargement parallèle avec Promise.all ✅
**Concepts**: `Promise.all()`, `Promise.allSettled()`, gestion d'erreurs multiples

**Description**: Charger les données de plusieurs photographes en parallèle.

**Fichiers**: `scripts/utils/ParallelLoader.js`

**Tâches**:
- [x] Charger tous les médias en parallèle
- [ ] Afficher une barre de progression globale
- [x] Gérer les erreurs individuelles sans bloquer
- [x] Utiliser `Promise.allSettled()` pour la résilience

```javascript
// Concept: Promise.allSettled pour la résilience
async function loadAllMedia(photographerIds) {
  const promises = photographerIds.map(id =>
    fetchMedia(id).catch(err => ({ error: err, id }))
  )

  const results = await Promise.allSettled(promises)

  return results.map((result, i) => ({
    id: photographerIds[i],
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null
  }))
}
```

---

## Phase 4 : Événements et interactions ✅

### 4.1 Système de likes optimiste ✅
**Concepts**: Event delegation, `data-*` attributes, optimistic UI, état local, localStorage

**Description**: Liker les médias avec feedback immédiat.

**Fichiers**: `scripts/utils/LikeManager.js`, `scripts/templates/PhotographerMediaCard.js`

**Tâches**:
- [x] Utiliser la délégation d'événements (un seul listener)
- [x] Mettre à jour l'UI immédiatement (optimistic)
- [x] Persister dans localStorage
- [x] Animer le coeur au clic
- [x] Mettre à jour le compteur total

```javascript
// Concept: Event delegation
class LikeManager {
  constructor(container) {
    this._container = container
    this._container.addEventListener('click', (e) => this._handleClick(e))
  }

  _handleClick(e) {
    const likeBtn = e.target.closest('[data-like-id]')
    if (!likeBtn) return

    const mediaId = likeBtn.dataset.likeId
    this._toggleLike(mediaId, likeBtn)
  }
}
```

---

### 4.2 Drag & Drop pour réorganiser ✅
**Concepts**: Drag events (`dragstart`, `dragover`, `drop`), `dataTransfer`, DOM reorder

**Description**: Réorganiser les médias par glisser-déposer.

**Fichiers**: `scripts/utils/DragDropManager.js`

**Tâches**:
- [x] Rendre les cartes draggable
- [x] Gérer les événements drag
- [x] Afficher un indicateur de drop zone
- [x] Réorganiser le DOM
- [ ] Sauvegarder l'ordre personnalisé

```javascript
// Concept: Drag & Drop
element.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', mediaId)
  e.dataTransfer.effectAllowed = 'move'
})

container.addEventListener('drop', (e) => {
  e.preventDefault()
  const mediaId = e.dataTransfer.getData('text/plain')
  const dropTarget = e.target.closest('.media-card')
  // Réorganiser...
})
```

---

### 4.3 Custom Events pour communication ✅
**Concepts**: `CustomEvent`, `dispatchEvent`, Observer pattern, Singleton, découplage

**Description**: Créer un système d'événements personnalisés pour la communication entre composants.

**Fichiers**: `scripts/utils/EventBus.js`

**Tâches**:
- [x] Créer un EventBus singleton
- [x] Émettre des événements lors des actions (like, filter, sort)
- [x] Écouter les événements dans les composants concernés
- [x] Mettre à jour le compteur de likes global via events

```javascript
// Concept: EventBus (Observer Pattern)
class EventBus {
  static _instance = null

  static getInstance() {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus()
    }
    return EventBus._instance
  }

  constructor() {
    this._target = new EventTarget()
  }

  emit(eventName, data) {
    this._target.dispatchEvent(
      new CustomEvent(eventName, { detail: data })
    )
  }

  on(eventName, callback) {
    this._target.addEventListener(eventName, (e) => callback(e.detail))
  }
}
```

---

### 4.4 Raccourcis clavier globaux ✅
**Concepts**: `keydown` events, `KeyboardEvent`, Map, combinaisons (Ctrl+K), accessibilité

**Description**: Ajouter des raccourcis clavier pour la navigation rapide.

**Fichiers**: `scripts/utils/KeyboardShortcutManager.js`

**Tâches**:
- [x] Ctrl+K : Ouvrir la recherche
- [x] Escape : Fermer modals/lightbox
- [x] J/K : Naviguer entre les médias
- [x] L : Liker le média actif
- [x] Afficher une aide des raccourcis (?)

---

## Phase 5 : Formulaires et validation ✅

### 5.1 Validation de formulaire avancée ✅
**Concepts**: Regex, `FormData`, validation custom, feedback utilisateur

**Description**: Valider le formulaire de contact avec règles personnalisées.

**Fichiers**: `scripts/utils/Validator.js`, `scripts/utils/contactForm.js`

**Tâches**:
- [x] Valider l'email avec regex
- [x] Valider la longueur du message
- [x] Afficher les erreurs en temps réel
- [x] Désactiver le submit si invalide
- [x] Créer une classe `Validator`

```javascript
// Concept: Validation avec Regex
class Validator {
  static email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      valid: regex.test(value),
      message: 'Email invalide'
    }
  }

  static minLength(value, min) {
    return {
      valid: value.length >= min,
      message: `Minimum ${min} caractères`
    }
  }

  static required(value) {
    return {
      valid: value.trim().length > 0,
      message: 'Champ requis'
    }
  }
}
```

---

### 5.2 Auto-save du formulaire ✅
**Concepts**: `sessionStorage`, `input` event, debounce, restoration d'état

**Description**: Sauvegarder automatiquement le brouillon du formulaire.

**Fichiers**: `scripts/utils/FormAutoSave.js`, `scripts/utils/contactForm.js`

**Tâches**:
- [x] Sauvegarder chaque champ au blur ou après debounce
- [x] Restaurer les valeurs au chargement
- [x] Afficher "Brouillon sauvegardé"
- [x] Effacer après envoi réussi

---

## Phase 6 : Performance et optimisation (En cours)

### 6.1 Virtual Scrolling
**Concepts**: DOM recycling, calculs de position, `requestAnimationFrame`, performance

**Description**: Afficher uniquement les éléments visibles pour de grandes listes.

**Tâches**:
- [ ] Calculer les éléments visibles selon le scroll
- [ ] Recycler les éléments DOM
- [ ] Maintenir la hauteur du conteneur
- [ ] Gérer le scroll fluide

---

### 6.2 Web Workers pour le tri/filtrage ✅
**Concepts**: `Worker`, `postMessage`, transfert de données, thread séparé

**Description**: Déplacer les calculs lourds dans un Web Worker.

**Fichiers**: `scripts/workers/sortWorker.js`, `scripts/utils/WorkerManager.js`

**Tâches**:
- [x] Créer un worker pour le tri
- [x] Envoyer les données au worker
- [x] Recevoir les résultats triés
- [x] Ajouter filtrage et recherche
- [x] Ajouter agrégation de données
- [x] Créer WorkerManager avec Promises

```javascript
// Concept: Web Worker
// main.js
const worker = new Worker('scripts/workers/sortWorker.js')

worker.postMessage({ data: mediaArray, sortBy: 'likes' })

worker.onmessage = (e) => {
  const sortedData = e.data
  renderMedia(sortedData)
}

// sortWorker.js
self.onmessage = (e) => {
  const { data, sortBy } = e.data
  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy])
  self.postMessage(sorted)
}
```

---

### 6.3 Throttle pour le scroll ✅
**Concepts**: Throttle vs debounce, `requestAnimationFrame`, performance scroll

**Description**: Optimiser les handlers de scroll.

**Fichiers**: `scripts/utils/throttle.js`

**Tâches**:
- [x] Implémenter une fonction throttle
- [x] Appliquer au scroll listener
- [x] Comparer avec requestAnimationFrame (rafThrottle implémenté)

```javascript
// Concept: Throttle
function throttle(fn, limit) {
  let inThrottle = false
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
```

---

## Phase 7 : Patterns avancés ✅

### 7.1 State Management (Mini Redux) ✅
**Concepts**: Singleton, immutabilité, reducers, subscribers, flux unidirectionnel

**Description**: Créer un store centralisé pour l'état de l'application.

**Fichiers**: `scripts/utils/Store.js`

**Tâches**:
- [x] Créer une classe `Store`
- [x] Implémenter `getState()`, `dispatch()`, `subscribe()`
- [x] Ajouter `subscribeToSelector()` pour optimiser les re-renders
- [x] Ajouter système de middlewares
- [x] Créer helpers: `combineReducers`, `createReducer`, `createAction`
- [x] Ajouter `loggerMiddleware` et `thunkMiddleware`

```javascript
// Concept: Mini Store
class Store {
  constructor(reducer, initialState) {
    this._state = initialState
    this._reducer = reducer
    this._subscribers = []
  }

  getState() {
    return this._state
  }

  dispatch(action) {
    this._state = this._reducer(this._state, action)
    this._subscribers.forEach(fn => fn(this._state))
  }

  subscribe(fn) {
    this._subscribers.push(fn)
    return () => {
      this._subscribers = this._subscribers.filter(sub => sub !== fn)
    }
  }
}
```

---

### 7.2 Composants réutilisables (En cours)
**Concepts**: Composition, slots, props, lifecycle, encapsulation

**Description**: Créer des composants UI génériques réutilisables.

**Fichiers**: `scripts/utils/Toast.js`

**Tâches**:
- [ ] Créer `Modal` générique
- [ ] Créer `Dropdown` accessible
- [x] Créer `Toast` notifications
- [ ] Créer `Skeleton` loader
- [ ] Documenter l'API de chaque composant

```javascript
// Concept: Composant réutilisable
class Modal {
  constructor({ title, content, onClose, onConfirm }) {
    this._title = title
    this._content = content
    this._onClose = onClose
    this._onConfirm = onConfirm
  }

  render() {
    // Créer le DOM du modal
  }

  open() {
    // Afficher et focus trap
  }

  close() {
    // Fermer et cleanup
    this._onClose?.()
  }
}
```

---

### 7.3 Decorator Pattern pour le logging ✅
**Concepts**: Higher-order functions, decorators, AOP, debugging

**Description**: Ajouter du logging automatique aux méthodes.

**Fichiers**: `scripts/utils/withLogging.js`

**Tâches**:
- [x] Créer un decorator `withLogging`
- [x] Logger les appels de méthodes
- [x] Logger les erreurs automatiquement
- [x] Mesurer le temps d'exécution
- [x] Créer `withTiming`, `withErrorHandling`, `withMemoization`, `withRateLimit`, `withValidation`
- [x] Créer `compose` pour chaîner les decorators

```javascript
// Concept: Decorator function
function withLogging(fn, name) {
  return function(...args) {
    console.log(`[${name}] Called with:`, args)
    const start = performance.now()
    try {
      const result = fn.apply(this, args)
      console.log(`[${name}] Returned:`, result)
      return result
    } finally {
      console.log(`[${name}] Duration: ${performance.now() - start}ms`)
    }
  }
}
```

---

## Phase 8 : APIs Web modernes

### 8.1 Share API ✅
**Concepts**: `navigator.share()`, feature detection, Clipboard API, fallback

**Description**: Partager un photographe ou média sur les réseaux sociaux.

**Fichiers**: `scripts/templates/ShareButton.js`

**Tâches**:
- [x] Détecter le support de l'API
- [x] Créer un bouton de partage
- [x] Partager avec titre, texte et URL
- [x] Fallback: copier le lien dans le presse-papier

```javascript
// Concept: Share API avec fallback
async function share(data) {
  if (navigator.share) {
    await navigator.share(data)
  } else {
    await navigator.clipboard.writeText(data.url)
    showToast('Lien copié !')
  }
}
```

---

### 8.2 Clipboard API ✅
**Concepts**: `navigator.clipboard`, Permissions API, async clipboard, fallback

**Description**: Copier les informations d'un photographe.

**Fichiers**: `scripts/templates/ShareButton.js`, `scripts/utils/UrlStateManager.js`

**Tâches**:
- [ ] Bouton "Copier l'email"
- [x] Bouton "Copier le lien"
- [x] Feedback visuel après copie

---

### 8.3 Fullscreen API ✅
**Concepts**: `requestFullscreen()`, `fullscreenchange` event, préfixes navigateurs

**Description**: Voir la lightbox en plein écran.

**Fichiers**: `scripts/utils/lightbox.js`, `css/photographer.css`

**Tâches**:
- [x] Ajouter un bouton fullscreen à la lightbox
- [x] Gérer les préfixes navigateurs
- [x] Écouter les changements de fullscreen
- [x] Adapter l'UI en mode fullscreen

---

### 8.4 Page Visibility API ✅
**Concepts**: `visibilitychange`, `document.hidden`, optimisation ressources

**Description**: Pauser les vidéos quand l'onglet n'est pas visible.

**Fichiers**: `scripts/utils/PageVisibilityManager.js`

**Tâches**:
- [x] Détecter le changement de visibilité
- [x] Pauser les vidéos en lecture
- [x] Reprendre quand l'onglet redevient visible

```javascript
// Concept: Page Visibility
document.addEventListener('visibilitychange', () => {
  const videos = document.querySelectorAll('video')
  videos.forEach(video => {
    if (document.hidden) {
      video.pause()
    }
  })
})
```

---

## Phase 9 : Gestion d'erreurs ✅

### 9.1 Error Boundary Pattern ✅
**Concepts**: `try/catch`, error recovery, graceful degradation, UX d'erreur

**Description**: Gérer les erreurs de manière élégante.

**Fichiers**: `scripts/utils/ErrorBoundary.js`

**Tâches**:
- [x] Créer une classe `ErrorBoundary`
- [x] Afficher un message d'erreur user-friendly
- [x] Logger les erreurs pour debug
- [x] Permettre de réessayer
- [x] Ajouter `withRetry` avec backoff exponentiel
- [x] Configurer gestionnaire global d'erreurs

```javascript
// Concept: Error handling wrapper
class ErrorBoundary {
  static async wrap(fn, fallback) {
    try {
      return await fn()
    } catch (error) {
      console.error('Error caught:', error)
      ErrorBoundary._logError(error)
      return fallback
    }
  }

  static _logError(error) {
    // Envoyer à un service de monitoring
  }
}
```

---

### 9.2 Custom Error Classes ✅
**Concepts**: `extends Error`, error types, stack traces, instanceof

**Description**: Créer des erreurs typées pour mieux les gérer.

**Fichiers**: `scripts/utils/CustomErrors.js`

**Tâches**:
- [x] Créer `NetworkError`
- [x] Créer `ValidationError`
- [x] Créer `NotFoundError`
- [x] Gérer différemment selon le type
- [x] Créer `AppError`, `ConfigError`, `TimeoutError`, `UnsupportedError`, `PermissionError`
- [x] Créer `ErrorHandler` pour gestion centralisée

```javascript
// Concept: Custom Errors
class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'NetworkError'
    this.statusCode = statusCode
  }
}

class ValidationError extends Error {
  constructor(field, message) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}
```

---

## Phase 10 : Modules et architecture

### 10.1 Migration vers ES Modules
**Concepts**: `import`, `export`, `export default`, modules dynamiques

**Description**: Convertir les scripts en modules ES6.

**Tâches**:
- [ ] Ajouter `type="module"` au script principal
- [ ] Convertir chaque fichier en module
- [ ] Gérer les dépendances avec import/export
- [ ] Utiliser les imports dynamiques pour le lazy loading

```javascript
// Concept: ES Modules
// Api.js
export class Api { ... }
export class PhotographerApi extends Api { ... }

// App.js
import { PhotographerApi } from './api/Api.js'

// Dynamic import pour lazy loading
const { Lightbox } = await import('./utils/lightbox.js')
```

---

### 10.2 Architecture MVC explicite
**Concepts**: Séparation des responsabilités, MVC, couplage faible

**Description**: Restructurer le code en Model-View-Controller.

**Tâches**:
- [ ] Séparer clairement les Models (données)
- [ ] Séparer les Views (affichage)
- [ ] Créer des Controllers (logique)
- [ ] Documenter les responsabilités

---

## Récapitulatif des concepts

| Concept | Features associées |
|---------|-------------------|
| Array methods | 1.1, 1.3, 2.1, 2.2 |
| Async/Await | 3.1, 3.2, 3.3, 3.4 |
| Classes ES6 | Toutes |
| Closures | 1.2, 3.3 |
| Custom Events | 4.3 |
| Debounce/Throttle | 1.2, 6.3 |
| DOM manipulation | 1.1, 4.1 |
| Drag & Drop | 4.2 |
| Error handling | 9.1, 9.2 |
| ES Modules | 10.1 |
| Event delegation | 4.1 |
| Fetch API | Déjà implémenté |
| History API | 2.3 |
| IntersectionObserver | 3.1, 3.2 |
| LocalStorage | 2.1, 5.2 |
| Promises | 3.3, 3.4 |
| Regex | 5.1 |
| Singleton | 3.3, 4.3 |
| Web APIs | 8.1, 8.2, 8.3, 8.4 |
| Web Workers | 6.2 |

---

## Ordre suggéré

1. **Débutant**: 1.1 → 1.2 → 1.3 → 2.1
2. **Intermédiaire**: 2.2 → 3.1 → 4.1 → 5.1
3. **Avancé**: 3.3 → 4.3 → 7.1 → 10.1
4. **Expert**: 6.1 → 6.2 → 7.3 → 9.1
