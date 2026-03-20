# ROADMAP - Fisheye Frontend

## Objective

Practice key JavaScript concepts through concrete features.

## Concepts Documentation

All JavaScript concepts are documented individually in the [docs/concepts/](docs/concepts/README.md) folder.

---

## Phase 1: Fundamentals ✅

### 1.1 Tag Filter System ✅
**Concepts**: `Array.filter()`, `Array.map()`, `Array.includes()`, `Set`, event listeners, DOM manipulation

**Description**: Add tags to photographers (Portrait, Events, Fashion, etc.) and enable filtering.

**Files**: `scripts/templates/TagFilter.js`

**Tasks**:
- [x] Add tags in `photographers.json`
- [x] Create filter buttons dynamically
- [x] Filter photographers on click
- [x] Handle multiple filters (intersection/union)
- [x] Add a "Reset" button

---

### 1.2 Search Bar with Auto-completion ✅
**Concepts**: `String.includes()`, `String.toLowerCase()`, debounce, closures, input events

**Description**: Search photographers by name, city, or tagline with suggestions.

**Files**: `scripts/templates/SearchBar.js`, `scripts/utils/debounce.js`

**Tasks**:
- [x] Create the search input
- [x] Implement debounce (avoid too many requests)
- [x] Filter results in real time
- [x] Display suggestions in a dropdown
- [x] Handle keyboard navigation in suggestions (ArrowUp/Down, Enter)

```javascript
// Concept: Debounce with closure
function debounce(fn, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

---

### 1.3 Enhanced Media Sorting ✅
**Concepts**: `Array.sort()`, comparison functions, spread operator, immutability, Strategy pattern

**Description**: Sort media by popularity, date, title (ascending/descending).

**Files**: `scripts/templates/SortFilters.js`, `scripts/templates/MediaFilter.js`

**Tasks**:
- [x] Create a custom accessible dropdown component
- [x] Implement multi-criteria sorting
- [x] Preserve original order (copy with spread)
- [x] Add ascending/descending order
- [ ] Animate card reorganization

---

## Phase 2: Advanced Data Manipulation ✅

### 2.1 Favorites System with LocalStorage ✅
**Concepts**: `localStorage`, `JSON.parse()`, `JSON.stringify()`, `Array.find()`, Singleton pattern, Observer pattern

**Description**: Allow users to save their favorite photographers/media.

**Files**: `scripts/utils/FavoritesManager.js`, `scripts/templates/FavoriteButton.js`, `favorites.html`

**Tasks**:
- [x] Create a `FavoritesManager` class
- [x] Save/load from localStorage
- [x] Add heart buttons on cards
- [x] Create a "My favorites" page
- [x] Synchronize state between pages

```javascript
// Concept: Class with localStorage
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

### 2.2 Statistics with Array.reduce() ✅
**Concepts**: `Array.reduce()`, `Object.entries()`, `Object.keys()`, data aggregation

**Description**: Display statistics about photographers and their media.

**Files**: `scripts/utils/StatsCalculator.js`, `scripts/templates/StatsDashboard.js`, `stats.html`

**Tasks**:
- [x] Calculate total likes per photographer
- [x] Calculate average prices
- [x] Group media by category
- [x] Find the most popular photographer
- [x] Display a stats dashboard

```javascript
// Concept: reduce to group
const mediaByCategory = media.reduce((acc, item) => {
  const category = item.category || 'other'
  acc[category] = acc[category] || []
  acc[category].push(item)
  return acc
}, {})
```

---

### 2.3 Navigation History with History API ✅
**Concepts**: `history.pushState()`, `popstate` event, `URLSearchParams`, application state, Singleton

**Description**: Enable back/forward navigation and shareable URLs.

**Files**: `scripts/utils/UrlStateManager.js`

**Tasks**:
- [x] Save filters in the URL
- [x] Restore state from URL on load
- [x] Handle browser back button
- [x] Create shareable URLs for filters

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

## Phase 3: Asynchronous Programming ✅

### 3.1 Lazy Loading Images ✅
**Concepts**: `IntersectionObserver`, callbacks, async loading, Singleton, performance

**Description**: Load images only when they are visible.

**Files**: `scripts/utils/LazyLoader.js`

**Tasks**:
- [x] Use `data-src` instead of `src`
- [x] Create an IntersectionObserver
- [x] Load image when it enters the viewport
- [x] Add a placeholder/skeleton during loading
- [x] Handle loading errors

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
**Concepts**: `IntersectionObserver`, `Promise`, loading state, throttle

