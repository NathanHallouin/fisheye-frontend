# Web Workers

## Concept

Les **Web Workers** permettent d'exécuter du JavaScript dans un thread séparé du thread principal (UI). Cela évite de bloquer l'interface utilisateur lors de calculs lourds.

## Caractéristiques

- Exécution dans un thread séparé
- Communication par messages (`postMessage` / `onmessage`)
- Pas d'accès au DOM
- Les données sont copiées, pas partagées (sauf SharedArrayBuffer)

## Cas d'utilisation

- Tri et filtrage de grandes quantités de données
- Calculs mathématiques complexes
- Parsing de fichiers volumineux
- Compression/décompression de données

## Syntaxe de base

### Thread principal (main.js)

```javascript
// Créer un worker
const worker = new Worker('worker.js')

// Envoyer des données au worker
worker.postMessage({ data: largeArray, sortBy: 'likes' })

// Recevoir les résultats
worker.onmessage = (e) => {
  const sortedData = e.data
  renderUI(sortedData)
}

// Gérer les erreurs
worker.onerror = (e) => {
  console.error('Erreur worker:', e.message)
}

// Terminer le worker
worker.terminate()
```

### Worker (worker.js)

```javascript
// Écouter les messages du thread principal
self.onmessage = (e) => {
  const { data, sortBy } = e.data

  // Effectuer le calcul
  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy])

  // Renvoyer le résultat
  self.postMessage(sorted)
}
```

## Implémentation dans Fisheye

### Fichier: `scripts/workers/sortWorker.js`

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
        throw new Error(`Type inconnu: ${type}`)
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

### Fichier: `scripts/utils/WorkerManager.js`

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

  // API basée sur Promises
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

// Utilisation
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
      console.warn('Web Workers non supportés, fallback synchrone')
      return null
    }
    return new WorkerManager('./scripts/workers/sortWorker.js')
  }
}

// Utilisation avec fallback
async function sortMedia(data, sortBy) {
  const worker = SortWorker.getInstance()

  if (worker) {
    return await worker.sort(data, sortBy)
  }

  // Fallback synchrone
  return [...data].sort((a, b) => b[sortBy] - a[sortBy])
}
```

## Limitations

1. **Pas d'accès au DOM** : Impossible de manipuler le document
2. **Pas de window** : Certaines APIs ne sont pas disponibles
3. **Données copiées** : La communication a un coût (sérialisation)
4. **Overhead** : Créer un worker a un coût, réutiliser si possible

## Optimisations

### Transferable Objects

```javascript
// Transférer au lieu de copier (plus rapide pour les gros buffers)
const buffer = new ArrayBuffer(1024 * 1024)
worker.postMessage({ buffer }, [buffer])
// buffer n'est plus utilisable dans le thread principal
```

### Pool de Workers

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

## Avantages

1. **UI réactive** : Les calculs lourds ne bloquent pas l'interface
2. **Parallelisme** : Utilisation de plusieurs cœurs CPU
3. **Isolation** : Le code du worker ne peut pas affecter le thread principal

## Voir aussi

- [MDN - Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Promises](03-promises-async-await.md)
