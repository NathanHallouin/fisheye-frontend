# Performance et Optimisation

## Concept

L'optimisation des performances améliore l'expérience utilisateur en réduisant les temps de chargement et en rendant l'interface plus réactive.

---

## Debounce

Retarde l'exécution d'une fonction jusqu'à ce que l'utilisateur arrête de déclencher l'événement.

### Concept

```
Sans debounce:  ─┬─┬─┬─┬─┬─┬─┬─┬─┬─> Appels à chaque frappe
Avec debounce:  ─┬─┬─┬─┬─┬─┬─┬─┬─┬─────────> Un seul appel après 300ms
                                   └─ délai ─┘
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
/**
 * Crée une version debounced d'une fonction.
 * @param {Function} fn - Fonction à débouncer
 * @param {number} delay - Délai en millisecondes
 * @returns {Function} Fonction debounced
 */
export function debounce(fn, delay) {
  let timeoutId

  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

### Utilisation

**Fichier**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
class SearchBar {
  constructor(photographers, onSearch) {
    this._photographers = photographers
    this._onSearch = onSearch
    this._debouncedSearch = debounce(this._search.bind(this), 300)
  }

  _addEventListeners() {
    this.$input.addEventListener('input', (e) => {
      this._debouncedSearch(e.target.value)
    })
  }

  _search(query) {
    const filtered = this._photographers.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    )
    this._onSearch(filtered)
  }
}
```

### Cas d'usage

- Recherche en temps réel
- Redimensionnement de fenêtre
- Sauvegarde automatique

---

## Throttle

Limite le nombre d'appels d'une fonction sur une période donnée.

### Concept

```
Sans throttle:   ─┬─┬─┬─┬─┬─┬─┬─┬─┬─> Tous les appels
Avec throttle:   ─┬───────┬───────┬─> Un appel tous les 100ms
                  └─100ms─┘       │
```

### Implémentation

```javascript
/**
 * Crée une version throttled d'une fonction.
 * @param {Function} fn - Fonction à throttler
 * @param {number} limit - Intervalle minimum en ms
 * @returns {Function} Fonction throttled
 */
function throttle(fn, limit) {
  let inThrottle = false

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Usage
const throttledScroll = throttle(handleScroll, 100)
window.addEventListener('scroll', throttledScroll)
```

### Debounce vs Throttle

| Aspect | Debounce | Throttle |
|--------|----------|----------|
| Timing | Après le dernier appel | À intervalles réguliers |
| Usage | Recherche, resize | Scroll, drag |
| Garantie | Un appel après pause | Un appel par intervalle |

---

## Lazy Loading

Charge les ressources seulement quand elles sont nécessaires.

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
      element.classList.add('lazy')
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
      // Précharger en mémoire
      await this._preload(src)

      // Appliquer quand prêt
      img.src = src
      img.removeAttribute('data-src')
      img.classList.remove('lazy')
      img.classList.add('loaded')
    } catch (error) {
      img.classList.add('error')
      console.error(`Erreur de chargement: ${src}`)
    }
  }

  _preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = src
    })
  }
}
```

### Usage dans les templates

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
createCard() {
  const img = document.createElement('img')
  img.dataset.src = this._photographer.portrait  // data-src au lieu de src
  img.alt = `Portrait de ${this._photographer.name}`
  img.classList.add('user-card__portrait')

  // Enregistrer pour lazy loading
  const lazyLoader = LazyLoader.getInstance()
  lazyLoader.observe(img)

  return article
}
```

---

## Caching

Évite les requêtes redondantes en stockant les résultats.

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
class CacheManager {
  static _instance = null

