# Gestion des erreurs (Error Handling)

## Concept

Une bonne gestion des erreurs rend l'application robuste et offre une meilleure expérience utilisateur en cas de problème.

---

## try/catch/finally

### Syntaxe de base

```javascript
try {
  // Code qui peut échouer
  riskyOperation()
} catch (error) {
  // Gestion de l'erreur
  console.error('Erreur:', error.message)
} finally {
  // Toujours exécuté
  cleanup()
}
```

### Implémentation dans Fisheye

**Fichier**: [scripts/api/Api.js](../../scripts/api/Api.js)

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
      console.error('Erreur API:', error)
      return null  // Valeur par défaut
    }
  }
}
```

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  _load() {
    try {
      const data = localStorage.getItem(this._storageKey)
      const parsed = data ? JSON.parse(data) : []

      // Validation des données
      if (!Array.isArray(parsed)) {
        console.warn('Données de favoris invalides, réinitialisation')
        return []
      }

      return parsed
    } catch (error) {
      console.error('Erreur de chargement des favoris:', error)
      return []
    }
  }

  _save() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._favorites))
    } catch (error) {
      // localStorage peut être plein ou désactivé
      console.error('Erreur de sauvegarde:', error)
    }
  }
}
```

---

## Erreurs dans les Promises

### Promise.catch()

```javascript
fetchData()
  .then(data => processData(data))
  .catch(error => {
    console.error('Erreur:', error)
    return defaultValue
  })
```

### async/await avec try/catch

```javascript
async function loadData() {
  try {
    const data = await fetchData()
    return processData(data)
  } catch (error) {
    console.error('Erreur:', error)
    return defaultValue
  }
}
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

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

  // Supprimer du cache si la promise échoue
  promise.catch(() => {
    this._cache.delete(key)
  })

  return promise
}
```

---

## Throw et Error personnalisé

### Lancer une erreur

```javascript
function validateEmail(email) {
  if (!email.includes('@')) {
    throw new Error('Email invalide')
  }
}
```

### Implémentation dans Fisheye

**Fichier**: [scripts/factories/MediaFactory.js](../../scripts/factories/MediaFactory.js)

```javascript
class MediaFactory {
  constructor(data, photographerId) {
    if (data.image) {
      return new CreateImageCard(data, photographerId)
    } else if (data.video) {
      return new CreateVideoCard(data, photographerId)
    }

    // Type inconnu - erreur explicite
    throw new Error(`Type de média inconnu: ${JSON.stringify(data)}`)
  }
}
```

### Classes d'erreur personnalisées

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
    throw new ValidationError('email', 'Email requis')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new NetworkError('Erreur serveur', response.status)
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

Fournir une expérience dégradée mais fonctionnelle.

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
async _share() {
  const shareData = this._getShareData()

  try {
    // Essayer l'API native
    if (navigator.share) {
      await navigator.share(shareData)
      this._showFeedback('Partagé!')
      return
    }

    // Fallback: copier dans le presse-papier
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url)
      this._showFeedback('Lien copié!')
      return
    }

    // Dernier recours: méthode obsolète
    this._fallbackCopy(shareData.url)
    this._showFeedback('Lien copié!')

  } catch (error) {
    // L'utilisateur a annulé
    if (error.name === 'AbortError') {
      return
    }

    // Erreur réelle
    console.error('Erreur de partage:', error)
    this._showFeedback('Erreur de partage')
  }
}
```

**Fichier**: [scripts/utils/LazyLoader.js](../../scripts/utils/LazyLoader.js)

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
    // Image de fallback ou style d'erreur
    img.classList.add('error')
    img.alt = 'Image non disponible'
    console.warn(`Impossible de charger: ${src}`)
  }
}
```

---

## Validation des données

### Avant traitement

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
async main() {
  const data = await this.photographersApi.getPhotographers()

  // Validation
  if (!data) {
    console.error('Impossible de charger les données')
    this._showError('Erreur de chargement')
    return
  }

  if (!data.photographers || !Array.isArray(data.photographers)) {
    console.error('Format de données invalide')
    this._showError('Données corrompues')
    return
  }

  // Traitement normal
  this._allPhotographers = new PhotographersFactory(data, 'photographers')
  this._displayPhotographers(this._allPhotographers)
}
```

### Pattern de validation

```javascript
function validatePhotographer(data) {
  const errors = []

  if (!data.id) {
    errors.push('ID manquant')
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Nom invalide')
  }

  if (typeof data.price !== 'number' || data.price < 0) {
    errors.push('Prix invalide')
  }

  if (errors.length > 0) {
    throw new ValidationError('photographer', errors.join(', '))
  }

  return data
}
```

---

## Logging structuré

### Niveaux de log

```javascript
console.log('Info normale')
console.info('Information')
console.warn('Avertissement')
console.error('Erreur')
console.debug('Debug (caché par défaut)')
```

### Pattern de logging

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
  Logger.error('Échec de l\'opération', error)
}
```

---

## Bonnes pratiques

### 1. Ne jamais ignorer les erreurs

```javascript
// Mauvais
try {
  riskyOperation()
} catch (e) {
  // Silence...
}

// Bon
try {
  riskyOperation()
} catch (error) {
  console.error('Opération échouée:', error)
  // Ou notifier l'utilisateur
}
```

### 2. Être spécifique dans les messages

```javascript
// Mauvais
throw new Error('Erreur')

// Bon
throw new Error(`Impossible de charger le photographe ${id}: ${response.status}`)
```

### 3. Toujours retourner une valeur par défaut

```javascript
async function loadData() {
  try {
    return await fetchData()
  } catch (error) {
    console.error('Erreur:', error)
    return []  // Valeur par défaut
  }
}
```

### 4. Nettoyer les ressources dans finally

```javascript
async function processFile() {
  let file = null
  try {
    file = await openFile()
    return await process(file)
  } catch (error) {
    console.error('Erreur:', error)
    throw error
  } finally {
    if (file) {
      await file.close()
    }
  }
}
```

---

## Exercice pratique

Créer un wrapper d'API avec gestion d'erreurs complète :

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
          `Erreur HTTP: ${response.statusText}`,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }

      // Erreur réseau (offline, timeout, etc.)
      throw new NetworkError(
        `Erreur réseau: ${error.message}`,
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

// Usage avec gestion d'erreurs
const api = new ApiClient('/api')

try {
  const photographers = await api.get('/photographers')
  displayPhotographers(photographers)
} catch (error) {
  if (error instanceof NetworkError) {
    if (error.statusCode === 404) {
      showMessage('Données non trouvées')
    } else if (error.statusCode >= 500) {
      showMessage('Erreur serveur, réessayez plus tard')
    } else if (error.statusCode === 0) {
      showMessage('Vérifiez votre connexion internet')
    }
  } else {
    showMessage('Une erreur inattendue est survenue')
    console.error('Erreur:', error)
  }
}
```
