# Closures (Fermetures)

## Concept

Une closure est une fonction qui "capture" les variables de son environnement lexical (le scope où elle a été créée). La fonction garde accès à ces variables même après que le scope parent a terminé son exécution.

## Principe de base

```javascript
function createCounter() {
  let count = 0  // Variable capturée

  return function() {
    count++      // La fonction interne a accès à count
    return count
  }
}

const counter = createCounter()
console.log(counter())  // 1
console.log(counter())  // 2
console.log(counter())  // 3
```

La variable `count` est "enfermée" dans la closure et persiste entre les appels.

## Implémentation dans Fisheye

### Debounce

**Fichier**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
export function debounce(fn, delay) {
  let timeoutId  // Variable capturée par la closure

  return function (...args) {
    clearTimeout(timeoutId)  // Accès à timeoutId
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Usage
const debouncedSearch = debounce(search, 300)

// Chaque appel à debouncedSearch utilise le même timeoutId
debouncedSearch('a')  // Démarre un timeout
debouncedSearch('ab') // Annule le précédent, en démarre un nouveau
debouncedSearch('abc') // Annule le précédent, en démarre un nouveau
// Seulement 'abc' sera recherché après 300ms
```

### Memoization

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
  // La closure capture: this (CacheManager), fn, keyGenerator, ttl

  return async (...args) => {
    const key = keyGenerator(...args)
    return this.get(key, () => fn(...args), ttl)
  }
}

// Usage
const cache = CacheManager.getInstance()
const cachedFetch = cache.memoize(
  (url) => fetch(url).then(r => r.json())
)

// cachedFetch garde en mémoire la référence à cache et fn
```

### Event handlers avec état

**Fichier**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
class SearchBar {
  constructor(photographers, onSearch) {
    this._photographers = photographers
    this._onSearch = onSearch

    // La closure capture this._search et le contexte
    this._debouncedSearch = debounce(this._search.bind(this), 300)
  }

  _addEventListeners() {
    // La closure capture this
    this.$input.addEventListener('input', (e) => {
      this._debouncedSearch(e.target.value)
    })
  }
}
```

### Factory functions

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
static SortComparators = {
  // Chaque fonction retourne une closure qui capture property et desc
  numeric: (property, desc) => (a, b) => {
    const valA = a[property]
    const valB = b[property]
    return desc ? valB - valA : valA - valB
  },

  alphabetic: (property, desc) => (a, b) => {
    const comparison = a[property].localeCompare(b[property], 'fr')
    return desc ? -comparison : comparison
  }
}

// Usage
const comparator = SortComparators.numeric('_likes', true)
// comparator est une closure qui "se souvient" de '_likes' et true
data.sort(comparator)
```

## Cas d'usage courants

### 1. Encapsulation de données privées

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance  // Donnée privée

  return {
    deposit(amount) {
      balance += amount
      return balance
    },
    withdraw(amount) {
      if (amount > balance) {
        throw new Error('Solde insuffisant')
      }
      balance -= amount
      return balance
    },
    getBalance() {
      return balance
    }
  }
}

const account = createBankAccount(100)
account.deposit(50)   // 150
account.withdraw(30)  // 120
console.log(account.balance)  // undefined - balance est privé
```

### 2. Callbacks avec contexte

```javascript
function setupHandler(element, message) {
  // message est capturé par la closure
  element.addEventListener('click', () => {
    alert(message)
  })
}

setupHandler(button1, 'Premier bouton cliqué')
setupHandler(button2, 'Deuxième bouton cliqué')
```

### 3. Boucles et closures

```javascript
// Problème classique
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// Affiche: 3, 3, 3 (car var a une portée de fonction)

// Solution avec let (portée de bloc)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// Affiche: 0, 1, 2

// Solution avec closure (avant ES6)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 100)
  })(i)
}
// Affiche: 0, 1, 2
```

### 4. Partial application

```javascript
function multiply(a, b) {
  return a * b
}

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs)
  }
}

const double = partial(multiply, 2)
const triple = partial(multiply, 3)

console.log(double(5))  // 10
console.log(triple(5))  // 15
```

## Avantages des closures

1. **Encapsulation** - Données privées inaccessibles de l'extérieur
2. **État persistant** - Les variables survivent entre les appels
3. **Flexibilité** - Création de fonctions personnalisées
4. **Modules** - Pattern de module avant ES6

## Attention aux fuites mémoire

Les closures gardent des références aux variables. Si ces références ne sont plus nécessaires, elles peuvent causer des fuites mémoire.

```javascript
function createLeak() {
  const largeData = new Array(1000000).fill('x')

  return function() {
    // largeData est capturé même si on ne l'utilise pas entièrement
    return largeData[0]
  }
}

const leak = createLeak()
// largeData reste en mémoire tant que leak existe
```

### Solution

```javascript
function createNoLeak() {
  const largeData = new Array(1000000).fill('x')
  const firstItem = largeData[0]  // Extraire seulement ce qui est nécessaire

  return function() {
    return firstItem
  }
}
```

## Exercice pratique

Créer un gestionnaire de clics limité :

```javascript
function createClickLimiter(maxClicks, callback) {
  let clickCount = 0

  return function() {
    if (clickCount < maxClicks) {
      clickCount++
      callback(clickCount, maxClicks)
      return true
    }
    return false
  }
}

// Usage
const limitedClick = createClickLimiter(3, (current, max) => {
  console.log(`Clic ${current}/${max}`)
})

button.addEventListener('click', () => {
  if (!limitedClick()) {
    console.log('Limite atteinte!')
    button.disabled = true
  }
})
```
