# Async/Await et Promises

## Concept

`async/await` est une syntaxe moderne pour gérer le code asynchrone en JavaScript. Elle repose sur les Promises et rend le code asynchrone plus lisible.

## Les Promises

Une Promise représente une valeur qui sera disponible dans le futur.

### États d'une Promise

1. **Pending** - En attente
2. **Fulfilled** - Résolue avec succès
3. **Rejected** - Rejetée avec une erreur

### Syntaxe de base

```javascript
// Créer une Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Succès!')
    // ou reject(new Error('Échec'))
  }, 1000)
})

// Consommer une Promise
promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
```

## Async/Await

### Syntaxe

```javascript
async function fetchData() {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erreur:', error)
    return null
  }
}
```

## Implémentation dans Fisheye

### Classe API avec async/await

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

### Initialisation de l'application

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
class App {
  constructor() {
    this.photographersApi = new PhotographerApi()
    this.$photographerSection = document.querySelector('.photographer_section')
  }

  async main() {
    const data = await this.photographersApi.getPhotographers()

    if (!data) {
      console.error('Impossible de charger les données')
      return
    }

    const photographers = new PhotographersFactory(data, 'photographers')
    this._displayPhotographers(photographers)
  }
}

// Point d'entrée
const app = new App()
app.main()
```

### Chargement paresseux d'images

**Fichier**: [scripts/utils/LazyLoader.js](../../scripts/utils/LazyLoader.js)

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

### Partage avec l'API Share

**Fichier**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
class ShareButton {
  async _share() {
    const { title, text, url } = this._getShareData()

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else {
        await navigator.clipboard.writeText(url)
        this._showFeedback('Lien copié!')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erreur de partage:', error)
      }
    }
  }
}
```

## Promise.all / Promise.allSettled

### Promise.all

Attend que toutes les Promises soient résolues. Échoue si une seule échoue.

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

Attend toutes les Promises, sans échouer si certaines sont rejetées.

**Fichier**: [scripts/utils/ParallelLoader.js](../../scripts/utils/ParallelLoader.js)

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

## Gestion des erreurs

### Pattern try/catch

```javascript
async function safeFetch(url) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur:', error.message)
    return null  // Valeur par défaut
  }
}
```

### Pattern avec fallback

**Fichier**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
async copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback pour les navigateurs plus anciens
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

## Patterns courants

### 1. Séquence d'opérations

```javascript
async function processPhotographer(id) {
  const photographer = await fetchPhotographer(id)
  const media = await fetchMedia(photographer.id)
  const stats = await calculateStats(media)
  return { photographer, media, stats }
}
```

### 2. Opérations parallèles

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

### 3. Retry pattern

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

## Cas d'usage dans le projet

| Pattern | Fichier | Usage |
|---------|---------|-------|
| Fetch API | Api.js | Chargement des données JSON |
| Try/catch | App.js, Api.js | Gestion d'erreurs |
| Promise constructor | LazyLoader.js | Chargement d'images |
| navigator.share | ShareButton.js | Partage natif |
| navigator.clipboard | UrlStateManager.js | Copie dans presse-papier |

## Erreurs courantes

### 1. Oublier await

```javascript
// Mauvais - retourne une Promise, pas les données
function getData() {
  return fetch(url).then(r => r.json())
}
const data = getData()  // data est une Promise!

// Bon
async function getData() {
  return await fetch(url).then(r => r.json())
}
const data = await getData()
```

### 2. await dans une boucle (séquentiel au lieu de parallèle)

```javascript
// Lent - séquentiel
for (const id of ids) {
  const data = await fetchData(id)  // Attend chaque requête
}

// Rapide - parallèle
const results = await Promise.all(
  ids.map(id => fetchData(id))
)
```

## Exercice pratique

Créer une fonction qui charge les données d'un photographe avec ses médias :

```javascript
async function loadPhotographerWithMedia(photographerId) {
  try {
    // Charger en parallèle
    const [photographerData, allMedia] = await Promise.all([
      fetch('./data/photographers.json').then(r => r.json()),
      fetch('./data/media.json').then(r => r.json())
    ])

    // Trouver le photographe
    const photographer = photographerData.photographers.find(
      p => p.id === photographerId
    )

    if (!photographer) {
      throw new Error('Photographe non trouvé')
    }

    // Filtrer ses médias
    const media = allMedia.filter(m => m.photographerId === photographerId)

    return { photographer, media }
  } catch (error) {
    console.error('Erreur de chargement:', error)
    return null
  }
}
```
