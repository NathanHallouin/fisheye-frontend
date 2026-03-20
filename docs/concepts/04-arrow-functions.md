# Arrow Functions

## Concept

Arrow functions are a concise syntax for writing functions in JavaScript. They have different behavior regarding the `this` keyword.

## Syntax

```javascript
// Traditional function
function add(a, b) {
  return a + b
}

// Arrow function
const add = (a, b) => {
  return a + b
}

// Short syntax (implicit return)
const add = (a, b) => a + b

// Single parameter (parentheses optional)
const double = n => n * 2

// No parameters
const greet = () => 'Hello!'
```

## Implementation in Fisheye

### Callbacks with map/filter

**File**: [scripts/factories/PhotographersFactory.js](../../scripts/factories/PhotographersFactory.js)

```javascript
constructor(data, type) {
  if (type === 'photographers') {
    return data.photographers.map((data) => new PhotographerProfil(data))
  }
}
```

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
const filtered = this._photographers.filter((photographer) => {
  return photographer.name.toLowerCase().includes(normalizedQuery)
})
```

### Event Listeners

**File**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
this.$input.addEventListener('input', (e) => {
  this._debouncedSearch(e.target.value)
})

this.$input.addEventListener('focus', () => {
  this._showSuggestions()
})
```

**File**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
$button.addEventListener('click', (e) => {
  e.stopPropagation()
  e.preventDefault()
  this._toggle()
})
```

### Sort Functions

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

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

**File**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
export function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

## The Behavior of `this`

### Key Difference

Arrow functions **do not have their own `this`**. They inherit `this` from their enclosing context.

```javascript
class Counter {
  constructor() {
    this.count = 0
  }

  // Problem with traditional function
  startTraditional() {
    setInterval(function() {
      this.count++  // 'this' is undefined or window!
    }, 1000)
  }

  // Solution with arrow function
  startArrow() {
    setInterval(() => {
      this.count++  // 'this' refers to the Counter instance
    }, 1000)
  }
}
```

### Example in Fisheye

**File**: [scripts/utils/EventBus.js](../../scripts/utils/EventBus.js)

```javascript
on(eventName, callback, options = {}) {
  const { once = false, priority = 0 } = options

  const wrappedCallback = (e) => callback(e.detail)  // Arrow function preserves context

  this._listeners.set(callback, {
    wrapped: wrappedCallback,
    priority
  })

  this._target.addEventListener(eventName, wrappedCallback, { once })
}
```

## Short Syntax Forms

### Implicit Return

```javascript
// With braces - explicit return required
const getPrice = (item) => {
  return item.price * item.quantity
}

// Without braces - implicit return
const getPrice = (item) => item.price * item.quantity

// Returning an object (parentheses required)
const createUser = (name) => ({ name, createdAt: Date.now() })
```

### Common Uses

```javascript
// Simple transformation
const names = photographers.map(p => p.name)

// Filtering
const expensive = items.filter(item => item.price > 100)

// Sorting
const sorted = numbers.sort((a, b) => a - b)

// Find
const found = users.find(user => user.id === targetId)
```

## When to Use Arrow Functions vs Traditional Functions

### Use arrow functions for:

1. **Callbacks** - `map`, `filter`, `forEach`, etc.
2. **Inline event listeners** - When you need the class's `this`
3. **Short functions** - Simple transformations

### Use traditional functions for:

1. **Class methods** - Class method syntax
2. **Object methods** - When you need the object's `this`
3. **Constructors** - Arrow functions cannot be used with `new`

```javascript
class Example {
  // Class method (normal syntax)
  handleClick() {
    // ...
  }

  // Event listener with arrow function
  init() {
    button.addEventListener('click', (e) => {
      this.handleClick()  // 'this' works thanks to the arrow function
    })
  }
}
```

## Use Cases in the Project

| Usage | Example | File |
|-------|---------|------|
| map() callback | `data.map(d => new Model(d))` | PhotographersFactory.js |
| filter() callback | `items.filter(i => i.active)` | App.js, SearchBar.js |
| Event listeners | `btn.addEventListener('click', () => {...})` | All templates |
| sort() comparator | `arr.sort((a, b) => a - b)` | SortFilters.js |
| setTimeout callback | `setTimeout(() => fn(), delay)` | debounce.js |

## Practical Exercise

Refactor this code with arrow functions:

```javascript
// Before
const prices = products.map(function(product) {
  return product.price
})

const expensive = prices.filter(function(price) {
  return price > 50
})

const total = expensive.reduce(function(sum, price) {
  return sum + price
}, 0)

// After
const prices = products.map(product => product.price)
const expensive = prices.filter(price => price > 50)
const total = expensive.reduce((sum, price) => sum + price, 0)

// Or chained
const total = products
  .map(p => p.price)
  .filter(price => price > 50)
  .reduce((sum, price) => sum + price, 0)
```
