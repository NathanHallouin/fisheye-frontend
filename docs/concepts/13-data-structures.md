# Structures de données (Data Structures)

## Concept

JavaScript offre plusieurs structures de données pour organiser et manipuler les données efficacement. Chaque structure a ses forces et cas d'usage.

---

## Map

Une collection de paires clé-valeur où les clés peuvent être de n'importe quel type.

### Syntaxe

```javascript
const map = new Map()

// Ajout
map.set('key', 'value')
map.set(123, 'number key')
map.set({ id: 1 }, 'object key')

// Lecture
map.get('key')      // 'value'
map.has('key')      // true
map.size            // 3

// Suppression
map.delete('key')
map.clear()

// Itération
for (const [key, value] of map) {
  console.log(key, value)
}
map.forEach((value, key) => console.log(key, value))
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
class CacheManager {
  constructor(ttl = 300000) {
    this._cache = new Map()
    this._ttl = ttl
  }

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

    return promise
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, entry] of this._cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this._cache.delete(key)
      }
    }
  }

  clear() {
    this._cache.clear()
  }
}
```

**Fichier**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
class EventBus {
  constructor() {
    this._target = new EventTarget()
    this._listeners = new Map()  // callback -> { wrapped, priority }
  }

  on(eventName, callback, options = {}) {
    const { once = false, priority = 0 } = options
    const wrappedCallback = (e) => callback(e.detail)

    this._listeners.set(callback, {
      wrapped: wrappedCallback,
      priority
    })

    this._target.addEventListener(eventName, wrappedCallback, { once })
  }

  off(eventName, callback) {
    const listener = this._listeners.get(callback)
    if (listener) {
      this._target.removeEventListener(eventName, listener.wrapped)
      this._listeners.delete(callback)
    }
  }
}
```

**Fichier**: [scripts/utils/KeyboardShortcutManager.js](../../scripts/utils/KeyboardShortcutManager.js)

```javascript
class KeyboardShortcutManager {
  constructor() {
    this._shortcuts = new Map()  // 'ctrl+k' -> handler
    this._contexts = new Map()   // 'gallery' -> Set of shortcuts
  }

  register(combo, handler, context = 'global') {
    this._shortcuts.set(combo, { handler, context })

    if (!this._contexts.has(context)) {
      this._contexts.set(context, new Set())
    }
    this._contexts.get(context).add(combo)
  }

  _handleKeyDown(e) {
    const combo = this._getKeyCombo(e)
    const shortcut = this._shortcuts.get(combo)

    if (shortcut && this._isContextActive(shortcut.context)) {
      e.preventDefault()
      shortcut.handler(e)
    }
  }
}
```

### Map vs Object

| Aspect | Map | Object |
|--------|-----|--------|
| Types de clés | N'importe quel type | String ou Symbol |
| Ordre | Garanti (insertion) | Non garanti |
| Taille | `.size` | `Object.keys(obj).length` |
| Itération | Directe | Nécessite Object.keys/values |
| Performance | Meilleure pour ajouts/suppressions fréquents | Meilleure pour accès statique |

---

## Set

Une collection de valeurs uniques.

### Syntaxe

```javascript
const set = new Set()

// Ajout
set.add('value')
set.add('value')  // Ignoré (déjà présent)

// Vérification
set.has('value')  // true
set.size          // 1

// Suppression
set.delete('value')
set.clear()

// Itération
for (const value of set) {
  console.log(value)
}

// Conversion
const array = [...set]
const set2 = new Set(array)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

```javascript
class TagFilter {
  constructor(photographers, onFilter) {
    this._photographers = photographers
    this._onFilter = onFilter
    this._activeTags = new Set()  // Tags actuellement sélectionnés
  }

  _getAllTags() {
    // Utiliser Set pour dédupliquer automatiquement
    const allTags = this._photographers.flatMap(p => p.tags)
    return [...new Set(allTags)]
  }

  toggle(tag) {
    if (this._activeTags.has(tag)) {
      this._activeTags.delete(tag)
    } else {
      this._activeTags.add(tag)
    }
    this._applyFilter()
  }

  filter(photographers) {
    if (this._activeTags.size === 0) {
      return photographers
    }

    return photographers.filter(photographer =>
      [...this._activeTags].some(tag => photographer.hasTag(tag))
    )
  }

  reset() {
    this._activeTags.clear()
    this._applyFilter()
  }
}
```

**Fichier**: [scripts/utils/LikeManager.js](../../scripts/utils/LikeManager.js)

```javascript
class LikeManager {
  constructor() {
    this._likedMedia = new Set(this._loadFromStorage())
  }

  toggle(mediaId) {
    if (this._likedMedia.has(mediaId)) {
      this._likedMedia.delete(mediaId)
    } else {
      this._likedMedia.add(mediaId)
    }
    this._save()
  }

  isLiked(mediaId) {
    return this._likedMedia.has(mediaId)
  }

  _save() {
    localStorage.setItem('likedMedia', JSON.stringify([...this._likedMedia]))
  }
}
```

