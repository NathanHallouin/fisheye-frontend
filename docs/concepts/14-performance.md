# Performance and Optimization

## Concept

Performance optimization improves user experience by reducing load times and making the interface more responsive.

---

## Debounce

Delays the execution of a function until the user stops triggering the event.

### Concept

```
Without debounce:  ─┬─┬─┬─┬─┬─┬─┬─┬─┬─> Calls on every keystroke
With debounce:     ─┬─┬─┬─┬─┬─┬─┬─┬─┬─────────> Single call after 300ms
                                      └─ delay ─┘
```

### Implementation in Fisheye

**File**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId

  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

### Usage

**File**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
class SearchBar {
  constructor(photographers, onSearch) {
    this._photographers = photographers
    this._onSearch = onSearch
    this._debouncedSearch = debounce(this._search.bind(this), 300)
  }

  _addEventListeners() {
    this.$input.addEventListener('input', (e) => {
      this._debouncedSearch(e.target.value)
    })
  }

  _search(query) {
    const filtered = this._photographers.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    )
    this._onSearch(filtered)
  }
}
```

### Use Cases

- Real-time search
- Window resizing
- Auto-save

---

## Throttle

Limits the number of function calls over a given period.

### Concept

```
Without throttle:   ─┬─┬─┬─┬─┬─┬─┬─┬─┬─> All calls
With throttle:      ─┬───────┬───────┬─> One call every 100ms
                     └─100ms─┘       │
```

### Implementation

```javascript
/**
 * Creates a throttled version of a function.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum interval in ms
 * @returns {Function} Throttled function
 */
function throttle(fn, limit) {
  let inThrottle = false

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Usage
const throttledScroll = throttle(handleScroll, 100)
window.addEventListener('scroll', throttledScroll)
```

### Debounce vs Throttle

| Aspect | Debounce | Throttle |
|--------|----------|----------|
| Timing | After the last call | At regular intervals |
| Usage | Search, resize | Scroll, drag |
| Guarantee | One call after pause | One call per interval |

---

## Lazy Loading

Loads resources only when they are needed.

### Implementation in Fisheye

**File**: [scripts/utils/LazyLoader.js](../../scripts/utils/LazyLoader.js)

```javascript
class LazyLoader {
  static _instance = null

  static getInstance() {
    if (!LazyLoader._instance) {
      LazyLoader._instance = new LazyLoader()
    }
    return LazyLoader._instance
  }

  constructor() {
    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      {
        rootMargin: '200px',  // Preload 200px before
        threshold: 0.01
      }
    )
  }

  observe(element) {
    if (element.dataset.src) {
      element.classList.add('lazy')
      this._observer.observe(element)
    }
  }

  _onIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this._loadImage(entry.target)
        this._observer.unobserve(entry.target)
      }
    })
  }

  async _loadImage(img) {
    const src = img.dataset.src
    if (!src) return

    try {
      // Preload in memory
      await this._preload(src)

      // Apply when ready
      img.src = src
      img.removeAttribute('data-src')
      img.classList.remove('lazy')
      img.classList.add('loaded')
    } catch (error) {
      img.classList.add('error')
      console.error(`Loading error: ${src}`)
    }
  }

  _preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = src
    })
  }
}
```

### Usage in Templates

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
createCard() {
  const img = document.createElement('img')
  img.dataset.src = this._photographer.portrait  // data-src instead of src
  img.alt = `Portrait of ${this._photographer.name}`
  img.classList.add('user-card__portrait')

  // Register for lazy loading
  const lazyLoader = LazyLoader.getInstance()
  lazyLoader.observe(img)

  return article
}
```

---

## Caching

Avoids redundant requests by storing results.