**Description**: Load more media on scroll instead of displaying everything.

**Files**: `scripts/utils/InfiniteScroll.js`

**Tasks**:
- [x] Limit initial display (e.g., 9 media)
- [x] Detect scroll to bottom
- [x] Load next batch
- [x] Display a loader during loading
- [x] Handle end of data

---

### 3.3 Data Cache with Promise ✅
**Concepts**: `Promise`, `Map`, memoization, Singleton pattern

**Description**: Cache API calls to avoid redundant requests.

**Files**: `scripts/utils/CacheManager.js`

**Tasks**:
- [x] Create a `CacheManager` class
- [x] Store promises (not results)
- [x] Define an expiration duration
- [x] Manually invalidate cache

```javascript
// Concept: Promise Cache
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

### 3.4 Parallel Loading with Promise.all ✅
**Concepts**: `Promise.all()`, `Promise.allSettled()`, multiple error handling

**Description**: Load data from multiple photographers in parallel.

**Files**: `scripts/utils/ParallelLoader.js`

**Tasks**:
- [x] Load all media in parallel
- [ ] Display a global progress bar
- [x] Handle individual errors without blocking
- [x] Use `Promise.allSettled()` for resilience

```javascript
// Concept: Promise.allSettled for resilience
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

## Phase 4: Events and Interactions ✅

### 4.1 Optimistic Like System ✅
**Concepts**: Event delegation, `data-*` attributes, optimistic UI, local state, localStorage

**Description**: Like media with immediate feedback.

**Files**: `scripts/utils/LikeManager.js`, `scripts/templates/PhotographerMediaCard.js`

**Tasks**:
- [x] Use event delegation (single listener)
- [x] Update UI immediately (optimistic)
- [x] Persist in localStorage
- [x] Animate the heart on click
- [x] Update total counter

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

### 4.2 Drag & Drop to Reorganize ✅
**Concepts**: Drag events (`dragstart`, `dragover`, `drop`), `dataTransfer`, DOM reorder

**Description**: Reorganize media by drag and drop.

**Files**: `scripts/utils/DragDropManager.js`

