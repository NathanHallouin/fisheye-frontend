/**
 * Decorator Pattern for logging and performance measurement.
 *
 * CONCEPT: Higher-Order Functions and Decorator Pattern
 *
 * A decorator is a function that wraps another function to
 * add functionality without modifying the original code.
 * It's an AOP (Aspect-Oriented Programming) pattern.
 *
 * Advantages:
 * - Separation of concerns (cross-cutting concerns)
 * - Reusability of logging
 * - Cleaner business code
 * - Easy activation/deactivation of debug
 */

/**
 * Decorator that adds logging to a function.
 * @param {Function} fn - The function to decorate.
 * @param {string} name - The name to display in logs.
 * @param {Object} options - Configuration options.
 * @param {boolean} [options.logArgs=true] - Log arguments.
 * @param {boolean} [options.logResult=true] - Log result.
 * @param {boolean} [options.logDuration=true] - Log execution duration.
 * @param {boolean} [options.logErrors=true] - Log errors.
 * @param {string} [options.level='log'] - Log level ('log', 'debug', 'info').
 * @returns {Function} The decorated function.
 *
 * @example
 * const fetchData = withLogging(
 *   async (id) => await api.get(`/users/${id}`),
 *   'fetchUser',
 *   { logDuration: true }
 * )
 */
function withLogging(fn, name, options = {}) {
  const {
    logArgs = true,
    logResult = true,
    logDuration = true,
    logErrors = true,
    level = 'log',
  } = options

  const logger = console[level] || console.log
  const prefix = `[${name}]`

  return function (...args) {
    const start = performance.now()

    if (logArgs) {
      logger(`${prefix} Called with:`, args)
    }

    try {
      const result = fn.apply(this, args)

      // Handle Promises (async functions)
      if (result instanceof Promise) {
        return result
          .then((value) => {
            if (logResult) {
              logger(`${prefix} Result:`, value)
            }
            if (logDuration) {
              logger(
                `${prefix} Duration: ${(performance.now() - start).toFixed(2)}ms`,
              )
            }
            return value
          })
          .catch((error) => {
            if (logErrors) {
              console.error(`${prefix} Error:`, error)
            }
            if (logDuration) {
              logger(
                `${prefix} Duration before error: ${(performance.now() - start).toFixed(2)}ms`,
              )
            }
            throw error
          })
      }

      // Synchronous functions
      if (logResult) {
        logger(`${prefix} Result:`, result)
      }
      if (logDuration) {
        logger(`${prefix} Duration: ${(performance.now() - start).toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      if (logErrors) {
        console.error(`${prefix} Error:`, error)
      }
      if (logDuration) {
        logger(
          `${prefix} Duration before error: ${(performance.now() - start).toFixed(2)}ms`,
        )
      }
      throw error
    }
  }
}

/**
 * Decorator that only measures execution duration.
 * @param {Function} fn - The function to measure.
 * @param {string} name - The name for logs.
 * @returns {Function} The decorated function.
 *
 * @example
 * const sortMedia = withTiming(
 *   (items) => items.sort((a, b) => b.likes - a.likes),
 *   'sortByLikes'
 * )
 */
function withTiming(fn, name) {
  return withLogging(fn, name, {
    logArgs: false,
    logResult: false,
    logDuration: true,
    logErrors: true,
  })
}

/**
 * Decorator that adds error handling with fallback.
 * @param {Function} fn - The function to decorate.
 * @param {*} fallback - Fallback value in case of error.
 * @param {string} [name] - Optional name for logging.
 * @returns {Function} The decorated function.
 *
 * @example
 * const safeParseJSON = withErrorHandling(
 *   JSON.parse,
 *   {},
 *   'parseJSON'
 * )
 * safeParseJSON('invalid json') // Returns {} instead of throwing
 */
function withErrorHandling(fn, fallback, name = '') {
  const prefix = name ? `[${name}] ` : ''

  return function (...args) {
    try {
      const result = fn.apply(this, args)

      if (result instanceof Promise) {
        return result.catch((error) => {
          console.warn(
            `${prefix}Error captured, using fallback:`,
            error.message,
          )
          return fallback
        })
      }

      return result
    } catch (error) {
      console.warn(
        `${prefix}Error captured, using fallback:`,
        error.message,
      )
      return fallback
    }
  }
}

/**
 * Decorator that caches results (memoization).
 * @param {Function} fn - The function to memoize.
 * @param {Function} [keyFn] - Function to generate the cache key.
 * @returns {Function} The memoized function with .cache property.
 *
 * @example
 * const expensiveCalc = withMemoization(
 *   (n) => n * 2, // expensive calculation
 *   (n) => `calc_${n}`
 * )
 * expensiveCalc(5) // Calculates
 * expensiveCalc(5) // Returns from cache
 */
function withMemoization(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  const memoized = function (...args) {
    const key = keyFn(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn.apply(this, args)

    // Handle Promises
    if (result instanceof Promise) {
      // Store the promise, not the result
      cache.set(key, result)
      // On error, remove from cache
      result.catch(() => cache.delete(key))
      return result
    }

    cache.set(key, result)
    return result
  }

  // Expose cache to allow manual invalidation
  memoized.cache = cache
  memoized.clearCache = () => cache.clear()

  return memoized
}

/**
 * Decorator that limits the number of calls per period.
 * @param {Function} fn - The function to limit.
 * @param {number} maxCalls - Maximum number of calls.
 * @param {number} period - Period in milliseconds.
 * @returns {Function} The limited function.
 *
 * @example
 * const limitedAPI = withRateLimit(
 *   fetchAPI,
 *   10,
 *   60000 // Max 10 calls per minute
 * )
 */
function withRateLimit(fn, maxCalls, period) {
  const calls = []

  return function (...args) {
    const now = Date.now()

    // Clean up expired calls
    while (calls.length > 0 && calls[0] <= now - period) {
      calls.shift()
    }

    if (calls.length >= maxCalls) {
      const waitTime = calls[0] + period - now
      console.warn(
        `Rate limit reached. Try again in ${Math.ceil(waitTime / 1000)}s`,
      )
      return Promise.reject(new Error('Rate limit exceeded'))
    }

    calls.push(now)
    return fn.apply(this, args)
  }
}

/**
 * Decorator that adds argument validation.
 * @param {Function} fn - The function to decorate.
 * @param {Function[]} validators - Validation functions for each argument.
 * @returns {Function} The decorated function.
 *
 * @example
 * const divide = withValidation(
 *   (a, b) => a / b,
 *   [
 *     (a) => typeof a === 'number' || 'First argument must be a number',
 *     (b) => b !== 0 || 'Division by zero not allowed'
 *   ]
 * )
 */
function withValidation(fn, validators) {
  return function (...args) {
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const result = validator(args[i])

      if (result !== true) {
        throw new Error(
          typeof result === 'string' ? result : `Argument ${i} invalid`,
        )
      }
    }

    return fn.apply(this, args)
  }
}

/**
 * Composes multiple decorators together.
 * @param {...Function} decorators - Decorators to compose (applied right to left).
 * @returns {Function} Function that applies all decorators.
 *
 * @example
 * const enhancedFn = compose(
 *   (fn) => withLogging(fn, 'myFn'),
 *   (fn) => withErrorHandling(fn, null),
 *   (fn) => withMemoization(fn)
 * )(originalFn)
 */
function compose(...decorators) {
  return function (fn) {
    return decorators.reduceRight(
      (decorated, decorator) => decorator(decorated),
      fn,
    )
  }
}
