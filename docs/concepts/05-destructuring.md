# Destructuring (Déstructuration)

## Concept

La déstructuration permet d'extraire des valeurs de tableaux ou des propriétés d'objets dans des variables distinctes avec une syntaxe concise.

## Syntaxe

### Déstructuration d'objets

```javascript
const user = { name: 'Alice', age: 25, city: 'Paris' }

// Extraction de propriétés
const { name, age } = user
console.log(name)  // 'Alice'
console.log(age)   // 25

// Avec renommage
const { name: userName } = user
console.log(userName)  // 'Alice'

// Avec valeur par défaut
const { role = 'user' } = user
console.log(role)  // 'user' (n'existe pas dans l'objet)
```

### Déstructuration de tableaux

```javascript
const colors = ['red', 'green', 'blue']

const [first, second] = colors
console.log(first)   // 'red'
console.log(second)  // 'green'

// Ignorer des éléments
const [, , third] = colors
console.log(third)  // 'blue'

// Rest pattern
const [head, ...rest] = colors
console.log(head)  // 'red'
console.log(rest)  // ['green', 'blue']
```

## Implémentation dans Fisheye

### Déstructuration dans les paramètres de fonction

**Fichier**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
on(eventName, callback, options = {}) {
  const { once = false, priority = 0 } = options

  // Utilisation de once et priority avec valeurs par défaut
  this._target.addEventListener(eventName, wrappedCallback, { once })
}
```

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
  return async (...args) => {
    const key = keyGenerator(...args)
    return this.get(key, () => fn(...args), ttl)
  }
}
```

### Déstructuration dans les boucles

**Fichier**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
_cleanup() {
  const now = Date.now()
  for (const [key, entry] of this._cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      this._cache.delete(key)
    }
  }
}
```

### Déstructuration de tableaux avec reduce

**Fichier**: [scripts/utils/StatsCalculator.js](../../scripts/utils/StatsCalculator.js)

```javascript
getMostLikedPhotographer() {
  const likesByPhotographer = this._getLikesByPhotographer()
  const entries = Object.entries(likesByPhotographer)

  const [bestId, bestLikes] = entries.reduce(
    (best, [id, likes]) => (likes > best[1] ? [id, likes] : best),
    ['', 0]
  )

  return { photographerId: parseInt(bestId, 10), totalLikes: bestLikes }
}
```

### Déstructuration dans les imports

**Fichier**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
async _share() {
  const { title, text, url } = this._getShareData()

  if (navigator.share) {
    await navigator.share({ title, text, url })
  }
}
```

## Patterns avancés

### 1. Déstructuration imbriquée

```javascript
const photographer = {
  name: 'Alice',
  location: {
    city: 'Paris',
    country: 'France'
  }
}

const { location: { city, country } } = photographer
console.log(city)     // 'Paris'
console.log(country)  // 'France'
```

### 2. Valeurs par défaut combinées

```javascript
function createCard({ title = 'Sans titre', likes = 0 } = {}) {
  return { title, likes }
}

createCard({ title: 'Photo' })  // { title: 'Photo', likes: 0 }
createCard()                     // { title: 'Sans titre', likes: 0 }
```

### 3. Swap de variables

```javascript
let a = 1, b = 2
[a, b] = [b, a]
console.log(a, b)  // 2, 1
```

### 4. Rest dans la déstructuration

```javascript
const { name, ...rest } = { name: 'Alice', age: 25, city: 'Paris' }
console.log(name)  // 'Alice'
console.log(rest)  // { age: 25, city: 'Paris' }
```

## Cas d'usage dans le projet

| Pattern | Exemple | Fichier |
|---------|---------|---------|
| Options avec défauts | `{ once = false } = options` | EventBus.js |
| Boucle sur Map | `for (const [key, value] of map)` | CacheManager.js |
| Extraction d'objet | `const { title, url } = data` | ShareButton.js |
| Reduce avec tuple | `[id, likes] = best` | StatsCalculator.js |

## Comparaison avant/après

### Sans déstructuration

```javascript
function processUser(user) {
  const name = user.name
  const age = user.age
  const city = user.city || 'Inconnu'

  return `${name}, ${age} ans, ${city}`
}
```

### Avec déstructuration

```javascript
function processUser({ name, age, city = 'Inconnu' }) {
  return `${name}, ${age} ans, ${city}`
}
```

## Bonnes pratiques

1. **Utiliser des valeurs par défaut** - Éviter les undefined
2. **Déstructurer dans les paramètres** - Code plus lisible
3. **Ne pas sur-déstructurer** - Si vous n'utilisez qu'une propriété, gardez `obj.prop`
4. **Nommer clairement** - Renommer si le nom original n'est pas clair

```javascript
// Bon - Renommage pour clarté
const { name: photographerName } = response.data.photographer

// Bon - Valeurs par défaut
const { timeout = 5000, retries = 3 } = options

// À éviter - Déstructuration excessive
const { a: { b: { c: { d } } } } = deepObject
```

## Exercice pratique

Refactorer cette fonction avec la déstructuration :

```javascript
// Avant
function displayPhotographer(photographer) {
  const name = photographer.name
  const city = photographer.city
  const country = photographer.country
  const price = photographer.price || 0

  return `${name} - ${city}, ${country} - ${price}€/jour`
}

// Après
function displayPhotographer({ name, city, country, price = 0 }) {
  return `${name} - ${city}, ${country} - ${price}€/jour`
}

// Ou avec location imbriquée
function displayPhotographer({ name, location: { city, country }, price = 0 }) {
  return `${name} - ${city}, ${country} - ${price}€/jour`
}
```