**Tasks**:
- [x] Make cards draggable
- [x] Handle drag events
- [x] Display a drop zone indicator
- [x] Reorganize DOM
- [ ] Save custom order

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
  // Reorganize...
})
```

---

### 4.3 Custom Events for Communication ✅
**Concepts**: `CustomEvent`, `dispatchEvent`, Observer pattern, Singleton, decoupling

**Description**: Create a custom events system for component communication.

**Files**: `scripts/utils/EventBus.js`

**Tasks**:
- [x] Create a singleton EventBus
- [x] Emit events on actions (like, filter, sort)
- [x] Listen to events in relevant components
- [x] Update global likes counter via events

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

### 4.4 Global Keyboard Shortcuts ✅
**Concepts**: `keydown` events, `KeyboardEvent`, Map, combinations (Ctrl+K), accessibility

**Description**: Add keyboard shortcuts for quick navigation.

**Files**: `scripts/utils/KeyboardShortcutManager.js`

**Tasks**:
- [x] Ctrl+K: Open search
- [x] Escape: Close modals/lightbox
- [x] J/K: Navigate between media
- [x] L: Like active media
- [x] Display shortcuts help (?)

---

## Phase 5: Forms and Validation ✅

### 5.1 Advanced Form Validation ✅
**Concepts**: Regex, `FormData`, custom validation, user feedback

**Description**: Validate the contact form with custom rules.

**Files**: `scripts/utils/Validator.js`, `scripts/utils/contactForm.js`

**Tasks**:
- [x] Validate email with regex
- [x] Validate message length
- [x] Display errors in real time
- [x] Disable submit if invalid
- [x] Create a `Validator` class

```javascript
// Concept: Validation with Regex
class Validator {
  static email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      valid: regex.test(value),
      message: 'Invalid email'
    }
  }

  static minLength(value, min) {
    return {
      valid: value.length >= min,
      message: `Minimum ${min} characters`
    }
  }

  static required(value) {
    return {
      valid: value.trim().length > 0,
      message: 'Required field'
    }
  }
}
```

---

### 5.2 Form Auto-save ✅
**Concepts**: `sessionStorage`, `input` event, debounce, state restoration

**Description**: Automatically save the form draft.

**Files**: `scripts/utils/FormAutoSave.js`, `scripts/utils/contactForm.js`

**Tasks**:
- [x] Save each field on blur or after debounce
- [x] Restore values on load
- [x] Display "Draft saved"
- [x] Clear after successful submission

---

## Phase 6: Performance and Optimization (In Progress)

### 6.1 Virtual Scrolling
**Concepts**: DOM recycling, position calculations, `requestAnimationFrame`, performance

**Description**: Display only visible elements for large lists.

**Tasks**:
- [ ] Calculate visible elements based on scroll
- [ ] Recycle DOM elements
- [ ] Maintain container height
- [ ] Handle smooth scrolling

---

### 6.2 Web Workers for Sorting/Filtering ✅
**Concepts**: `Worker`, `postMessage`, data transfer, separate thread

**Description**: Move heavy calculations to a Web Worker.

**Files**: `scripts/workers/sortWorker.js`, `scripts/utils/WorkerManager.js`

**Tasks**:
- [x] Create a worker for sorting
- [x] Send data to the worker
- [x] Receive sorted results
- [x] Add filtering and search
- [x] Add data aggregation
- [x] Create WorkerManager with Promises

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

### 6.3 Throttle for Scroll ✅
**Concepts**: Throttle vs debounce, `requestAnimationFrame`, scroll performance

**Description**: Optimize scroll handlers.

**Files**: `scripts/utils/throttle.js`

**Tasks**:
- [x] Implement a throttle function
- [x] Apply to scroll listener
- [x] Compare with requestAnimationFrame (rafThrottle implemented)

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

## Phase 7: Advanced Patterns ✅

### 7.1 State Management (Mini Redux) ✅
**Concepts**: Singleton, immutability, reducers, subscribers, unidirectional flow

**Description**: Create a centralized store for application state.

**Files**: `scripts/utils/Store.js`

**Tasks**:
- [x] Create a `Store` class
- [x] Implement `getState()`, `dispatch()`, `subscribe()`
- [x] Add `subscribeToSelector()` to optimize re-renders
- [x] Add middleware system
- [x] Create helpers: `combineReducers`, `createReducer`, `createAction`
- [x] Add `loggerMiddleware` and `thunkMiddleware`

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

### 7.2 Reusable Components (In Progress)
**Concepts**: Composition, slots, props, lifecycle, encapsulation

**Description**: Create generic reusable UI components.

**Files**: `scripts/utils/Toast.js`

**Tasks**:
- [ ] Create generic `Modal`
- [ ] Create accessible `Dropdown`
- [x] Create `Toast` notifications
- [ ] Create `Skeleton` loader
- [ ] Document API for each component

```javascript
// Concept: Reusable component
class Modal {
  constructor({ title, content, onClose, onConfirm }) {
    this._title = title
    this._content = content
    this._onClose = onClose
    this._onConfirm = onConfirm
  }

  render() {
    // Create modal DOM
  }

  open() {
    // Display and focus trap
  }

