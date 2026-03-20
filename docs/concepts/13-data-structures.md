# Data Structures

## Concept

JavaScript offers several data structures for organizing and manipulating data efficiently. Each structure has its strengths and use cases.

---

## Map

A collection of key-value pairs where keys can be of any type.

### Syntax

```javascript
const map = new Map()

// Add
map.set('key', 'value')
map.set(123, 'number key')
map.set({ id: 1 }, 'object key')

// Read
map.get('key')      // 'value'
map.has('key')      // true
map.size            // 3

// Delete
map.delete('key')
map.clear()

// Iteration
for (const [key, value] of map) {
  console.log(key, value)
}
map.forEach((value, key) => console.log(key, value))
```

### Implementation in Fisheye

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
class CacheManager {
  constructor(ttl = 300000) {
    this._cache = new Map()
    this._ttl = ttl
  }

  async get(key, fetchFn, ttl = this._ttl) {
    const cached = this._cache.get(key)

    if (cached && this._isValid(cached, ttl)) {
      return cached.promise
    }

    const promise = fetchFn()
    this._cache.set(key, {
      promise,
      timestamp: Date.now(),
      ttl
    })

    return promise
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, entry] of this._cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this._cache.delete(key)
      }
    }
  }

  clear() {
    this._cache.clear()
  }
}
```

**File**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
class EventBus {
  constructor() {
    this._target = new EventTarget()
    this._listeners = new Map()  // callback -> { wrapped, priority }
  }

  on(eventName, callback, options = {}) {
    const { once = false, priority = 0 } = options
    const wrappedCallback = (e) => callback(e.detail)

    this._listeners.set(callback, {
      wrapped: wrappedCallback,
      priority
    })

    this._target.addEventListener(eventName, wrappedCallback, { once })
  }

  off(eventName, callback) {
    const listener = this._listeners.get(callback)
    if (listener) {
      this._target.removeEventListener(eventName, listener.wrapped)
      this._listeners.delete(callback)
    }
  }
}
```

**File**: [scripts/utils/KeyboardShortcutManager.js](../../scripts/utils/KeyboardShortcutManager.js)

```javascript
class KeyboardShortcutManager {
  constructor() {
    this._shortcuts = new Map()  // 'ctrl+k' -> handler
    this._contexts = new Map()   // 'gallery' -> Set of shortcuts
  }

  register(combo, handler, context = 'global') {
    this._shortcuts.set(combo, { handler, context })

    if (!this._contexts.has(context)) {
      this._contexts.set(context, new Set())
    }
    this._contexts.get(context).add(combo)
  }

  _handleKeyDown(e) {
    const combo = this._getKeyCombo(e)
    const shortcut = this._shortcuts.get(combo)

    if (shortcut && this._isContextActive(shortcut.context)) {
      e.preventDefault()
      shortcut.handler(e)
    }
  }
}
```

### Map vs Object

| Aspect | Map | Object |
|--------|-----|--------|
| Key types | Any type | String or Symbol |
| Order | Guaranteed (insertion) | Not guaranteed |
| Size | `.size` | `Object.keys(obj).length` |
| Iteration | Direct | Requires Object.keys/values |
| Performance | Better for frequent add/remove | Better for static access |

---

## Set

A collection of unique values.

### Syntax

```javascript
const set = new Set()

// Add
set.add('value')
set.add('value')  // Ignored (already present)

// Check
set.has('value')  // true
set.size          // 1

// Delete
set.delete('value')
set.clear()

// Iteration
for (const value of set) {
  console.log(value)
}

// Conversion
const array = [...set]
const set2 = new Set(array)
```

### Implementation in Fisheye

**File**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

```javascript
class TagFilter {
  constructor(photographers, onFilter) {
    this._photographers = photographers
    this._onFilter = onFilter
    this._activeTags = new Set()  // Currently selected tags
  }

  _getAllTags() {
    // Use Set to automatically deduplicate
    const allTags = this._photographers.flatMap(p => p.tags)
    return [...new Set(allTags)]
  }

  toggle(tag) {
    if (this._activeTags.has(tag)) {
      this._activeTags.delete(tag)
    } else {
      this._activeTags.add(tag)
    }
    this._applyFilter()
  }

  filter(photographers) {
    if (this._activeTags.size === 0) {
      return photographers
    }

    return photographers.filter(photographer =>
      [...this._activeTags].some(tag => photographer.hasTag(tag))
    )
  }

  reset() {
    this._activeTags.clear()
    this._applyFilter()
  }
}
```

**File**: [scripts/utils/LikeManager.js](../../scripts/utils/LikeManager.js)

