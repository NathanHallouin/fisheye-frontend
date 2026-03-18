# Browser APIs (APIs du navigateur)

## Concept

Les Browser APIs sont des interfaces fournies par le navigateur pour interagir avec le système, l'URL, le stockage et d'autres fonctionnalités natives.

---

## Fetch API

L'API Fetch permet d'effectuer des requêtes HTTP.

### Syntaxe de base

```javascript
const response = await fetch(url, options)
const data = await response.json()
```

### Implémentation dans Fisheye

**Fichier**: [scripts/api/Api.js](../../scripts/api/Api.js)

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
      console.error('Erreur API:', error)
      return null
    }
  }
}
```

---

## History API

L'API History permet de manipuler l'historique du navigateur sans rechargement de page.

### Méthodes principales

```javascript
// Ajouter une entrée
history.pushState(state, title, url)

// Remplacer l'entrée actuelle
history.replaceState(state, title, url)

// Navigation
history.back()
history.forward()
history.go(-2)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

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

Permet de manipuler les paramètres de l'URL.

### Syntaxe

```javascript
const params = new URLSearchParams(window.location.search)

// Lecture
params.get('q')         // Valeur d'un paramètre
params.has('q')         // Vérifie l'existence
params.getAll('tags')   // Toutes les valeurs d'un paramètre

// Modification
params.set('q', 'value')
params.append('tag', 'portrait')
params.delete('sort')

// Conversion en string
params.toString()  // 'q=value&tag=portrait'
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

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

Stockage persistant côté client (survit à la fermeture du navigateur).

### Syntaxe

```javascript
// Stockage
localStorage.setItem('key', 'value')

// Lecture
const value = localStorage.getItem('key')

// Suppression
localStorage.removeItem('key')
localStorage.clear()  // Tout effacer
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

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
      console.error('Erreur de chargement des favoris:', error)
      return []
    }
  }

  _save() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._favorites))
    } catch (error) {
      console.error('Erreur de sauvegarde des favoris:', error)
    }
  }
}
```

**Fichier**: [scripts/templates/PhotographerMediaCard.js](../../scripts/templates/PhotographerMediaCard.js)

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

Observe quand un élément entre/sort du viewport.

### Syntaxe

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // L'élément est visible
      }
    })
  },
  {
    root: null,           // Viewport par défaut
    rootMargin: '100px',  // Marge autour du root
    threshold: 0.1        // 10% visible pour déclencher
  }
)

observer.observe(element)
observer.unobserve(element)
observer.disconnect()
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/LazyLoader.js](../../scripts/utils/LazyLoader.js)

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
        rootMargin: '200px',  // Précharger 200px avant
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
      // Précharger l'image
      await new Promise((resolve, reject) => {
        const tempImage = new Image()
        tempImage.onload = resolve
        tempImage.onerror = reject
        tempImage.src = src
      })

      // Appliquer quand chargée
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

Permet de copier/coller dans le presse-papier.

### Syntaxe

```javascript
// Écrire
await navigator.clipboard.writeText('Texte à copier')

// Lire
const text = await navigator.clipboard.readText()
```

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
async _copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback pour navigateurs anciens
    return this._fallbackCopy(text)
  } catch (error) {
    console.error('Erreur de copie:', error)
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

Permet de partager du contenu via les apps natives.

### Syntaxe

```javascript
if (navigator.share) {
  await navigator.share({
    title: 'Titre',
    text: 'Description',
    url: 'https://example.com'
  })
}
```

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
class ShareButton {
  async _share() {
    const shareData = this._getShareData()

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        this._showFeedback('Partagé!')
      } else {
        // Fallback: copier le lien
        await this._copyToClipboard(shareData.url)
        this._showFeedback('Lien copié!')
      }
    } catch (error) {
      // L'utilisateur a annulé le partage
      if (error.name !== 'AbortError') {
        console.error('Erreur de partage:', error)
      }
    }
  }

  _getShareData() {
    return {
      title: `${this._photographerName} - Fisheye`,
      text: `Découvrez le portfolio de ${this._photographerName}`,
      url: window.location.href
    }
  }
}
```

---

## Récapitulatif

| API | Usage | Support |
|-----|-------|---------|
| **Fetch** | Requêtes HTTP | Tous navigateurs modernes |
| **History** | Navigation SPA | Tous navigateurs modernes |
| **URLSearchParams** | Paramètres URL | Tous navigateurs modernes |
| **localStorage** | Stockage persistant | Tous navigateurs |
| **IntersectionObserver** | Lazy loading | IE non supporté |
| **Clipboard** | Copier/coller | Nécessite HTTPS |
| **Web Share** | Partage natif | Mobile principalement |

---

## Feature Detection

Toujours vérifier si une API est disponible avant de l'utiliser.

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
  // Charger les images immédiatement
}
```

---

## Exercice pratique

Créer un gestionnaire de thème avec localStorage :

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

    // Détecter la préférence système
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
