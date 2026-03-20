# Decorator Pattern (Higher-Order Functions)

## Concept

The **Decorator Pattern** allows adding behaviors to a function without modifying its original code. In JavaScript, this is done via **Higher-Order Functions** (functions that take or return functions).

## Use Cases

- Automatic logging of function calls
- Performance measurement
- Centralized error handling
- Caching (memoization)
- Rate limiting
- Argument validation

## Basic Syntax

```javascript
// A decorator is a function that wraps another function
function withLogging(fn, name) {
  return function(...args) {
    console.log(`[${name}] Called with:`, args)
    const result = fn.apply(this, args)
    console.log(`[${name}] Result:`, result)
    return result
  }
}

// Usage
const add = (a, b) => a + b
const loggedAdd = withLogging(add, 'add')

loggedAdd(2, 3) // Logs: [add] Called with: [2, 3] then [add] Result: 5
```

## Implementation in Fisheye

### File: `scripts/utils/withLogging.js`

```javascript
// Decorator with configurable options
function withLogging(fn, name, options = {}) {
  const { logArgs = true, logResult = true, logDuration = true } = options

  return function(...args) {
    const start = performance.now()

    if (logArgs) console.log(`[${name}] Called with:`, args)

    const result = fn.apply(this, args)

    // Handle Promises
    if (result instanceof Promise) {
      return result.then(value => {
        if (logResult) console.log(`[${name}] Result:`, value)
        if (logDuration) console.log(`[${name}] Duration: ${performance.now() - start}ms`)
        return value
      })
    }

    if (logResult) console.log(`[${name}] Result:`, result)
    if (logDuration) console.log(`[${name}] Duration: ${performance.now() - start}ms`)
    return result
  }
}
```

### Memoization decorator

```javascript
function withMemoization(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  const memoized = function(...args) {
    const key = keyFn(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }

  memoized.cache = cache
  memoized.clearCache = () => cache.clear()

  return memoized
}

// Usage
const expensiveCalc = withMemoization((n) => {
  console.log('Calculating...')
  return n * 2
})

expensiveCalc(5) // "Calculating..." then 10
expensiveCalc(5) // 10 (from cache, no log)
```

### Composing multiple decorators

```javascript
function compose(...decorators) {
  return function(fn) {
    return decorators.reduceRight(
      (decorated, decorator) => decorator(decorated),
      fn
    )
  }
}

// Usage
const enhancedFetch = compose(
  (fn) => withLogging(fn, 'fetchData'),
  (fn) => withErrorHandling(fn, null),
  (fn) => withMemoization(fn)
)(originalFetch)
```

## Advantages

1. **Separation of concerns**: Business code stays clean
2. **Reusability**: A decorator can be applied to any function
3. **Composition**: Decorators combine easily
4. **Testability**: Each decorator can be tested independently

## Best Practices

- Preserve `this` context with `apply(this, args)`
- Handle async functions (returning Promises)
- Provide configuration options
- Allow disabling decorators in production

## See Also

- [Closures](05-closures.md)
- [Higher-Order Functions](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)
