/**
 * Utility for parallel resource loading.
 *
 * @description
 * Loads multiple resources in parallel using Promise.all()
 * or Promise.allSettled() depending on needs.
 *
 * KEY CONCEPTS:
 *
 * 1. Promise.all(promises)
 *    - Waits for ALL promises to be resolved
 *    - Fails as soon as ONE promise fails (fail-fast)
 *    - Returns an array of results in the same order
 *
 * 2. Promise.allSettled(promises)
 *    - Waits for ALL promises to complete (resolved OR rejected)
 *    - Never "fails" - always returns an array
 *    - Each result has { status: 'fulfilled'|'rejected', value|reason }
 *
 * 3. Promise.race(promises)
 *    - Returns as soon as the FIRST promise completes
 *    - Useful for timeouts
 *
 * 4. Promise.any(promises)
 *    - Returns as soon as the FIRST promise SUCCEEDS
 *    - Fails only if ALL fail
 */
class ParallelLoader {
  /**
   * Loads multiple URLs in parallel.
   *
   * @description
   * CONCEPT: Promise.all()
   * All requests start at the same time.
   * We wait for ALL to complete.
   * If one fails, everything fails (fail-fast).
   *
   * @param {string[]} urls - The URLs to load.
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object[]>} The loaded data.
   *
   * @example
   * const [users, posts] = await ParallelLoader.loadAll([
   *   '/api/users',
   *   '/api/posts'
   * ])
   */
  static async loadAll(urls, options = {}) {
    // map() creates an array of Promises
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => res.json()),
    )

    // Promise.all waits for ALL promises
    // If one fails, the error is propagated
    return Promise.all(promises)
  }

  /**
   * Loads multiple URLs with individual error handling.
   *
   * @description
   * CONCEPT: Promise.allSettled()
   * Unlike Promise.all, doesn't fail if one request fails.
   * ALWAYS returns an array of results.
   *
   * Each result is either:
   * - { status: 'fulfilled', value: data }
   * - { status: 'rejected', reason: error }
   *
   * @param {string[]} urls - The URLs to load.
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object[]>} Results with status.
   *
   * @example
   * const results = await ParallelLoader.loadAllSettled([
   *   '/api/users',
   *   '/api/invalid-endpoint'  // Doesn't cause others to fail
   * ])
   *
   * results.forEach((result, i) => {
   *   if (result.status === 'fulfilled') {
   *     console.log('Success:', result.value)
   *   } else {
   *     console.log('Error:', result.reason)
   *   }
   * })
   */
  static async loadAllSettled(urls, options = {}) {
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => res.json()),
    )

    // Promise.allSettled never fails
    return Promise.allSettled(promises)
  }

  /**
   * Loads resources with a progress report.
   *
   * @description
   * Combines Promise.allSettled with a progress callback
   * to track loading in real time.
   *
   * @param {string[]} urls - The URLs to load.
   * @param {Function} onProgress - Callback (loaded, total, result).
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object[]>} Results with status.
   */
  static async loadWithProgress(urls, onProgress, options = {}) {
    let loaded = 0
    const total = urls.length
    const results = new Array(total)

    // Create promises with individual tracking
    const promises = urls.map(async (url, index) => {
      try {
        const response = await fetch(url, options)
        const data = await response.json()

        results[index] = { status: 'fulfilled', value: data }
      } catch (error) {
        results[index] = { status: 'rejected', reason: error }
      } finally {
        loaded++
        // Call the progress callback
        onProgress(loaded, total, results[index])
      }
    })

    // Wait for all promises
    await Promise.all(promises)

    return results
  }

  /**
   * Loads the first available resource.
   *
   * @description
   * CONCEPT: Promise.race()
   * Returns as soon as the FIRST promise completes.
   * Useful for fallback systems or timeouts.
   *
   * @param {string[]} urls - The URLs to try.
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object>} The data from the first response.
   */
  static async loadFirst(urls, options = {}) {
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => res.json()),
    )

    return Promise.race(promises)
  }

  /**
   * Loads with a timeout.
   *
   * @description
   * CONCEPT: Promise.race() for timeout
   * We create a "race" between the request and a timer.
   * If the timer wins, we reject with a timeout error.
   *
   * @param {string} url - The URL to load.
   * @param {number} timeout - Timeout in milliseconds.
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object>} The data or timeout error.
   */
  static async loadWithTimeout(url, timeout, options = {}) {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms for ${url}`))
      }, timeout)
    })

    // Race between the request and the timeout
    return Promise.race([
      fetch(url, options).then((res) => res.json()),
      timeoutPromise,
    ])
  }

  /**
   * Loads the first success among multiple URLs.
   *
   * @description
   * CONCEPT: Promise.any()
   * Returns as soon as ONE promise SUCCEEDS.
   * Fails only if ALL fail (AggregateError).
   *
   * Useful for fallback systems (trying multiple CDNs).
   *
   * @param {string[]} urls - The URLs to try.
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object>} The data from the first success.
   */
  static async loadFirstSuccess(urls, options = {}) {
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      }),
    )

    return Promise.any(promises)
  }

  /**
   * Loads resources in batches.
   *
   * @description
   * To avoid overloading the server, we load in batches
   * of N requests at a time.
   *
   * @param {string[]} urls - The URLs to load.
   * @param {number} batchSize - Batch size.
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object[]>} All results.
   */
  static async loadInBatches(urls, batchSize = 5, options = {}) {
    const results = []

    // Split into batches
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)

      // Load batch in parallel
      const batchResults = await this.loadAllSettled(batch, options)

      // Add to results
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Retries a request on failure.
   *
   * @description
   * Retry pattern with exponential backoff.
   *
   * @param {string} url - The URL to load.
   * @param {number} maxRetries - Maximum number of attempts.
   * @param {number} baseDelay - Base delay between attempts (ms).
   * @param {Object} [options] - Fetch options.
   * @returns {Promise<Object>} The data or error after all attempts.
   */
  static async loadWithRetry(
    url,
    maxRetries = 3,
    baseDelay = 1000,
    options = {},
  ) {
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        lastError = error
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries} failed:`,
          error.message,
        )

        // Wait before next attempt (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * Extracts successful values from an allSettled result.
   *
   * @param {Object[]} results - Results from Promise.allSettled.
   * @returns {*[]} The values of fulfilled promises.
   */
  static extractFulfilled(results) {
    return results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  }

  /**
   * Extracts errors from an allSettled result.
   *
   * @param {Object[]} results - Results from Promise.allSettled.
   * @returns {Error[]} The reasons of rejected promises.
   */
  static extractRejected(results) {
    return results.filter((r) => r.status === 'rejected').map((r) => r.reason)
  }
}
