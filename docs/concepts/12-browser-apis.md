# Browser APIs

## Concept

Browser APIs are interfaces provided by the browser to interact with the system, URL, storage, and other native features.

---

## Fetch API

The Fetch API allows making HTTP requests.

### Basic Syntax

```javascript
const response = await fetch(url, options)
const data = await response.json()
```

### Implementation in Fisheye

**File**: [scripts/api/Api.js](../../scripts/api/Api.js)

```javascript
class Api {
  constructor(url) {
    this._url = url
  }

  async get() {
    try {
      const res = await fetch(this._url)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      return await res.json()
    } catch (error) {
      console.error('API Error:', error)
      return null
    }
  }
}
```

---

## History API

The History API allows manipulating the browser history without page reload.

### Main Methods

```javascript
// Add an entry
history.pushState(state, title, url)

// Replace the current entry
history.replaceState(state, title, url)

// Navigation
history.back()
history.forward()
history.go(-2)
```

### Implementation in Fisheye

**File**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
class UrlStateManager {
  constructor() {
    this._state = this._parseUrl()
    this._initPopstateListener()
  }

  _initPopstateListener() {
    window.addEventListener('popstate', (e) => {
      this._state = e.state || this._parseUrl()
      this._notifyChange()
    })
  }

  updateState(newState, replace = false) {
    this._state = { ...this._state, ...newState }
    const url = this._buildUrl()

    if (replace) {
      history.replaceState(this._state, '', url)
    } else {
      history.pushState(this._state, '', url)
    }

    this._notifyChange()
  }

  _buildUrl() {
    const params = new URLSearchParams()

    if (this._state.search) {
      params.set('q', this._state.search)
    }
    if (this._state.tags && this._state.tags.length > 0) {
      params.set('tags', this._state.tags.join(','))
    }
    if (this._state.sort) {
      params.set('sort', this._state.sort)
    }

    const queryString = params.toString()
    return queryString ? `?${queryString}` : window.location.pathname
  }
}
```

---

## URLSearchParams

Allows manipulating URL parameters.

### Syntax

```javascript
const params = new URLSearchParams(window.location.search)

// Reading
params.get('q')         // Value of a parameter
params.has('q')         // Check existence
params.getAll('tags')   // All values of a parameter

// Modification
params.set('q', 'value')
params.append('tag', 'portrait')
params.delete('sort')

// Convert to string
params.toString()  // 'q=value&tag=portrait'
```

### Implementation in Fisheye

**File**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
_parseUrl() {
  const params = new URLSearchParams(window.location.search)

  return {
    search: params.get('q') || '',
    tags: params.get('tags')?.split(',').filter(Boolean) || [],
    sort: params.get('sort') || 'popularity'
  }
}
```

---

## localStorage

Persistent client-side storage (survives browser closing).

### Syntax

```javascript
// Storage
localStorage.setItem('key', 'value')

// Reading
const value = localStorage.getItem('key')

// Deletion
localStorage.removeItem('key')
localStorage.clear()  // Clear everything
```

### Implementation in Fisheye

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  constructor() {
    this._storageKey = 'fisheye_favorites'
    this._favorites = this._load()
  }

  _load() {
    try {
      const data = localStorage.getItem(this._storageKey)
      const parsed = data ? JSON.parse(data) : []

      // Validation
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed
    } catch (error) {
      console.error('Error loading favorites:', error)
      return []
    }
  }

  _save() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._favorites))
    } catch (error) {
      console.error('Error saving favorites:', error)
    }
  }
}
```

**File**: [scripts/templates/PhotographerMediaCard.js](../../scripts/templates/PhotographerMediaCard.js)

```javascript
_loadLikedState() {
  const likedMedia = localStorage.getItem('likedMedia')
  if (likedMedia) {
    const parsed = JSON.parse(likedMedia)
    return parsed.includes(this._media.id)
  }
  return false
}

