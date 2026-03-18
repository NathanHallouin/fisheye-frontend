# Design Patterns (Patrons de conception)

## Concept

Les design patterns sont des solutions réutilisables à des problèmes courants en développement logiciel. Ils fournissent des templates pour structurer le code de manière maintenable.

---

## Factory Pattern

### Concept

Le Factory Pattern délègue la création d'objets à une classe factory, permettant de créer différents types d'objets selon des paramètres.

### Implémentation dans Fisheye

**Fichier**: [scripts/factories/MediaFactory.js](../../scripts/factories/MediaFactory.js)

```javascript
class MediaFactory {
  /**
   * Crée une carte média selon le type.
   * @param {Object} data - Données du média
   * @param {number} photographerId - ID du photographe
   * @returns {CreateImageCard|CreateVideoCard} Instance de carte
   */
  constructor(data, photographerId) {
    if (data.image) {
      return new CreateImageCard(data, photographerId)
    } else if (data.video) {
      return new CreateVideoCard(data, photographerId)
    }
    throw new Error('Type de média inconnu')
  }
}
```

**Fichier**: [scripts/factories/PhotographersFactory.js](../../scripts/factories/PhotographersFactory.js)

```javascript
class PhotographersFactory {
  constructor(data, type) {
    if (type === 'photographers') {
      return data.photographers.map((data) => new PhotographerProfil(data))
    } else if (type === 'media') {
      return data.media.map((data) => new PhotographerMedia(data))
    }
    throw new Error('Type inconnu')
  }
}
```

### Avantages

- **Découplage** - Le code client ne connaît pas les classes concrètes
- **Extensibilité** - Ajouter un nouveau type est simple
- **Centralisation** - La logique de création est en un seul endroit

### Usage

```javascript
// Sans savoir quel type sera créé
const mediaCard = new MediaFactory(mediaData, photographerId)
const element = mediaCard.createCard()
```

---

## Singleton Pattern

### Concept

Le Singleton garantit qu'une classe n'a qu'une seule instance et fournit un point d'accès global à celle-ci.

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  static _instance = null

  /**
   * Retourne l'instance unique du manager.
   * @returns {FavoritesManager}
   */
  static getInstance() {
    if (!FavoritesManager._instance) {
      FavoritesManager._instance = new FavoritesManager()
    }
    return FavoritesManager._instance
  }

  constructor() {
    // Empêcher l'instanciation directe
    if (FavoritesManager._instance) {
      return FavoritesManager._instance
    }

    this._storageKey = 'fisheye_favorites'
    this._favorites = this._load()
  }
}

// Usage
const manager1 = FavoritesManager.getInstance()
const manager2 = FavoritesManager.getInstance()
console.log(manager1 === manager2)  // true
```

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
class CacheManager {
  static _instance = null

  static getInstance(ttl = 300000) {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager(ttl)
    }
    return CacheManager._instance
  }

  constructor(ttl = 300000) {
    this._cache = new Map()
    this._ttl = ttl
  }
}
```

### Autres singletons dans le projet

- `EventBus.getInstance()`
- `LazyLoader.getInstance()`
- `UrlStateManager.getInstance()`
- `KeyboardShortcutManager.getInstance()`

### Avantages

- **Instance unique** - État partagé cohérent
- **Accès global** - Disponible partout
- **Lazy loading** - Créé seulement quand nécessaire

---

## Observer Pattern (Pub/Sub)

### Concept

Le pattern Observer permet à des objets (observers) de s'abonner à un sujet (subject) pour être notifiés des changements.

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
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
    this._listeners = new Map()
  }

  /**
   * S'abonner à un événement.
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction à appeler
   * @param {Object} options - Options (once, priority)
   */
  on(eventName, callback, options = {}) {
    const { once = false, priority = 0 } = options
    const wrappedCallback = (e) => callback(e.detail)

    this._listeners.set(callback, { wrapped: wrappedCallback, priority })
    this._target.addEventListener(eventName, wrappedCallback, { once })
  }

  /**
   * Se désabonner d'un événement.
   */
  off(eventName, callback) {
    const listener = this._listeners.get(callback)
    if (listener) {
      this._target.removeEventListener(eventName, listener.wrapped)
      this._listeners.delete(callback)
    }
  }

  /**
   * Émettre un événement.
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données à transmettre
   */
  emit(eventName, data) {
    this._target.dispatchEvent(
      new CustomEvent(eventName, { detail: data })
    )
  }
}
```

### Usage

```javascript
const eventBus = EventBus.getInstance()

// S'abonner
eventBus.on('like:toggle', (data) => {
  console.log(`Media ${data.mediaId} liked: ${data.isLiked}`)
})

// Émettre
eventBus.emit('like:toggle', { mediaId: 123, isLiked: true })

