# Error Handling

## Concept

Good error handling makes the application robust and provides a better user experience when problems occur.

---

## try/catch/finally

### Basic Syntax

```javascript
try {
  // Code that may fail
  riskyOperation()
} catch (error) {
  // Error handling
  console.error('Error:', error.message)
} finally {
  // Always executed
  cleanup()
}
```

### Implementation in Fisheye

**File**: [scripts/api/Api.js](../../scripts/api/Api.js)

```javascript
class Api {
  async get() {
    try {
      const res = await fetch(this._url)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      return await res.json()
    } catch (error) {
      console.error('API Error:', error)
      return null  // Default value
    }
  }
}
```

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  _load() {
    try {
      const data = localStorage.getItem(this._storageKey)
      const parsed = data ? JSON.parse(data) : []

      // Data validation
      if (!Array.isArray(parsed)) {
        console.warn('Invalid favorites data, resetting')
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
      // localStorage may be full or disabled
      console.error('Error saving:', error)
    }
  }
}
```

---

## Errors in Promises

### Promise.catch()

```javascript
fetchData()
  .then(data => processData(data))
  .catch(error => {
    console.error('Error:', error)
    return defaultValue
  })
```

### async/await with try/catch

```javascript
async function loadData() {
  try {
    const data = await fetchData()
    return processData(data)
  } catch (error) {
    console.error('Error:', error)
    return defaultValue
  }
}
```

### Implementation in Fisheye

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
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

  // Remove from cache if promise fails
  promise.catch(() => {
    this._cache.delete(key)
  })

  return promise
}
```

---

## Throw and Custom Error

### Throwing an error

```javascript
function validateEmail(email) {
  if (!email.includes('@')) {
    throw new Error('Invalid email')
  }
}
```

### Implementation in Fisheye

**File**: [scripts/factories/MediaFactory.js](../../scripts/factories/MediaFactory.js)

```javascript
class MediaFactory {
  constructor(data, photographerId) {
    if (data.image) {
      return new CreateImageCard(data, photographerId)
    } else if (data.video) {
      return new CreateVideoCard(data, photographerId)
    }

    // Unknown type - explicit error
    throw new Error(`Unknown media type: ${JSON.stringify(data)}`)
  }
}
```

### Custom error classes

```javascript
class ValidationError extends Error {
  constructor(field, message) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'NetworkError'
    this.statusCode = statusCode
  }
}

// Usage
try {
  if (!email) {
    throw new ValidationError('email', 'Email required')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new NetworkError('Server error', response.status)
  }
} catch (error) {
  if (error instanceof ValidationError) {
    showFieldError(error.field, error.message)
  } else if (error instanceof NetworkError) {
    showNetworkError(error.statusCode)
  } else {
    showGenericError(error.message)
  }
}
```

---

## Graceful Degradation

Provide a degraded but functional experience.

### Implementation in Fisheye

**File**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
async _share() {
  const shareData = this._getShareData()

  try {
    // Try native API
    if (navigator.share) {
      await navigator.share(shareData)
      this._showFeedback('Shared!')
      return
    }

    // Fallback: copy to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url)
      this._showFeedback('Link copied!')
      return
    }

    // Last resort: obsolete method
    this._fallbackCopy(shareData.url)
    this._showFeedback('Link copied!')

  } catch (error) {
    // User cancelled
    if (error.name === 'AbortError') {
      return
    }

    // Actual error
    console.error('Share error:', error)
    this._showFeedback('Share error')
  }
}
```

**File**: [scripts/utils/LazyLoader.js](../../scripts/utils/LazyLoader.js)

```javascript
async _loadImage(img) {
  const src = img.dataset.src
  if (!src) return

  try {
    await this._preload(src)
    img.src = src
    img.removeAttribute('data-src')
    img.classList.add('loaded')
  } catch (error) {
    // Fallback image or error style
    img.classList.add('error')
    img.alt = 'Image not available'
    console.warn(`Unable to load: ${src}`)
  }
}
```

---

## Data Validation

### Before processing

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
async main() {
  const data = await this.photographersApi.getPhotographers()

  // Validation
  if (!data) {
    console.error('Unable to load data')
    this._showError('Loading error')
    return
  }

  if (!data.photographers || !Array.isArray(data.photographers)) {
    console.error('Invalid data format')
    this._showError('Corrupted data')
    return
  }

  // Normal processing
  this._allPhotographers = new PhotographersFactory(data, 'photographers')
  this._displayPhotographers(this._allPhotographers)
}
```

### Validation pattern

```javascript
function validatePhotographer(data) {
  const errors = []

  if (!data.id) {
    errors.push('Missing ID')
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Invalid name')
  }

  if (typeof data.price !== 'number' || data.price < 0) {
    errors.push('Invalid price')
  }

  if (errors.length > 0) {
    throw new ValidationError('photographer', errors.join(', '))
  }

  return data
}
```

---

## Structured Logging

### Log levels

```javascript
console.log('Normal info')
console.info('Information')
console.warn('Warning')
console.error('Error')
console.debug('Debug (hidden by default)')
```

### Logging pattern

```javascript
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    }

    switch (level) {
      case 'error':
        console.error(logEntry)
        break
      case 'warn':
        console.warn(logEntry)
        break
      default:
        console.log(logEntry)
    }
  }

  static error(message, error) {
    this.log('error', message, {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    })
  }

  static warn(message, data) {
    this.log('warn', message, data)
  }

  static info(message, data) {
    this.log('info', message, data)
  }
}

// Usage
try {
  await riskyOperation()
} catch (error) {
  Logger.error('Operation failed', error)
}
```

---

## Best Practices

### 1. Never ignore errors

```javascript
// Bad
try {
  riskyOperation()
} catch (e) {
  // Silence...
}

// Good
try {
  riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  // Or notify the user
}
```

### 2. Be specific in messages

```javascript
// Bad
throw new Error('Error')

// Good
throw new Error(`Unable to load photographer ${id}: ${response.status}`)
```

### 3. Always return a default value

```javascript
async function loadData() {
  try {
    return await fetchData()
  } catch (error) {
    console.error('Error:', error)
    return []  // Default value
  }
}
```

### 4. Clean up resources in finally

```javascript
async function processFile() {
  let file = null
  try {
    file = await openFile()
    return await process(file)
  } catch (error) {
    console.error('Error:', error)
    throw error
  } finally {
    if (file) {
      await file.close()
    }
  }
}
```

---

## Practical Exercise

Create an API wrapper with complete error handling:

```javascript
class ApiClient {
  constructor(baseUrl) {
    this._baseUrl = baseUrl
  }

  async request(endpoint, options = {}) {
    const url = `${this._baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new NetworkError(
          `HTTP Error: ${response.statusText}`,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }

      // Network error (offline, timeout, etc.)
      throw new NetworkError(
        `Network error: ${error.message}`,
        0
      )
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

// Usage with error handling
const api = new ApiClient('/api')

try {
  const photographers = await api.get('/photographers')
  displayPhotographers(photographers)
} catch (error) {
  if (error instanceof NetworkError) {
    if (error.statusCode === 404) {
      showMessage('Data not found')
    } else if (error.statusCode >= 500) {
      showMessage('Server error, try again later')
    } else if (error.statusCode === 0) {
      showMessage('Check your internet connection')
    }
  } else {
    showMessage('An unexpected error occurred')
    console.error('Error:', error)
  }
}
```