```javascript
class LikeManager {
  constructor() {
    this._likedMedia = new Set(this._loadFromStorage())
  }

  toggle(mediaId) {
    if (this._likedMedia.has(mediaId)) {
      this._likedMedia.delete(mediaId)
    } else {
      this._likedMedia.add(mediaId)
    }
    this._save()
  }

  isLiked(mediaId) {
    return this._likedMedia.has(mediaId)
  }

  _save() {
    localStorage.setItem('likedMedia', JSON.stringify([...this._likedMedia]))
  }
}
```

### Set Use Cases

1. **Deduplicate an array**
```javascript
const unique = [...new Set(arrayWithDuplicates)]
```

2. **Check membership (O(1))**
```javascript
const validTags = new Set(['portrait', 'nature', 'art'])
if (validTags.has(userTag)) { ... }
```

3. **Set operations**
```javascript
// Union
const union = new Set([...setA, ...setB])

// Intersection
const intersection = new Set([...setA].filter(x => setB.has(x)))

// Difference
const difference = new Set([...setA].filter(x => !setB.has(x)))
```

---

## Array

The most used structure for ordered lists.

### Characteristics in Fisheye

- Storing photographers, media
- Transformation with map/filter/reduce
- Sorting and searching

### Manipulation Example

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
class App {
  constructor() {
    this._allPhotographers = []  // Main storage
    this._photographers = []     // Filtered list
  }

  async main() {
    const data = await this.photographersApi.getPhotographers()
    this._allPhotographers = new PhotographersFactory(data, 'photographers')
    this._photographers = [...this._allPhotographers]  // Copy for filtering
  }

  _filterPhotographers(state) {
    let filtered = [...this._allPhotographers]

    if (state.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(state.search.toLowerCase())
      )
    }

    if (state.tags?.length > 0) {
      filtered = filtered.filter(p =>
        state.tags.some(tag => p.hasTag(tag))
      )
    }

    return filtered
  }
}
```

---

## Object

For structured data with named properties.

### Usage in Fisheye

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
class SortFilters {
  // Configuration as an object
  static SORT_OPTIONS = {
    popularity: {
      label: 'Popularity',
      property: '_likes',
      type: 'numeric',
      desc: true
    },
    date: {
      label: 'Date',
      property: '_date',
      type: 'date',
      desc: true
    },
    title: {
      label: 'Title',
      property: '_title',
      type: 'alphabetic',
      desc: false
    }
  }

  _getCurrentOption() {
    return SortFilters.SORT_OPTIONS[this._currentSort]
  }
}
```

### Object Methods

**File**: [scripts/utils/StatsCalculator.js](../../scripts/utils/StatsCalculator.js)

```javascript
class StatsCalculator {
  _getLikesByPhotographer() {
    return this._media.reduce((acc, media) => {
      const id = media.photographerId
      acc[id] = (acc[id] || 0) + media.likes
      return acc
    }, {})
  }

  getStatsByCountry() {
    const stats = this._photographers.reduce((acc, p) => {
      if (!acc[p.country]) {
        acc[p.country] = { count: 0, totalPrice: 0 }
      }
      acc[p.country].count++
      acc[p.country].totalPrice += p.price
      return acc
    }, {})

    // Object.entries to iterate over key-value pairs
    return Object.entries(stats).map(([country, data]) => ({
      country,
      count: data.count,
      avgPrice: Math.round(data.totalPrice / data.count)
    }))
  }
}
```

---

## Structure Comparison

| Structure | Order | Unique Keys | Unique Values | Iteration |
|-----------|-------|-------------|---------------|-----------|
| Array | Yes (index) | N/A | No | for, forEach, for...of |
| Object | Not guaranteed | Yes (strings) | No | for...in, Object.keys |
| Map | Yes (insertion) | Yes (any type) | No | for...of, forEach |
| Set | Yes (insertion) | N/A | Yes | for...of, forEach |

---

## When to Use Which Structure?

| Need | Recommended Structure |
|------|----------------------|
| Ordered list | Array |
| Named data | Object |
| Key-value cache | Map |
| Unique values | Set |
| Configuration | Object |
| Active tags | Set |
| Mapped listeners | Map |

---

## Practical Exercise

Create a tag manager with Set and Map:

```javascript
class TagManager {
  constructor() {
    this._tagCounts = new Map()    // tag -> count
    this._activeTags = new Set()   // selected tags
  }

  addPhotographer(photographer) {
    photographer.tags.forEach(tag => {
      const count = this._tagCounts.get(tag) || 0
      this._tagCounts.set(tag, count + 1)
    })
  }

  getAllTags() {
    // Sort by popularity
    return [...this._tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  }

  toggleTag(tag) {
    if (this._activeTags.has(tag)) {
      this._activeTags.delete(tag)
    } else {
      this._activeTags.add(tag)
    }
  }

  getActiveTags() {
    return [...this._activeTags]
  }

  hasActiveTag(tag) {
    return this._activeTags.has(tag)
  }

  clearActiveTags() {
    this._activeTags.clear()
  }
}
```
