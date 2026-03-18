# Spread Operator (...)

## Concept

L'opérateur spread (`...`) permet d'étendre un itérable (tableau, objet) en éléments individuels. Il est utilisé pour copier, fusionner et passer des arguments.

## Syntaxe

### Avec les tableaux

```javascript
// Copie de tableau
const original = [1, 2, 3]
const copy = [...original]

// Fusion de tableaux
const combined = [...arr1, ...arr2]

// Ajout d'éléments
const extended = [...original, 4, 5]

// Passage d'arguments
Math.max(...numbers)
```

### Avec les objets

```javascript
// Copie d'objet
const original = { a: 1, b: 2 }
const copy = { ...original }

// Fusion d'objets
const merged = { ...obj1, ...obj2 }

// Mise à jour de propriétés
const updated = { ...original, b: 3 }
```

## Implémentation dans Fisheye

### Copie de tableau pour éviter la mutation

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
_filterPhotographers(state) {
  let filtered = [...this._allPhotographers]  // Copie pour ne pas muter l'original

  if (state.search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(state.search.toLowerCase())
    )
  }

  if (state.tags && state.tags.length > 0) {
    filtered = filtered.filter(p =>
      state.tags.some(tag => p.hasTag(tag))
    )
  }

  return filtered
}
```

### Copie avant tri (immutabilité)

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
sort(data) {
  const sortedData = [...data]  // Ne pas muter le tableau original

  const comparator = this._getComparator()
  sortedData.sort(comparator)

  return sortedData
}
```

### Fusion d'état

**Fichier**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
updateState(newState, replace = false) {
  this._state = { ...this._state, ...newState }  // Fusion des états

  const url = this._buildUrl()
  if (replace) {
    history.replaceState(this._state, '', url)
  } else {
    history.pushState(this._state, '', url)
  }
}
```

### Création d'objets avec propriétés dynamiques

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
add(photographerId, photographerData) {
  const favoriteData = {
    id: photographerId,
    ...photographerData,  // Copie toutes les propriétés de photographerData
    addedAt: Date.now()
  }

  this._favorites.push(favoriteData)
  this._save()
}
```

### Rest parameters (inverse du spread)

**Fichier**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
export function debounce(fn, delay) {
  let timeoutId
  return function (...args) {  // Rest: collecte tous les arguments
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

## Patterns courants

### 1. Copie superficielle (shallow copy)

```javascript
const original = { a: 1, b: { c: 2 } }
const copy = { ...original }

copy.a = 10        // Ne modifie pas original.a
copy.b.c = 20      // MODIFIE original.b.c! (référence partagée)
```

### 2. Mise à jour immutable

```javascript
// Mettre à jour un élément dans un tableau
const items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
const updated = items.map(item =>
  item.id === 2 ? { ...item, name: 'Updated' } : item
)
```

### 3. Ajout/Suppression dans un tableau immutable

```javascript
// Ajouter
const withNew = [...items, newItem]

// Supprimer par index
const without = [...items.slice(0, index), ...items.slice(index + 1)]

// Supprimer par condition
const filtered = items.filter(item => item.id !== idToRemove)
```

### 4. Valeurs par défaut d'objet

```javascript
const defaultOptions = { timeout: 5000, retries: 3 }
const options = { ...defaultOptions, ...userOptions }
```

### 5. Cloner avec modification

```javascript
const photographer = { name: 'Alice', price: 100 }
const updated = { ...photographer, price: 150 }
// { name: 'Alice', price: 150 }
```

## Spread vs méthodes traditionnelles

### Tableaux

```javascript
// Ancien style
const copy = original.slice()
const merged = arr1.concat(arr2)

// Avec spread
const copy = [...original]
const merged = [...arr1, ...arr2]
```

### Objets

```javascript
// Ancien style
const copy = Object.assign({}, original)
const merged = Object.assign({}, obj1, obj2)

// Avec spread
const copy = { ...original }
const merged = { ...obj1, ...obj2 }
```

## Cas d'usage dans le projet

| Pattern | Exemple | Fichier |
|---------|---------|---------|
| Copie avant mutation | `[...array].sort()` | SortFilters.js |
| Fusion d'état | `{ ...state, ...newState }` | UrlStateManager.js |
| Copie avec ajout | `{ ...data, addedAt: now }` | FavoritesManager.js |
| Rest parameters | `function(...args)` | debounce.js |
| Filtrage immutable | `[...photographers]` | App.js |

## Attention: Copie superficielle

Le spread ne fait qu'une copie **superficielle** (shallow copy) :

```javascript
const original = {
  name: 'Alice',
  address: { city: 'Paris' }  // Objet imbriqué
}

const copy = { ...original }

copy.name = 'Bob'           // OK - ne modifie pas original
copy.address.city = 'Lyon'  // ATTENTION - modifie aussi original!
```

Pour une copie profonde :

```javascript
// Solution simple (attention aux fonctions et dates)
const deepCopy = JSON.parse(JSON.stringify(original))

// Solution avec structuredClone (moderne)
const deepCopy = structuredClone(original)
```

## Exercice pratique

Implémenter une fonction qui met à jour un photographe dans une liste de manière immutable :

```javascript
function updatePhotographer(photographers, id, updates) {
  return photographers.map(p =>
    p.id === id ? { ...p, ...updates } : p
  )
}

// Usage
const photographers = [
  { id: 1, name: 'Alice', price: 100 },
  { id: 2, name: 'Bob', price: 150 }
]

const updated = updatePhotographer(photographers, 1, { price: 120 })
// [{ id: 1, name: 'Alice', price: 120 }, { id: 2, name: 'Bob', price: 150 }]

console.log(photographers[0].price)  // 100 - original intact
```
