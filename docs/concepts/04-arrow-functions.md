# Arrow Functions (Fonctions fléchées)

## Concept

Les arrow functions sont une syntaxe concise pour écrire des fonctions en JavaScript. Elles ont un comportement différent concernant le mot-clé `this`.

## Syntaxe

```javascript
// Fonction traditionnelle
function add(a, b) {
  return a + b
}

// Arrow function
const add = (a, b) => {
  return a + b
}

// Syntaxe courte (return implicite)
const add = (a, b) => a + b

// Un seul paramètre (parenthèses optionnelles)
const double = n => n * 2

// Sans paramètre
const greet = () => 'Bonjour!'
```

## Implémentation dans Fisheye

### Callbacks avec map/filter

**Fichier**: [scripts/factories/PhotographersFactory.js](../../scripts/factories/PhotographersFactory.js)

```javascript
constructor(data, type) {
  if (type === 'photographers') {
    return data.photographers.map((data) => new PhotographerProfil(data))
  }
}
```

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
const filtered = this._photographers.filter((photographer) => {
  return photographer.name.toLowerCase().includes(normalizedQuery)
})
```

### Event listeners

**Fichier**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
this.$input.addEventListener('input', (e) => {
  this._debouncedSearch(e.target.value)
})

this.$input.addEventListener('focus', () => {
  this._showSuggestions()
})
```

**Fichier**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
$button.addEventListener('click', (e) => {
  e.stopPropagation()
  e.preventDefault()
  this._toggle()
})
```

### Fonctions de tri

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
static SortComparators = {
  numeric: (property, desc) => (a, b) => {
    const valA = a[property]
    const valB = b[property]
    return desc ? valB - valA : valA - valB
  },
  alphabetic: (property, desc) => (a, b) => {
    const comparison = a[property].localeCompare(b[property], 'fr', { sensitivity: 'base' })
    return desc ? -comparison : comparison
  }
}
```

### Debounce

**Fichier**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
export function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

## Le comportement de `this`

### Différence clé

Les arrow functions **n'ont pas leur propre `this`**. Elles héritent du `this` de leur contexte englobant.

```javascript
class Counter {
  constructor() {
    this.count = 0
  }

  // Problème avec fonction traditionnelle
  startTraditional() {
    setInterval(function() {
      this.count++  // 'this' est undefined ou window!
    }, 1000)
  }

  // Solution avec arrow function
  startArrow() {
    setInterval(() => {
      this.count++  // 'this' fait référence à l'instance Counter
    }, 1000)
  }
}
```

### Exemple dans Fisheye

**Fichier**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
on(eventName, callback, options = {}) {
  const { once = false, priority = 0 } = options

  const wrappedCallback = (e) => callback(e.detail)  // Arrow function préserve le contexte

  this._listeners.set(callback, {
    wrapped: wrappedCallback,
    priority
  })

  this._target.addEventListener(eventName, wrappedCallback, { once })
}
```

## Syntaxes courtes

### Return implicite

```javascript
// Avec accolades - return explicite requis
const getPrice = (item) => {
  return item.price * item.quantity
}

// Sans accolades - return implicite
const getPrice = (item) => item.price * item.quantity

// Retourner un objet (parenthèses requises)
const createUser = (name) => ({ name, createdAt: Date.now() })
```

### Utilisations courantes

```javascript
// Transformation simple
const names = photographers.map(p => p.name)

// Filtrage
const expensive = items.filter(item => item.price > 100)

// Tri
const sorted = numbers.sort((a, b) => a - b)

// Find
const found = users.find(user => user.id === targetId)
```

## Quand utiliser arrow functions vs fonctions traditionnelles

### Utiliser arrow functions pour :

1. **Callbacks** - `map`, `filter`, `forEach`, etc.
2. **Event listeners inline** - Quand vous avez besoin du `this` de la classe
3. **Fonctions courtes** - Transformations simples

### Utiliser fonctions traditionnelles pour :

1. **Méthodes de classe** - Syntaxe de méthode de classe
2. **Méthodes d'objet** - Quand vous avez besoin du `this` de l'objet
3. **Constructeurs** - Les arrow functions ne peuvent pas être utilisées avec `new`

```javascript
class Example {
  // Méthode de classe (syntaxe normale)
  handleClick() {
    // ...
  }

  // Event listener avec arrow function
  init() {
    button.addEventListener('click', (e) => {
      this.handleClick()  // 'this' fonctionne grâce à l'arrow function
    })
  }
}
```

## Cas d'usage dans le projet

| Utilisation | Exemple | Fichier |
|------------|---------|---------|
| map() callback | `data.map(d => new Model(d))` | PhotographersFactory.js |
| filter() callback | `items.filter(i => i.active)` | App.js, SearchBar.js |
| Event listeners | `btn.addEventListener('click', () => {...})` | Tous les templates |
| sort() comparateur | `arr.sort((a, b) => a - b)` | SortFilters.js |
| setTimeout callback | `setTimeout(() => fn(), delay)` | debounce.js |

## Exercice pratique

Refactorer ce code avec des arrow functions :

```javascript
// Avant
const prices = products.map(function(product) {
  return product.price
})

const expensive = prices.filter(function(price) {
  return price > 50
})

const total = expensive.reduce(function(sum, price) {
  return sum + price
}, 0)

// Après
const prices = products.map(product => product.price)
const expensive = prices.filter(price => price > 50)
const total = expensive.reduce((sum, price) => sum + price, 0)

// Ou en chaîne
const total = products
  .map(p => p.price)
  .filter(price => price > 50)
  .reduce((sum, price) => sum + price, 0)
```