_saveLikedState(isLiked) {
  let likedMedia = JSON.parse(localStorage.getItem('likedMedia') || '[]')

  if (isLiked) {
    likedMedia.push(this._media.id)
  } else {
    likedMedia = likedMedia.filter(id => id !== this._media.id)
  }

  localStorage.setItem('likedMedia', JSON.stringify(likedMedia))
}
```

---

## IntersectionObserver

Observes when an element enters/exits the viewport.

### Syntax

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // The element is visible
      }
    })
  },
  {
    root: null,           // Viewport by default
    rootMargin: '100px',  // Margin around the root
    threshold: 0.1        // 10% visible to trigger
  }
)

observer.observe(element)
observer.unobserve(element)
observer.disconnect()
```

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
      // Preload the image
      await new Promise((resolve, reject) => {
        const tempImage = new Image()
        tempImage.onload = resolve
        tempImage.onerror = reject
        tempImage.src = src
      })

      // Apply when loaded
      img.src = src
      img.removeAttribute('data-src')
      img.classList.add('loaded')
    } catch (error) {
      img.classList.add('error')
    }
  }
}
```

---

## Clipboard API

Allows copying/pasting to the clipboard.

### Syntax

```javascript
// Write
await navigator.clipboard.writeText('Text to copy')

// Read
const text = await navigator.clipboard.readText()
```

### Implementation in Fisheye

**File**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
async _copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers
    return this._fallbackCopy(text)
  } catch (error) {
    console.error('Copy error:', error)
    return this._fallbackCopy(text)
  }
}

_fallbackCopy(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)
  textArea.select()
  const success = document.execCommand('copy')
  document.body.removeChild(textArea)

  return success
}
```

---

## Web Share API

Allows sharing content via native apps.

### Syntax

```javascript
if (navigator.share) {
  await navigator.share({
    title: 'Title',
    text: 'Description',
    url: 'https://example.com'
  })
}
```

### Implementation in Fisheye

**File**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
class ShareButton {
  async _share() {
    const shareData = this._getShareData()

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        this._showFeedback('Shared!')
      } else {
        // Fallback: copy the link
        await this._copyToClipboard(shareData.url)
        this._showFeedback('Link copied!')
      }
    } catch (error) {
      // User cancelled the share
      if (error.name !== 'AbortError') {
        console.error('Share error:', error)
      }
    }
  }

  _getShareData() {
    return {
      title: `${this._photographerName} - Fisheye`,
      text: `Discover ${this._photographerName}'s portfolio`,
      url: window.location.href
    }
  }
}
```

---

## Summary

| API | Usage | Support |
|-----|-------|---------|
| **Fetch** | HTTP requests | All modern browsers |
| **History** | SPA navigation | All modern browsers |
| **URLSearchParams** | URL parameters | All modern browsers |
| **localStorage** | Persistent storage | All browsers |
| **IntersectionObserver** | Lazy loading | IE not supported |
| **Clipboard** | Copy/paste | Requires HTTPS |
| **Web Share** | Native sharing | Mainly mobile |

---

## Feature Detection

Always check if an API is available before using it.

```javascript
// Clipboard API
if (navigator.clipboard && navigator.clipboard.writeText) {
  await navigator.clipboard.writeText(text)
} else {
  // Fallback
}

// Web Share API
if (navigator.share) {
  await navigator.share(data)
} else {
  // Fallback
}

// IntersectionObserver
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(callback)
} else {
  // Load images immediately
}
```

---

## Practical Exercise

Create a theme manager with localStorage:

```javascript
class ThemeManager {
  constructor() {
    this._storageKey = 'fisheye_theme'
    this._theme = this._load()
    this._apply()
  }

  _load() {
    const saved = localStorage.getItem(this._storageKey)
    if (saved) return saved

    // Detect system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  _apply() {
    document.documentElement.setAttribute('data-theme', this._theme)
  }

  toggle() {
    this._theme = this._theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(this._storageKey, this._theme)
    this._apply()
  }

  get current() {
    return this._theme
  }
}
```