  close() {
    // Close and cleanup
    this._onClose?.()
  }
}
```

---

### 7.3 Decorator Pattern for Logging ✅
**Concepts**: Higher-order functions, decorators, AOP, debugging

**Description**: Add automatic logging to methods.

**Files**: `scripts/utils/withLogging.js`

**Tasks**:
- [x] Create a `withLogging` decorator
- [x] Log method calls
- [x] Log errors automatically
- [x] Measure execution time
- [x] Create `withTiming`, `withErrorHandling`, `withMemoization`, `withRateLimit`, `withValidation`
- [x] Create `compose` to chain decorators

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

## Phase 8: Modern Web APIs

### 8.1 Share API ✅
**Concepts**: `navigator.share()`, feature detection, Clipboard API, fallback

**Description**: Share a photographer or media on social networks.

**Files**: `scripts/templates/ShareButton.js`

**Tasks**:
- [x] Detect API support
- [x] Create a share button
- [x] Share with title, text, and URL
- [x] Fallback: copy link to clipboard

```javascript
// Concept: Share API with fallback
async function share(data) {
  if (navigator.share) {
    await navigator.share(data)
  } else {
    await navigator.clipboard.writeText(data.url)
    showToast('Link copied!')
  }
}
```

---

### 8.2 Clipboard API ✅
**Concepts**: `navigator.clipboard`, Permissions API, async clipboard, fallback

**Description**: Copy photographer information.

**Files**: `scripts/templates/ShareButton.js`, `scripts/utils/UrlStateManager.js`

**Tasks**:
- [ ] "Copy email" button
- [x] "Copy link" button
- [x] Visual feedback after copy

---

### 8.3 Fullscreen API ✅
**Concepts**: `requestFullscreen()`, `fullscreenchange` event, browser prefixes

**Description**: View lightbox in fullscreen.

**Files**: `scripts/utils/lightbox.js`, `css/photographer.css`

**Tasks**:
- [x] Add a fullscreen button to lightbox
- [x] Handle browser prefixes
- [x] Listen to fullscreen changes
- [x] Adapt UI in fullscreen mode

---

### 8.4 Page Visibility API ✅
**Concepts**: `visibilitychange`, `document.hidden`, resource optimization

**Description**: Pause videos when tab is not visible.

**Files**: `scripts/utils/PageVisibilityManager.js`

**Tasks**:
- [x] Detect visibility change
- [x] Pause playing videos
- [x] Resume when tab becomes visible again

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

## Phase 9: Error Handling ✅

### 9.1 Error Boundary Pattern ✅
**Concepts**: `try/catch`, error recovery, graceful degradation, error UX

**Description**: Handle errors elegantly.

**Files**: `scripts/utils/ErrorBoundary.js`

**Tasks**:
- [x] Create an `ErrorBoundary` class
- [x] Display a user-friendly error message
- [x] Log errors for debug
- [x] Allow retry
- [x] Add `withRetry` with exponential backoff
- [x] Configure global error handler

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
    // Send to monitoring service
  }
}
```

---

### 9.2 Custom Error Classes ✅
**Concepts**: `extends Error`, error types, stack traces, instanceof

**Description**: Create typed errors for better handling.

**Files**: `scripts/utils/CustomErrors.js`

**Tasks**:
- [x] Create `NetworkError`
- [x] Create `ValidationError`
- [x] Create `NotFoundError`
- [x] Handle differently based on type
- [x] Create `AppError`, `ConfigError`, `TimeoutError`, `UnsupportedError`, `PermissionError`
- [x] Create `ErrorHandler` for centralized management

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

## Phase 10: Modules and Architecture

### 10.1 Migration to ES Modules
**Concepts**: `import`, `export`, `export default`, dynamic modules

**Description**: Convert scripts to ES6 modules.

**Tasks**:
- [ ] Add `type="module"` to main script
- [ ] Convert each file to module
- [ ] Manage dependencies with import/export
- [ ] Use dynamic imports for lazy loading

```javascript
// Concept: ES Modules
// Api.js
export class Api { ... }
export class PhotographerApi extends Api { ... }

// App.js
import { PhotographerApi } from './api/Api.js'

// Dynamic import for lazy loading
const { Lightbox } = await import('./utils/lightbox.js')
```

---

### 10.2 Explicit MVC Architecture
**Concepts**: Separation of concerns, MVC, loose coupling

**Description**: Restructure code into Model-View-Controller.

**Tasks**:
- [ ] Clearly separate Models (data)
- [ ] Separate Views (display)
- [ ] Create Controllers (logic)
- [ ] Document responsibilities

---

## Concepts Summary

| Concept | Associated Features |
|---------|-------------------|
| Array methods | 1.1, 1.3, 2.1, 2.2 |
| Async/Await | 3.1, 3.2, 3.3, 3.4 |
| ES6 Classes | All |
| Closures | 1.2, 3.3 |
| Custom Events | 4.3 |
| Debounce/Throttle | 1.2, 6.3 |
| DOM manipulation | 1.1, 4.1 |
| Drag & Drop | 4.2 |
| Error handling | 9.1, 9.2 |
| ES Modules | 10.1 |
| Event delegation | 4.1 |
| Fetch API | Already implemented |
| History API | 2.3 |
| IntersectionObserver | 3.1, 3.2 |
| LocalStorage | 2.1, 5.2 |
| Promises | 3.3, 3.4 |
| Regex | 5.1 |
| Singleton | 3.3, 4.3 |
| Web APIs | 8.1, 8.2, 8.3, 8.4 |
| Web Workers | 6.2 |

---

## Suggested Order

1. **Beginner**: 1.1 → 1.2 → 1.3 → 2.1
2. **Intermediate**: 2.2 → 3.1 → 4.1 → 5.1
3. **Advanced**: 3.3 → 4.3 → 7.1 → 10.1
4. **Expert**: 6.1 → 6.2 → 7.3 → 9.1
