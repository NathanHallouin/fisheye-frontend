# Async/Await and Promises

## Concept

`async/await` is a modern syntax for handling asynchronous code in JavaScript. It relies on Promises and makes asynchronous code more readable.

## Promises

A Promise represents a value that will be available in the future.

### Promise States

1. **Pending** - Waiting
2. **Fulfilled** - Successfully resolved
3. **Rejected** - Rejected with an error

### Basic Syntax

```javascript
// Create a Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Success!')
    // or reject(new Error('Failure'))
  }, 1000)
})

// Consume a Promise
promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
```

## Async/Await

### Syntax

```javascript
async function fetchData() {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
```

## Implementation in Fisheye

### API Class with async/await

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

class PhotographerApi extends Api {
  constructor() {
    super('./data/photographers.json')
  }

  async getPhotographers() {
    const data = await this.get()
    return data
  }
}
```

### Application Initialization

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
class App {
  constructor() {
    this.photographersApi = new PhotographerApi()
    this.$photographerSection = document.querySelector('.photographer_section')
  }

  async main() {
    const data = await this.photographersApi.getPhotographers()

    if (!data) {
      console.error('Unable to load data')
      return
    }

    const photographers = new PhotographersFactory(data, 'photographers')
    this._displayPhotographers(photographers)
  }
}

// Entry point
const app = new App()
app.main()
```

### Lazy Image Loading

**File**: [scripts/utils/LazyLoader.js](../../scripts/utils/LazyLoader.js)

```javascript
class LazyLoader {
  async _loadImage(img) {
    const src = img.dataset.src
    if (!src) return

    return new Promise((resolve, reject) => {
      const tempImage = new Image()

      tempImage.onload = () => {
        img.src = src
        img.removeAttribute('data-src')
        img.classList.add('loaded')
        resolve()
      }

      tempImage.onerror = () => {
        img.classList.add('error')
        reject(new Error(`Failed to load: ${src}`))
      }

      tempImage.src = src
    })
  }
}
```

### Sharing with the Share API

**File**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
class ShareButton {
  async _share() {
    const { title, text, url } = this._getShareData()

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else {
        await navigator.clipboard.writeText(url)
        this._showFeedback('Link copied!')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error)
      }
    }
  }
}
```

## Promise.all / Promise.allSettled

### Promise.all

Waits for all Promises to resolve. Fails if any single one fails.

```javascript
async function loadAllData() {
  const [photographers, media] = await Promise.all([
    fetchPhotographers(),
    fetchMedia()
  ])

  return { photographers, media }
}
```

### Promise.allSettled

Waits for all Promises, without failing if some are rejected.

**File**: [scripts/utils/ParallelLoader.js](../../scripts/utils/ParallelLoader.js)

```javascript
class ParallelLoader {
  async loadAll(urls) {
    const promises = urls.map(url =>
      fetch(url)
        .then(res => res.json())
        .catch(err => ({ error: err, url }))
    )

    const results = await Promise.allSettled(promises)

    return results.map((result, i) => ({
      url: urls[i],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}
```

## Error Handling

### try/catch Pattern

```javascript
async function safeFetch(url) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error:', error.message)
    return null  // Default value
  }
}
```

### Fallback Pattern

**File**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
async copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  }
}
```

## Common Patterns

### 1. Sequential Operations

```javascript
async function processPhotographer(id) {
  const photographer = await fetchPhotographer(id)
  const media = await fetchMedia(photographer.id)
  const stats = await calculateStats(media)
  return { photographer, media, stats }
}
```

### 2. Parallel Operations

```javascript
async function loadDashboard() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ])

  return { users, posts, comments }
}
```

### 3. Retry Pattern

```javascript
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

### 4. Timeout

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
```

## Use Cases in the Project

| Pattern | File | Usage |
|---------|------|-------|
| Fetch API | Api.js | Loading JSON data |
| Try/catch | App.js, Api.js | Error handling |
| Promise constructor | LazyLoader.js | Image loading |
| navigator.share | ShareButton.js | Native sharing |
| navigator.clipboard | UrlStateManager.js | Copy to clipboard |

## Common Mistakes

### 1. Forgetting await

```javascript
// Bad - returns a Promise, not the data
function getData() {
  return fetch(url).then(r => r.json())
}
const data = getData()  // data is a Promise!

// Good
async function getData() {
  return await fetch(url).then(r => r.json())
}
const data = await getData()
```

### 2. await in a loop (sequential instead of parallel)

```javascript
// Slow - sequential
for (const id of ids) {
  const data = await fetchData(id)  // Waits for each request
}

// Fast - parallel
const results = await Promise.all(
  ids.map(id => fetchData(id))
)
```

## Practical Exercise

Create a function that loads a photographer's data with their media:

```javascript
async function loadPhotographerWithMedia(photographerId) {
  try {
    // Load in parallel
    const [photographerData, allMedia] = await Promise.all([
      fetch('./data/photographers.json').then(r => r.json()),
      fetch('./data/media.json').then(r => r.json())
    ])

    // Find the photographer
    const photographer = photographerData.photographers.find(
      p => p.id === photographerId
    )

    if (!photographer) {
      throw new Error('Photographer not found')
    }

    // Filter their media
    const media = allMedia.filter(m => m.photographerId === photographerId)

    return { photographer, media }
  } catch (error) {
    console.error('Loading error:', error)
    return null
  }
}
```