// Se désabonner
eventBus.off('like:toggle', callback)
```

### Avantages

- **Découplage** - Les composants ne se connaissent pas
- **Flexibilité** - Ajouter/retirer des observers facilement
- **Communication** - Entre composants sans dépendances

---

## Strategy Pattern

### Concept

Le Strategy Pattern permet de définir une famille d'algorithmes interchangeables.

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
class SortFilters {
  static SORT_OPTIONS = {
    popularity: { label: 'Popularité', property: '_likes', type: 'numeric', desc: true },
    date: { label: 'Date', property: '_date', type: 'date', desc: true },
    title: { label: 'Titre', property: '_title', type: 'alphabetic', desc: false }
  }

  // Stratégies de comparaison
  static SortComparators = {
    numeric: (property, desc) => (a, b) => {
      const valA = a[property]
      const valB = b[property]
      return desc ? valB - valA : valA - valB
    },

    alphabetic: (property, desc) => (a, b) => {
      const comparison = a[property].localeCompare(b[property], 'fr', {
        sensitivity: 'base'
      })
      return desc ? -comparison : comparison
    },

    date: (property, desc) => (a, b) => {
      const dateA = new Date(a[property])
      const dateB = new Date(b[property])
      return desc ? dateB - dateA : dateA - dateB
    }
  }

  _getComparator() {
    const option = SortFilters.SORT_OPTIONS[this._currentSort]
    const comparatorFactory = SortFilters.SortComparators[option.type]
    return comparatorFactory(option.property, option.desc)
  }

  sort(data) {
    const sortedData = [...data]
    const comparator = this._getComparator()
    sortedData.sort(comparator)
    return sortedData
  }
}
```

### Avantages

- **Interchangeable** - Changer d'algorithme sans modifier le code client
- **Testable** - Chaque stratégie peut être testée indépendamment
- **Extensible** - Ajouter une nouvelle stratégie est simple

---

## Module Pattern

### Concept

Le Module Pattern encapsule du code avec un scope privé, exposant seulement une API publique.

### Implémentation dans Fisheye

Avec les classes ES6, ce pattern est naturellement implémenté :

```javascript
class LikeManager {
  // Privé (convention _)
  _likedMedia = new Set()

  // Privé
  _saveLikes() {
    localStorage.setItem('likes', JSON.stringify([...this._likedMedia]))
  }

  // Public
  toggle(mediaId) {
    if (this._likedMedia.has(mediaId)) {
      this._likedMedia.delete(mediaId)
    } else {
      this._likedMedia.add(mediaId)
    }
    this._saveLikes()
  }

  // Public
  isLiked(mediaId) {
    return this._likedMedia.has(mediaId)
  }
}
```

---

## Decorator Pattern

### Concept

Le Decorator Pattern ajoute des fonctionnalités à un objet dynamiquement.

### Implémentation - Memoization

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
class CacheManager {
  /**
   * Décore une fonction avec du caching.
   * @param {Function} fn - Fonction à memoizer
   * @param {Function} keyGenerator - Générateur de clé
   * @param {number} ttl - Durée de vie
   * @returns {Function} Fonction décorée
   */
  memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
    return async (...args) => {
      const key = keyGenerator(...args)
      return this.get(key, () => fn(...args), ttl)
    }
  }
}

// Usage
const cache = CacheManager.getInstance()
const cachedFetch = cache.memoize(
  (url) => fetch(url).then(r => r.json()),
  (url) => url
)
```

### Implémentation - Debounce

**Fichier**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
/**
 * Décore une fonction avec un délai de debounce.
 * @param {Function} fn - Fonction à décorer
 * @param {number} delay - Délai en ms
 * @returns {Function} Fonction décorée
 */
export function debounce(fn, delay) {
  let timeoutId

  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Usage
const debouncedSearch = debounce((query) => {
  search(query)
}, 300)
```

---

## Récapitulatif

| Pattern | Usage dans Fisheye | Fichier principal |
|---------|-------------------|-------------------|
| **Factory** | Création de cartes média | MediaFactory.js |
| **Singleton** | Managers globaux | FavoritesManager.js |
| **Observer** | Communication entre composants | EventBus.js |
| **Strategy** | Algorithmes de tri | SortFilters.js |
| **Module** | Encapsulation de classes | Toutes les classes |
| **Decorator** | Memoization, debounce | CacheManager.js |

---

## Exercice pratique

Implémenter un NotificationManager avec les patterns Singleton et Observer :

```javascript
class NotificationManager {
  static _instance = null

  static getInstance() {
    if (!NotificationManager._instance) {
      NotificationManager._instance = new NotificationManager()
    }
    return NotificationManager._instance
  }

  constructor() {
    this._subscribers = new Map()
  }

  subscribe(type, callback) {
    if (!this._subscribers.has(type)) {
      this._subscribers.set(type, [])
    }
    this._subscribers.get(type).push(callback)
  }

  unsubscribe(type, callback) {
    const subs = this._subscribers.get(type)
    if (subs) {
      const index = subs.indexOf(callback)
      if (index > -1) subs.splice(index, 1)
    }
  }

  notify(type, message) {
    const subs = this._subscribers.get(type) || []
    subs.forEach(callback => callback(message))
  }
}

// Usage
const notifications = NotificationManager.getInstance()

notifications.subscribe('success', (msg) => {
  console.log('Succès:', msg)
})

notifications.notify('success', 'Photographe ajouté aux favoris!')
```
