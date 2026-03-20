# Closures

## Concept

A closure is a function that "captures" variables from its lexical environment (the scope where it was created). The function retains access to these variables even after the parent scope has finished executing.

## Basic Principle

```javascript
function createCounter() {
  let count = 0  // Captured variable

  return function() {
    count++      // Inner function has access to count
    return count
  }
}

const counter = createCounter()
console.log(counter())  // 1
console.log(counter())  // 2
console.log(counter())  // 3
```

The variable `count` is "enclosed" in the closure and persists between calls.

## Implementation in Fisheye

### Debounce

**File**: [scripts/utils/debounce.js](../../scripts/utils/debounce.js)

```javascript
export function debounce(fn, delay) {
  let timeoutId  // Variable captured by the closure

  return function (...args) {
    clearTimeout(timeoutId)  // Access to timeoutId
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Usage
const debouncedSearch = debounce(search, 300)

// Each call to debouncedSearch uses the same timeoutId
debouncedSearch('a')  // Starts a timeout
debouncedSearch('ab') // Cancels the previous one, starts a new one
debouncedSearch('abc') // Cancels the previous one, starts a new one
// Only 'abc' will be searched after 300ms
```

### Memoization

**File**: [scripts/utils/CacheManager.js](../../scripts/utils/CacheManager.js)

```javascript
memoize(fn, keyGenerator = (...args) => args.join(':'), ttl = this._ttl) {
  // The closure captures: this (CacheManager), fn, keyGenerator, ttl

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

// cachedFetch keeps a reference to cache and fn in memory
```

### Event handlers with state

**File**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
class SearchBar {
  constructor(photographers, onSearch) {
    this._photographers = photographers
    this._onSearch = onSearch

    // The closure captures this._search and the context
    this._debouncedSearch = debounce(this._search.bind(this), 300)
  }

  _addEventListeners() {
    // The closure captures this
    this.$input.addEventListener('input', (e) => {
      this._debouncedSearch(e.target.value)
    })
  }
}
```

### Factory functions

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
static SortComparators = {
  // Each function returns a closure that captures property and desc
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
// comparator is a closure that "remembers" '_likes' and true
data.sort(comparator)
```

## Common Use Cases

### 1. Private data encapsulation

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance  // Private data

  return {
    deposit(amount) {
      balance += amount
      return balance
    },
    withdraw(amount) {
      if (amount > balance) {
        throw new Error('Insufficient balance')
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
console.log(account.balance)  // undefined - balance is private
```

### 2. Callbacks with context

```javascript
function setupHandler(element, message) {
  // message is captured by the closure
  element.addEventListener('click', () => {
    alert(message)
  })
}

setupHandler(button1, 'First button clicked')
setupHandler(button2, 'Second button clicked')
```

### 3. Loops and closures

```javascript
// Classic problem
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// Outputs: 3, 3, 3 (because var has function scope)

// Solution with let (block scope)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// Outputs: 0, 1, 2

// Solution with closure (before ES6)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 100)
  })(i)
}
// Outputs: 0, 1, 2
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

## Advantages of Closures

1. **Encapsulation** - Private data inaccessible from outside
2. **Persistent state** - Variables survive between calls
3. **Flexibility** - Creation of customized functions
4. **Modules** - Module pattern before ES6

## Beware of Memory Leaks

Closures keep references to variables. If these references are no longer needed, they can cause memory leaks.

```javascript
function createLeak() {
  const largeData = new Array(1000000).fill('x')

  return function() {
    // largeData is captured even if we don't use it entirely
    return largeData[0]
  }
}

const leak = createLeak()
// largeData remains in memory as long as leak exists
```

### Solution

```javascript
function createNoLeak() {
  const largeData = new Array(1000000).fill('x')
  const firstItem = largeData[0]  // Extract only what is needed

  return function() {
    return firstItem
  }
}
```

## Practical Exercise

Create a limited click manager:

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
  console.log(`Click ${current}/${max}`)
})

button.addEventListener('click', () => {
  if (!limitedClick()) {
    console.log('Limit reached!')
    button.disabled = true
  }
})
```
