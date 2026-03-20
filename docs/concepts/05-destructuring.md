# Destructuring

## Concept

Destructuring allows you to extract values from arrays or properties from objects into distinct variables with a concise syntax.

## Syntax

### Object Destructuring

```javascript
const user = { name: 'Alice', age: 25, city: 'Paris' }

// Property extraction
const { name, age } = user
console.log(name)  // 'Alice'
console.log(age)   // 25

// With renaming
const { name: userName } = user
console.log(userName)  // 'Alice'

// With default value
const { role = 'user' } = user
console.log(role)  // 'user' (doesn't exist in the object)
```

### Array Destructuring

```javascript
const colors = ['red', 'green', 'blue']

const [first, second] = colors
console.log(first)   // 'red'
console.log(second)  // 'green'

// Skip elements
const [, , third] = colors
console.log(third)  // 'blue'

// Rest pattern
const [head, ...rest] = colors
console.log(head)  // 'red'
console.log(rest)  // ['green', 'blue']
```

## Implementation in Fisheye

### Destructuring in Function Parameters

**File**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
on(eventName, callback, options = {}) {
  const { once = false, priority = 0 } = options

  // Using once and priority with default values
  this._target.addEventListener(eventName, wrappedCallback, { once })
}
```

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
  return async (...args) => {
    const key = keyGenerator(...args)
    return this.get(key, () => fn(...args), ttl)
  }
}
```

### Destructuring in Loops

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

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

### Array Destructuring with reduce

**File**: [scripts/utils/StatsCalculator.js](../../scripts/utils/StatsCalculator.js)

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

### Destructuring in Imports

**File**: [scripts/templates/ShareButton.js](../../scripts/templates/ShareButton.js)

```javascript
async _share() {
  const { title, text, url } = this._getShareData()

  if (navigator.share) {
    await navigator.share({ title, text, url })
  }
}
```

## Advanced Patterns

### 1. Nested Destructuring

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

### 2. Combined Default Values

```javascript
function createCard({ title = 'Untitled', likes = 0 } = {}) {
  return { title, likes }
}

createCard({ title: 'Photo' })  // { title: 'Photo', likes: 0 }
createCard()                     // { title: 'Untitled', likes: 0 }
```

### 3. Variable Swap

```javascript
let a = 1, b = 2
[a, b] = [b, a]
console.log(a, b)  // 2, 1
```

### 4. Rest in Destructuring

```javascript
const { name, ...rest } = { name: 'Alice', age: 25, city: 'Paris' }
console.log(name)  // 'Alice'
console.log(rest)  // { age: 25, city: 'Paris' }
```

## Use Cases in the Project

| Pattern | Example | File |
|---------|---------|------|
| Options with defaults | `{ once = false } = options` | EventBus.js |
| Loop over Map | `for (const [key, value] of map)` | CacheManager.js |
| Object extraction | `const { title, url } = data` | ShareButton.js |
| Reduce with tuple | `[id, likes] = best` | StatsCalculator.js |

## Before/After Comparison

### Without Destructuring

```javascript
function processUser(user) {
  const name = user.name
  const age = user.age
  const city = user.city || 'Unknown'

  return `${name}, ${age} years old, ${city}`
}
```

### With Destructuring

```javascript
function processUser({ name, age, city = 'Unknown' }) {
  return `${name}, ${age} years old, ${city}`
}
```

## Best Practices

1. **Use default values** - Avoid undefined
2. **Destructure in parameters** - More readable code
3. **Don't over-destructure** - If you only use one property, keep `obj.prop`
4. **Name clearly** - Rename if the original name isn't clear

```javascript
// Good - Renaming for clarity
const { name: photographerName } = response.data.photographer

// Good - Default values
const { timeout = 5000, retries = 3 } = options

// Avoid - Excessive destructuring
const { a: { b: { c: { d } } } } = deepObject
```

## Practical Exercise

Refactor this function with destructuring:

```javascript
// Before
function displayPhotographer(photographer) {
  const name = photographer.name
  const city = photographer.city
  const country = photographer.country
  const price = photographer.price || 0

  return `${name} - ${city}, ${country} - ${price}€/day`
}

// After
function displayPhotographer({ name, city, country, price = 0 }) {
  return `${name} - ${city}, ${country} - ${price}€/day`
}

// Or with nested location
function displayPhotographer({ name, location: { city, country }, price = 0 }) {
  return `${name} - ${city}, ${country} - ${price}€/day`
}
```
