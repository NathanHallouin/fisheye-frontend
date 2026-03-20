/**
 * Cache manager for asynchronous data.
 *
 * @description
 * Caches API call results to avoid redundant requests.
 * Supports a configurable TTL (Time To Live).
 *
 * KEY CONCEPTS:
 *
 * 1. Map: Data structure for key-value storage
 *    More performant than Object for frequent additions/deletions
 *
 * 2. Promise caching: We cache the Promise, not the result
 *    This prevents duplicate requests even if they are simultaneous
 *
 * 3. TTL (Time To Live): Cache validity duration
 *    After expiration, data is reloaded
 *
 * 4. Memoization: Reusing results of expensive computations
 */
class CacheManager {
  /**
   * Singleton instance.
   * @type {CacheManager|null}
   */
  static _instance = null

  /**
   * Returns the unique CacheManager instance.
   *
   * @param {number} [ttl] - Default TTL in milliseconds.
   * @returns {CacheManager} The unique instance.
   */
  static getInstance(ttl) {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager(ttl)
    }
    return CacheManager._instance
  }

  /**
   * Creates a CacheManager instance.
   *
   * @param {number} [ttl=300000] - Default TTL (5 minutes).
   */
  constructor(ttl = 300000) {
    /**
     * CONCEPT: Map vs Object
     *
     * Map is preferred for caching because:
     * - Better performance for frequent additions/deletions
     * - Keys of any type (not just strings)
     * - Built-in .size method
     * - Iteration in insertion order
     */
    this._cache = new Map()
    this._defaultTTL = ttl
  }

  /**
   * Retrieves a value from cache or obtains it via fetchFn.
   *
   * @description
   * KEY CONCEPT: Promise caching
   *
   * We store the PROMISE in the cache, not the result.
   * Thus, if two calls arrive simultaneously:
   * - The first creates the Promise and caches it
   * - The second retrieves the same Promise
   * - Both await the same resolution
   * - Only one network request is made
   *
   * @param {string} key - The cache key.
   * @param {Function} fetchFn - Async function that retrieves the data.
   * @param {number} [ttl] - Specific TTL for this entry.
   * @returns {Promise<*>} The data (from cache or fetchFn).
   *
   * @example
   * const data = await cache.get('photographers', async () => {
   *   const response = await fetch('/api/photographers')
   *   return response.json()
   * })
   */
  async get(key, fetchFn, ttl = this._defaultTTL) {
    const cached = this._cache.get(key)

    // Check if cache is valid
    if (cached && this._isValid(cached, ttl)) {
      // Return the cached Promise (may be pending or resolved)
      return cached.promise
    }

    // Create a new cache entry
    const entry = {
      promise: fetchFn(), // Store the Promise, not the result
      timestamp: Date.now(),
    }

    this._cache.set(key, entry)

    // Handle errors: invalidate cache if call fails
    entry.promise.catch(() => {
      // Remove from cache only if it's still the same entry
      if (this._cache.get(key) === entry) {
        this._cache.delete(key)
      }
    })

    return entry.promise
  }

  /**
   * Checks if a cache entry is still valid.
   *
   * @param {Object} entry - The cache entry.
   * @param {number} ttl - The TTL to check.
   * @returns {boolean} True if valid.
   * @private
   */
  _isValid(entry, ttl) {
    const age = Date.now() - entry.timestamp
    return age < ttl
  }

  /**
   * Sets a value in the cache.
   *
   * @param {string} key - The cache key.
   * @param {*} value - The value to cache.
   */
  set(key, value) {
    this._cache.set(key, {
      promise: Promise.resolve(value),
      timestamp: Date.now(),
    })
  }

  /**
   * Checks if a key exists in the cache (and is valid).
   *
   * @param {string} key - The key to check.
   * @param {number} [ttl] - Specific TTL.
   * @returns {boolean} True if the key exists and is valid.
   */
  has(key, ttl = this._defaultTTL) {
    const cached = this._cache.get(key)
    return cached && this._isValid(cached, ttl)
  }

  /**
   * Invalidates a cache entry.
   *
   * @param {string} key - The key to invalidate.
   */
  invalidate(key) {
    this._cache.delete(key)
  }

  /**
   * Invalidates entries matching a pattern.
   *
   * @param {string|RegExp} pattern - The pattern to match.
   *
   * @example
   * cache.invalidatePattern(/^photographer_/)
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this._cache.keys()) {
      if (regex.test(key)) {
        this._cache.delete(key)
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this._cache.clear()
  }

  /**
   * Returns cache statistics.
   *
   * @returns {Object} The statistics.
   */
  getStats() {
    let validCount = 0
    let expiredCount = 0

    for (const entry of this._cache.values()) {
      if (this._isValid(entry, this._defaultTTL)) {
        validCount++
      } else {
        expiredCount++
      }
    }

    return {
      size: this._cache.size,
      valid: validCount,
      expired: expiredCount,
      keys: [...this._cache.keys()],
    }
  }

  /**
   * Cleans up expired entries.
   *
   * @description
   * Call periodically to free memory.
   *
   * @returns {number} The number of entries removed.
   */
  cleanup() {
    let removed = 0

    for (const [key, entry] of this._cache.entries()) {
      if (!this._isValid(entry, this._defaultTTL)) {
        this._cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Preloads data into the cache.
   *
   * @description
   * Useful for loading data that will be needed soon (prefetching).
   *
   * @param {string} key - The cache key.
   * @param {Function} fetchFn - Async function that retrieves the data.
   * @returns {Promise<void>}
   */
  async prefetch(key, fetchFn) {
    if (!this.has(key)) {
      await this.get(key, fetchFn)
    }
  }

  /**
   * Wrapper to create a memoized function.
   *
   * @description
   * CONCEPT: Memoization
   * Transforms a function into a memoized version that caches its results.
   *
   * @param {Function} fn - The function to memoize.
   * @param {Function} [keyGenerator] - Function to generate the cache key.
   * @param {number} [ttl] - TTL for results.
   * @returns {Function} The memoized function.
   *
   * @example
   * const memoizedFetch = cache.memoize(
   *   (id) => fetch(`/api/user/${id}`).then(r => r.json()),
   *   (id) => `user_${id}`,
   *   60000 // 1 minute
   * )
   */
  memoize(fn, keyGenerator, ttl) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      return this.get(key, () => fn(...args), ttl)
    }
  }
}
