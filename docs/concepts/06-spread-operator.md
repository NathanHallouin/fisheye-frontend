# Spread Operator (...)

## Concept

The spread operator (`...`) allows you to expand an iterable (array, object) into individual elements. It is used for copying, merging, and passing arguments.

## Syntax

### With Arrays

```javascript
// Array copy
const original = [1, 2, 3]
const copy = [...original]

// Array merge
const combined = [...arr1, ...arr2]

// Adding elements
const extended = [...original, 4, 5]

// Passing arguments
Math.max(...numbers)
```

### With Objects

```javascript
// Object copy
const original = { a: 1, b: 2 }
const copy = { ...original }

// Object merge
const merged = { ...obj1, ...obj2 }

// Updating properties
const updated = { ...original, b: 3 }
```

## Implementation in Fisheye

### Array Copy to Avoid Mutation

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
_filterPhotographers(state) {
  let filtered = [...this._allPhotographers]  // Copy to avoid mutating the original

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

### Copy Before Sorting (immutability)

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
sort(data) {
  const sortedData = [...data]  // Don't mutate the original array

  const comparator = this._getComparator()
  sortedData.sort(comparator)

  return sortedData
}
```

### State Merge

**File**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
updateState(newState, replace = false) {
  this._state = { ...this._state, ...newState }  // Merge states

  const url = this._buildUrl()
  if (replace) {
    history.replaceState(this._state, '', url)
  } else {
    history.pushState(this._state, '', url)
  }
}
```

### Creating Objects with Dynamic Properties

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
add(photographerId, photographerData) {
  const favoriteData = {
    id: photographerId,
    ...photographerData,  // Copy all properties from photographerData
    addedAt: Date.now()
  }

  this._favorites.push(favoriteData)
  this._save()
}
```

### Rest Parameters (inverse of spread)

**File**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
export function debounce(fn, delay) {
  let timeoutId
  return function (...args) {  // Rest: collects all arguments
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

## Common Patterns

### 1. Shallow Copy

```javascript
const original = { a: 1, b: { c: 2 } }
const copy = { ...original }

copy.a = 10        // Does not modify original.a
copy.b.c = 20      // MODIFIES original.b.c! (shared reference)
```

### 2. Immutable Update

```javascript
// Update an item in an array
const items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
const updated = items.map(item =>
  item.id === 2 ? { ...item, name: 'Updated' } : item
)
```

### 3. Immutable Add/Remove in Array

```javascript
// Add
const withNew = [...items, newItem]

// Remove by index
const without = [...items.slice(0, index), ...items.slice(index + 1)]

// Remove by condition
const filtered = items.filter(item => item.id !== idToRemove)
```

### 4. Object Default Values

```javascript
const defaultOptions = { timeout: 5000, retries: 3 }
const options = { ...defaultOptions, ...userOptions }
```

### 5. Clone with Modification

```javascript
const photographer = { name: 'Alice', price: 100 }
const updated = { ...photographer, price: 150 }
// { name: 'Alice', price: 150 }
```

## Spread vs Traditional Methods

### Arrays

```javascript
// Old style
const copy = original.slice()
const merged = arr1.concat(arr2)

// With spread
const copy = [...original]
const merged = [...arr1, ...arr2]
```

### Objects

```javascript
// Old style
const copy = Object.assign({}, original)
const merged = Object.assign({}, obj1, obj2)

// With spread
const copy = { ...original }
const merged = { ...obj1, ...obj2 }
```

## Use Cases in the Project

| Pattern | Example | File |
|---------|---------|------|
| Copy before mutation | `[...array].sort()` | SortFilters.js |
| State merge | `{ ...state, ...newState }` | UrlStateManager.js |
| Copy with addition | `{ ...data, addedAt: now }` | FavoritesManager.js |
| Rest parameters | `function(...args)` | debounce.js |
| Immutable filtering | `[...photographers]` | App.js |

## Warning: Shallow Copy

Spread only makes a **shallow copy**:

```javascript
const original = {
  name: 'Alice',
  address: { city: 'Paris' }  // Nested object
}

const copy = { ...original }

copy.name = 'Bob'           // OK - does not modify original
copy.address.city = 'Lyon'  // WARNING - also modifies original!
```

For a deep copy:

```javascript
// Simple solution (caution with functions and dates)
const deepCopy = JSON.parse(JSON.stringify(original))

// Solution with structuredClone (modern)
const deepCopy = structuredClone(original)
```

## Practical Exercise

Implement a function that updates a photographer in a list immutably:

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