### Cas d'usage de Set

1. **Dédupliquer un tableau**
```javascript
const unique = [...new Set(arrayWithDuplicates)]
```

2. **Vérifier l'appartenance (O(1))**
```javascript
const validTags = new Set(['portrait', 'nature', 'art'])
if (validTags.has(userTag)) { ... }
```

3. **Opérations ensemblistes**
```javascript
// Union
const union = new Set([...setA, ...setB])

// Intersection
const intersection = new Set([...setA].filter(x => setB.has(x)))

// Différence
const difference = new Set([...setA].filter(x => !setB.has(x)))
```

---

## Array

La structure la plus utilisée pour les listes ordonnées.

### Caractéristiques dans Fisheye

- Stockage de photographes, médias
- Transformation avec map/filter/reduce
- Tri et recherche

### Exemple de manipulation

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
class App {
  constructor() {
    this._allPhotographers = []  // Stockage principal
    this._photographers = []     // Liste filtrée
  }

  async main() {
    const data = await this.photographersApi.getPhotographers()
    this._allPhotographers = new PhotographersFactory(data, 'photographers')
    this._photographers = [...this._allPhotographers]  // Copie pour filtrage
  }

  _filterPhotographers(state) {
    let filtered = [...this._allPhotographers]

    if (state.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(state.search.toLowerCase())
      )
    }

    if (state.tags?.length > 0) {
      filtered = filtered.filter(p =>
        state.tags.some(tag => p.hasTag(tag))
      )
    }

    return filtered
  }
}
```

---

## Object

Pour les données structurées avec des propriétés nommées.

### Usage dans Fisheye

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
class SortFilters {
  // Configuration sous forme d'objet
  static SORT_OPTIONS = {
    popularity: {
      label: 'Popularité',
      property: '_likes',
      type: 'numeric',
      desc: true
    },
    date: {
      label: 'Date',
      property: '_date',
      type: 'date',
      desc: true
    },
    title: {
      label: 'Titre',
      property: '_title',
      type: 'alphabetic',
      desc: false
    }
  }

  _getCurrentOption() {
    return SortFilters.SORT_OPTIONS[this._currentSort]
  }
}
```

### Object methods

**Fichier**: [scripts/utils/StatsCalculator.js](../../scripts/utils/StatsCalculator.js)

```javascript
class StatsCalculator {
  _getLikesByPhotographer() {
    return this._media.reduce((acc, media) => {
      const id = media.photographerId
      acc[id] = (acc[id] || 0) + media.likes
      return acc
    }, {})
  }

  getStatsByCountry() {
    const stats = this._photographers.reduce((acc, p) => {
      if (!acc[p.country]) {
        acc[p.country] = { count: 0, totalPrice: 0 }
      }
      acc[p.country].count++
      acc[p.country].totalPrice += p.price
      return acc
    }, {})

    // Object.entries pour itérer sur les paires clé-valeur
    return Object.entries(stats).map(([country, data]) => ({
      country,
      count: data.count,
      avgPrice: Math.round(data.totalPrice / data.count)
    }))
  }
}
```

---

## Comparaison des structures

| Structure | Ordre | Clés uniques | Valeurs uniques | Itération |
|-----------|-------|--------------|-----------------|-----------|
| Array | Oui (index) | N/A | Non | for, forEach, for...of |
| Object | Non garanti | Oui (strings) | Non | for...in, Object.keys |
| Map | Oui (insertion) | Oui (any type) | Non | for...of, forEach |
| Set | Oui (insertion) | N/A | Oui | for...of, forEach |

---

## Quand utiliser quelle structure ?

| Besoin | Structure recommandée |
|--------|----------------------|
| Liste ordonnée | Array |
| Données nommées | Object |
| Cache clé-valeur | Map |
| Valeurs uniques | Set |
| Configuration | Object |
| Tags actifs | Set |
| Listeners mappés | Map |

---

## Exercice pratique

Créer un gestionnaire de tags avec Set et Map :

```javascript
class TagManager {
  constructor() {
    this._tagCounts = new Map()    // tag -> count
    this._activeTags = new Set()   // tags sélectionnés
  }

  addPhotographer(photographer) {
    photographer.tags.forEach(tag => {
      const count = this._tagCounts.get(tag) || 0
      this._tagCounts.set(tag, count + 1)
    })
  }

  getAllTags() {
    // Trier par popularité
    return [...this._tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  }

  toggleTag(tag) {
    if (this._activeTags.has(tag)) {
      this._activeTags.delete(tag)
    } else {
      this._activeTags.add(tag)
    }
  }

  getActiveTags() {
    return [...this._activeTags]
  }

  hasActiveTag(tag) {
    return this._activeTags.has(tag)
  }

  clearActiveTags() {
    this._activeTags.clear()
  }
}
```
