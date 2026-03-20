# Web Workers

## Concept

**Web Workers** allow executing JavaScript in a thread separate from the main (UI) thread. This prevents blocking the user interface during heavy computations.

## Characteristics

- Execution in a separate thread
- Communication via messages (`postMessage` / `onmessage`)
- No DOM access
- Data is copied, not shared (except SharedArrayBuffer)

## Use Cases

- Sorting and filtering large amounts of data
- Complex mathematical calculations
- Parsing large files
- Data compression/decompression

## Basic Syntax

### Main thread (main.js)

```javascript
// Create a worker
const worker = new Worker('worker.js')

// Send data to the worker
worker.postMessage({ data: largeArray, sortBy: 'likes' })

// Receive results
worker.onmessage = (e) => {
  const sortedData = e.data
  renderUI(sortedData)
}

// Handle errors
worker.onerror = (e) => {
  console.error('Worker error:', e.message)
}

// Terminate the worker
worker.terminate()
```

### Worker (worker.js)

```javascript
// Listen for messages from the main thread
self.onmessage = (e) => {
  const { data, sortBy } = e.data

  // Perform the computation
  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy])

  // Send back the result
  self.postMessage(sorted)
}
```

## Implementation in Fisheye

### File: `scripts/workers/sortWorker.js`

```javascript
self.onmessage = function(e) {
  const { type, payload, id } = e.data

  try {
    let result

    switch (type) {
      case 'SORT':
        result = sortData(payload.data, payload.sortBy, payload.order)
        break
      case 'FILTER':
        result = filterData(payload.data, payload.filters)
        break
      case 'SEARCH':
        result = searchData(payload.data, payload.query, payload.fields)
        break
      default:
        throw new Error(`Unknown type: ${type}`)
    }

    self.postMessage({ type: 'SUCCESS', id, result })
  } catch (error) {
    self.postMessage({ type: 'ERROR', id, error: error.message })
  }
}

function sortData(data, sortBy, order = 'desc') {
  return [...data].sort((a, b) => {
    const comparison = a[sortBy] > b[sortBy] ? 1 : -1
    return order === 'asc' ? comparison : -comparison
  })
}
```

### File: `scripts/utils/WorkerManager.js`

```javascript
class WorkerManager {
  constructor(workerPath) {
    this._worker = new Worker(workerPath)
    this._pending = new Map()
    this._idCounter = 0

    this._worker.onmessage = (e) => this._handleMessage(e)
  }

  _handleMessage(e) {
    const { type, id, result, error } = e.data
    const pending = this._pending.get(id)

    if (!pending) return

    this._pending.delete(id)

    if (type === 'SUCCESS') {
      pending.resolve(result)
    } else {
      pending.reject(new Error(error))
    }
  }

  // Promise-based API
  sort(data, sortBy, order = 'desc') {
    return new Promise((resolve, reject) => {
      const id = `req_${++this._idCounter}`

      this._pending.set(id, { resolve, reject })

      this._worker.postMessage({
        type: 'SORT',
        id,
        payload: { data, sortBy, order }
      })
    })
  }
}

// Usage
const workerManager = new WorkerManager('./scripts/workers/sortWorker.js')

const sortedMedia = await workerManager.sort(media, 'likes', 'desc')
```

## Feature Detection

```javascript
class SortWorker {
  static isSupported() {
    return typeof Worker !== 'undefined'
  }

  static getInstance() {
    if (!SortWorker.isSupported()) {
      console.warn('Web Workers not supported, synchronous fallback')
      return null
    }
    return new WorkerManager('./scripts/workers/sortWorker.js')
  }
}

// Usage with fallback
async function sortMedia(data, sortBy) {
  const worker = SortWorker.getInstance()

  if (worker) {
    return await worker.sort(data, sortBy)
  }

  // Synchronous fallback
  return [...data].sort((a, b) => b[sortBy] - a[sortBy])
}
```

## Limitations

1. **No DOM access**: Cannot manipulate the document
2. **No window**: Some APIs are not available
3. **Data copied**: Communication has a cost (serialization)
4. **Overhead**: Creating a worker has a cost, reuse if possible

## Optimizations

### Transferable Objects

```javascript
// Transfer instead of copy (faster for large buffers)
const buffer = new ArrayBuffer(1024 * 1024)
worker.postMessage({ buffer }, [buffer])
// buffer is no longer usable in the main thread
```

### Worker Pool

```javascript
class WorkerPool {
  constructor(workerPath, poolSize = 4) {
    this._workers = Array.from(
      { length: poolSize },
      () => new Worker(workerPath)
    )
    this._available = [...this._workers]
    this._queue = []
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      if (this._available.length > 0) {
        this._runTask(this._available.pop(), task, resolve, reject)
      } else {
        this._queue.push({ task, resolve, reject })
      }
    })
  }
}
```

## Advantages

1. **Responsive UI**: Heavy computations don't block the interface
2. **Parallelism**: Utilization of multiple CPU cores
3. **Isolation**: Worker code cannot affect the main thread

## See Also

- [MDN - Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Promises](03-promises-async-await.md)