### Implementation in Fisheye

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
    this._ttl = ttl  // Time To Live: 5 minutes

    // Periodic cleanup
    setInterval(() => this._cleanup(), 60000)
  }

  async get(key, fetchFn, ttl = this._ttl) {
    const cached = this._cache.get(key)

    // Return cache if valid
    if (cached && this._isValid(cached, ttl)) {
      return cached.promise
    }

    // Otherwise, fetch and cache
    const promise = fetchFn()
    this._cache.set(key, {
      promise,
      timestamp: Date.now(),
      ttl
    })

    // Handle errors
    promise.catch(() => {
      this._cache.delete(key)
    })

    return promise
  }

  _isValid(entry, ttl) {
    return Date.now() - entry.timestamp < ttl
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, entry] of this._cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this._cache.delete(key)
      }
    }
  }

  invalidate(key) {
    this._cache.delete(key)
  }

  clear() {
    this._cache.clear()
  }
}
```

### Memoization

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
/**
 * Decorates a function with automatic caching.
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Key generator
 * @param {number} ttl - Time to live
 * @returns {Function} Memoized function
 */
memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
  return async (...args) => {
    const key = keyGenerator(...args)
    return this.get(key, () => fn(...args), ttl)
  }
}

// Usage
const cache = CacheManager.getInstance()
const fetchPhotographer = cache.memoize(
  (id) => fetch(`/api/photographers/${id}`).then(r => r.json()),
  (id) => `photographer:${id}`,
  60000  // Cache for 1 minute
)
```

---

## Event Delegation

A single listener to handle many elements.

### Problem

```javascript
// Bad - N listeners
cards.forEach(card => {
  card.addEventListener('click', handleClick)
})
```

### Solution

```javascript
// Good - 1 listener
container.addEventListener('click', (e) => {
  const card = e.target.closest('.card')
  if (card) handleClick(card)
})
```

### Implementation in Fisheye

**File**: [scripts/utils/LikeManager.js](../../scripts/utils/LikeManager.js)

```javascript
class LikeManager {
  constructor($container) {
    this.$container = $container
    // A single listener for all buttons
    this.$container.addEventListener('click', (e) => this._handleClick(e))
  }

  _handleClick(e) {
    const $likeBtn = e.target.closest('[data-like-id]')
    if (!$likeBtn) return

    const mediaId = parseInt($likeBtn.dataset.likeId, 10)
    this._toggleLike(mediaId, $likeBtn)
  }
}
```

---

## DocumentFragment

Reduces reflows by grouping DOM modifications.

### Problem

```javascript
// Bad - N reflows
items.forEach(item => {
  container.appendChild(createCard(item))  // Reflow on each add
})
```

### Solution

```javascript
// Good - 1 reflow
const fragment = document.createDocumentFragment()
items.forEach(item => {
  fragment.appendChild(createCard(item))
})
container.appendChild(fragment)  // Single reflow
```

### Alternative with innerHTML

```javascript
// Clear then fill - 1 reflow
container.innerHTML = ''
items.forEach(item => {
  container.appendChild(createCard(item))
})
```

---

## Techniques Summary

| Technique | Problem Solved | File |
|-----------|----------------|------|
| Debounce | Too many calls on input | debounce.js |
| Throttle | Too many calls on scroll | - |
| Lazy loading | Slow initial loading | LazyLoader.js |
| Caching | Redundant requests | CacheManager.js |
| Memoization | Repeated calculations | CacheManager.js |
| Event delegation | Too many listeners | LikeManager.js |
| DocumentFragment | Too many reflows | - |

---

## Measuring Performance

### Console Timing

```javascript
console.time('operation')
// ... code
console.timeEnd('operation')  // operation: 45.123ms
```

### Performance API

```javascript
const start = performance.now()
// ... code
const duration = performance.now() - start
console.log(`Duration: ${duration}ms`)
```

---

## Practical Exercise

Create a scroll manager with throttle and lazy loading:

```javascript
class ScrollManager {
  constructor() {
    this._lazyLoader = LazyLoader.getInstance()
    this._throttledCheck = this._throttle(this._checkImages.bind(this), 100)

    window.addEventListener('scroll', this._throttledCheck)
  }

  _throttle(fn, limit) {
    let inThrottle = false
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  _checkImages() {
    const images = document.querySelectorAll('img[data-src]:not(.loaded)')
    images.forEach(img => {
      if (this._isInViewport(img)) {
        this._lazyLoader.observe(img)
      }
    })
  }

  _isInViewport(element) {
    const rect = element.getBoundingClientRect()
    return (
      rect.top < window.innerHeight + 200 &&
      rect.bottom > -200
    )
  }

  destroy() {
    window.removeEventListener('scroll', this._throttledCheck)
  }
}
```
