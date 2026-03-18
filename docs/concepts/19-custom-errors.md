# Classes d'erreurs personnalisées

## Concept

Les **Custom Error Classes** permettent de créer des types d'erreurs spécifiques pour mieux les identifier et les gérer. En héritant de `Error`, on peut ajouter des propriétés spécifiques à chaque type d'erreur.

## Cas d'utilisation

- Distinguer les erreurs réseau des erreurs de validation
- Ajouter des informations contextuelles (code HTTP, champ invalide, etc.)
- Permettre une gestion différenciée selon le type d'erreur
- Améliorer le debugging avec des messages descriptifs

## Syntaxe de base

```javascript
class CustomError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CustomError'

    // Capturer la stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
```

## Implémentation dans Fisheye

### Fichier: `scripts/utils/CustomErrors.js`

```javascript
// Classe de base pour toutes les erreurs de l'app
class AppError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'AppError'
    this.code = options.code || 'APP_ERROR'
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp
    }
  }
}

// Erreur réseau
class NetworkError extends AppError {
  constructor(message, options = {}) {
    super(message, { code: 'NETWORK_ERROR', ...options })
    this.name = 'NetworkError'
    this.statusCode = options.statusCode || null
    this.url = options.url || null
  }

  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  isServerError() {
    return this.statusCode >= 500
  }

  getUserMessage() {
    if (this.statusCode === 404) return 'Ressource introuvable.'
    if (this.isServerError()) return 'Erreur serveur. Réessayez plus tard.'
    return 'Erreur de connexion.'
  }
}

// Erreur de validation
class ValidationError extends AppError {
  constructor(message, options = {}) {
    super(message, { code: 'VALIDATION_ERROR', ...options })
    this.name = 'ValidationError'
    this.field = options.field || null
    this.value = options.value
  }
}

// Ressource non trouvée
class NotFoundError extends AppError {
  constructor(resourceType, identifier) {
    super(`${resourceType} "${identifier}" introuvable.`, { code: 'NOT_FOUND' })
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.identifier = identifier
  }
}
```

## Utilisation

```javascript
// Lancer une erreur typée
async function fetchPhotographer(id) {
  const response = await fetch(`/api/photographers/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError('Photographe', id)
    }
    throw new NetworkError('Erreur lors du chargement', {
      statusCode: response.status,
      url: response.url
    })
  }

  return response.json()
}

// Gérer différemment selon le type
try {
  const photographer = await fetchPhotographer(999)
} catch (error) {
  if (error instanceof NotFoundError) {
    showMessage(`${error.resourceType} non trouvé`)
  } else if (error instanceof NetworkError) {
    showMessage(error.getUserMessage())
  } else {
    showMessage('Erreur inattendue')
  }
}
```

## Chaînage d'erreurs (ES2022)

```javascript
try {
  await fetchData()
} catch (originalError) {
  throw new AppError('Impossible de charger les données', {
    cause: originalError  // Préserve l'erreur originale
  })
}
```

## ErrorHandler centralisé

```javascript
class ErrorHandler {
  static getDisplayMessage(error) {
    if (error instanceof NetworkError) {
      return error.getUserMessage()
    }
    if (error instanceof ValidationError) {
      return `${error.field}: ${error.message}`
    }
    if (error instanceof NotFoundError) {
      return `${error.resourceType} introuvable.`
    }
    return 'Une erreur est survenue.'
  }

  static isRetryable(error) {
    if (error instanceof NetworkError) {
      return error.isServerError()
    }
    return false
  }
}
```

## Avantages

1. **Identification précise** : `instanceof` pour distinguer les types
2. **Contexte riche** : Propriétés spécifiques à chaque type d'erreur
3. **UX améliorée** : Messages utilisateur adaptés
4. **Debugging facilité** : Stack trace préservée, infos supplémentaires

## Bonnes pratiques

- Hériter de `Error` (ou d'une classe qui hérite de `Error`)
- Définir `this.name` avec le nom de la classe
- Capturer la stack trace avec `Error.captureStackTrace`
- Utiliser `instanceof` pour les vérifications de type
- Fournir des méthodes utilitaires (`getUserMessage`, `isRetryable`)

## Voir aussi

- [Error Handling](09-error-handling.md)
- [MDN - Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