  static getInstance(ttl = 300000) {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager(ttl)
    }
    return CacheManager._instance
  }

  constructor(ttl = 300000) {
    this._cache = new Map()
    this._ttl = ttl  // Time To Live: 5 minutes

    // Nettoyage périodique
    setInterval(() => this._cleanup(), 60000)
  }

  async get(key, fetchFn, ttl = this._ttl) {
    const cached = this._cache.get(key)

    // Retourner le cache si valide
    if (cached && this._isValid(cached, ttl)) {
      return cached.promise
    }

    // Sinon, fetch et cache
    const promise = fetchFn()
    this._cache.set(key, {
      promise,
      timestamp: Date.now(),
      ttl
    })

    // Gérer les erreurs
    promise.catch(() => {
      this._cache.delete(key)
    })

    return promise
  }

  _isValid(entry, ttl) {
    return Date.now() - entry.timestamp < ttl
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, entry] of this._cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this._cache.delete(key)
      }
    }
  }

  invalidate(key) {
    this._cache.delete(key)
  }

  clear() {
    this._cache.clear()
  }
}
```

### Memoization

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
/**
 * Décore une fonction avec du caching automatique.
 * @param {Function} fn - Fonction à memoizer
 * @param {Function} keyGenerator - Générateur de clé
 * @param {number} ttl - Durée de vie
 * @returns {Function} Fonction memoized
 */
memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
  return async (...args) => {
    const key = keyGenerator(...args)
    return this.get(key, () => fn(...args), ttl)
  }
}

// Usage
const cache = CacheManager.getInstance()
const fetchPhotographer = cache.memoize(
  (id) => fetch(`/api/photographers/${id}`).then(r => r.json()),
  (id) => `photographer:${id}`,
  60000  // Cache 1 minute
)
```

---

## Event Delegation

Un seul listener pour gérer de nombreux éléments.

### Problème

```javascript
// Mauvais - N listeners
cards.forEach(card => {
  card.addEventListener('click', handleClick)
})
```

### Solution

```javascript
// Bon - 1 listener
container.addEventListener('click', (e) => {
  const card = e.target.closest('.card')
  if (card) handleClick(card)
})
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/LikeManager.js](../../scripts/utils/LikeManager.js)

```javascript
class LikeManager {
  constructor($container) {
    this.$container = $container
    // Un seul listener pour tous les boutons
    this.$container.addEventListener('click', (e) => this._handleClick(e))
  }

  _handleClick(e) {
    const $likeBtn = e.target.closest('[data-like-id]')
    if (!$likeBtn) return

    const mediaId = parseInt($likeBtn.dataset.likeId, 10)
    this._toggleLike(mediaId, $likeBtn)
  }
}
```

---

## DocumentFragment

Réduit les reflows en groupant les modifications DOM.

### Problème

```javascript
// Mauvais - N reflows
items.forEach(item => {
  container.appendChild(createCard(item))  // Reflow à chaque ajout
})
```

### Solution

```javascript
// Bon - 1 reflow
const fragment = document.createDocumentFragment()
items.forEach(item => {
  fragment.appendChild(createCard(item))
})
container.appendChild(fragment)  // Un seul reflow
```

### Alternative avec innerHTML

```javascript
// Vider puis remplir - 1 reflow
container.innerHTML = ''
items.forEach(item => {
  container.appendChild(createCard(item))
})
```

---

## Récapitulatif des techniques

| Technique | Problème résolu | Fichier |
|-----------|-----------------|---------|
| Debounce | Trop d'appels sur input | debounce.js |
| Throttle | Trop d'appels sur scroll | - |
| Lazy loading | Chargement initial lent | LazyLoader.js |
| Caching | Requêtes redondantes | CacheManager.js |
| Memoization | Calculs répétés | CacheManager.js |
| Event delegation | Trop de listeners | LikeManager.js |
| DocumentFragment | Trop de reflows | - |

---

## Mesurer les performances

### Console timing

```javascript
console.time('operation')
// ... code
console.timeEnd('operation')  // operation: 45.123ms
```

### Performance API

```javascript
const start = performance.now()
// ... code
const duration = performance.now() - start
console.log(`Durée: ${duration}ms`)
```

---

## Exercice pratique

Créer un gestionnaire de scroll avec throttle et lazy loading :

```javascript
class ScrollManager {
  constructor() {
    this._lazyLoader = LazyLoader.getInstance()
    this._throttledCheck = this._throttle(this._checkImages.bind(this), 100)

    window.addEventListener('scroll', this._throttledCheck)
  }

  _throttle(fn, limit) {
    let inThrottle = false
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  _checkImages() {
    const images = document.querySelectorAll('img[data-src]:not(.loaded)')
    images.forEach(img => {
      if (this._isInViewport(img)) {
        this._lazyLoader.observe(img)
      }
    })
  }

  _isInViewport(element) {
    const rect = element.getBoundingClientRect()
    return (
      rect.top < window.innerHeight + 200 &&
      rect.bottom > -200
    )
  }

  destroy() {
    window.removeEventListener('scroll', this._throttledCheck)
  }
}
```
