# Design Patterns

## Concept

Design patterns are reusable solutions to common problems in software development. They provide templates for structuring code in a maintainable way.

---

## Factory Pattern

### Concept

The Factory Pattern delegates object creation to a factory class, allowing different types of objects to be created based on parameters.

### Implementation in Fisheye

**File**: [scripts/factories/MediaFactory.js](../../scripts/factories/MediaFactory.js)

```javascript
class MediaFactory {
  /**
   * Creates a media card based on type.
   * @param {Object} data - Media data
   * @param {number} photographerId - Photographer ID
   * @returns {CreateImageCard|CreateVideoCard} Card instance
   */
  constructor(data, photographerId) {
    if (data.image) {
      return new CreateImageCard(data, photographerId)
    } else if (data.video) {
      return new CreateVideoCard(data, photographerId)
    }
    throw new Error('Unknown media type')
  }
}
```

**File**: [scripts/factories/PhotographersFactory.js](../../scripts/factories/PhotographersFactory.js)

```javascript
class PhotographersFactory {
  constructor(data, type) {
    if (type === 'photographers') {
      return data.photographers.map((data) => new PhotographerProfil(data))
    } else if (type === 'media') {
      return data.media.map((data) => new PhotographerMedia(data))
    }
    throw new Error('Unknown type')
  }
}
```

### Advantages

- **Decoupling** - Client code doesn't know the concrete classes
- **Extensibility** - Adding a new type is simple
- **Centralization** - Creation logic is in one place

### Usage

```javascript
// Without knowing which type will be created
const mediaCard = new MediaFactory(mediaData, photographerId)
const element = mediaCard.createCard()
```

---

## Singleton Pattern

### Concept

The Singleton guarantees that a class has only one instance and provides a global access point to it.

### Implementation in Fisheye

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  static _instance = null

  /**
   * Returns the unique manager instance.
   * @returns {FavoritesManager}
   */
  static getInstance() {
    if (!FavoritesManager._instance) {
      FavoritesManager._instance = new FavoritesManager()
    }
    return FavoritesManager._instance
  }

  constructor() {
    // Prevent direct instantiation
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

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

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

### Other Singletons in the Project

- `EventBus.getInstance()`
- `LazyLoader.getInstance()`
- `UrlStateManager.getInstance()`
- `KeyboardShortcutManager.getInstance()`

### Advantages

- **Unique instance** - Consistent shared state
- **Global access** - Available everywhere
- **Lazy loading** - Created only when needed

---

## Observer Pattern (Pub/Sub)

### Concept

The Observer pattern allows objects (observers) to subscribe to a subject to be notified of changes.

### Implementation in Fisheye

**File**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

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
   * Subscribe to an event.
   * @param {string} eventName - Event name
   * @param {Function} callback - Function to call
   * @param {Object} options - Options (once, priority)
   */
  on(eventName, callback, options = {}) {
    const { once = false, priority = 0 } = options
    const wrappedCallback = (e) => callback(e.detail)

    this._listeners.set(callback, { wrapped: wrappedCallback, priority })
    this._target.addEventListener(eventName, wrappedCallback, { once })
  }

  /**
   * Unsubscribe from an event.
   */
  off(eventName, callback) {
    const listener = this._listeners.get(callback)
    if (listener) {
      this._target.removeEventListener(eventName, listener.wrapped)
      this._listeners.delete(callback)
    }
  }

  /**
   * Emit an event.
   * @param {string} eventName - Event name
   * @param {*} data - Data to transmit
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

// Subscribe
eventBus.on('like:toggle', (data) => {
  console.log(`Media ${data.mediaId} liked: ${data.isLiked}`)
})

// Emit
eventBus.emit('like:toggle', { mediaId: 123, isLiked: true })

// Unsubscribe
eventBus.off('like:toggle', callback)
```

### Advantages

- **Decoupling** - Components don't know each other
- **Flexibility** - Add/remove observers easily
- **Communication** - Between components without dependencies

---

## Strategy Pattern

### Concept

The Strategy Pattern allows defining a family of interchangeable algorithms.

### Implementation in Fisheye

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
class SortFilters {
  static SORT_OPTIONS = {
    popularity: { label: 'Popularity', property: '_likes', type: 'numeric', desc: true },
    date: { label: 'Date', property: '_date', type: 'date', desc: true },
    title: { label: 'Title', property: '_title', type: 'alphabetic', desc: false }
  }

  // Comparison strategies
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

### Advantages

- **Interchangeable** - Switch algorithms without modifying client code
- **Testable** - Each strategy can be tested independently
- **Extensible** - Adding a new strategy is simple

---

## Module Pattern

### Concept

The Module Pattern encapsulates code with a private scope, exposing only a public API.

### Implementation in Fisheye

With ES6 classes, this pattern is naturally implemented:

```javascript
class LikeManager {
  // Private (convention _)
  _likedMedia = new Set()

  // Private
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

The Decorator Pattern adds functionality to an object dynamically.

### Implementation - Memoization

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
class CacheManager {
  /**
   * Decorates a function with caching.
   * @param {Function} fn - Function to memoize
   * @param {Function} keyGenerator - Key generator
   * @param {number} ttl - Time to live
   * @returns {Function} Decorated function
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

### Implementation - Debounce

**File**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
/**
 * Decorates a function with a debounce delay.
 * @param {Function} fn - Function to decorate
 * @param {number} delay - Delay in ms
 * @returns {Function} Decorated function
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

## Summary

| Pattern | Usage in Fisheye | Main File |
|---------|------------------|-----------|
| **Factory** | Media card creation | MediaFactory.js |
| **Singleton** | Global managers | FavoritesManager.js |
| **Observer** | Component communication | EventBus.js |
| **Strategy** | Sorting algorithms | SortFilters.js |
| **Module** | Class encapsulation | All classes |
| **Decorator** | Memoization, debounce | CacheManager.js |

---

## Practical Exercise

Implement a NotificationManager with Singleton and Observer patterns:

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
  console.log('Success:', msg)
})

notifications.notify('success', 'Photographer added to favorites!')
```
