class Api {
  /**
   * @param {string} url - The API URL.
   * @param {Object} [options] - Configuration options.
   * @param {boolean} [options.useCache=true] - Use cache.
   * @param {number} [options.cacheTTL=300000] - Cache TTL (5 min by default).
   */
  constructor(url, options = {}) {
    this._url = url
    this._useCache = options.useCache !== false
    this._cacheTTL = options.cacheTTL || 300000
    this._cache =
      typeof CacheManager !== 'undefined' ? CacheManager.getInstance() : null
  }

  /**
   * Performs a GET request to retrieve data.
   *
   * @description
   * CONCEPT: Promise Cache
   * If caching is enabled, we use the CacheManager to avoid
   * redundant requests. The cache stores the Promise itself,
   * which prevents duplicate requests even if they are simultaneous.
   *
   * @async
   * @returns {Promise<Object|null>} The JSON data or null on error.
   */
  async get() {
    // If cache is enabled and available
    if (this._useCache && this._cache) {
      return this._cache.get(this._url, () => this._fetch(), this._cacheTTL)
    }

    // Otherwise, direct request
    return this._fetch()
  }

  /**
   * Performs the fetch request.
   *
   * @async
   * @returns {Promise<Object|null>} The JSON data or null on error.
   * @private
   */
  async _fetch() {
    try {
      const res = await fetch(this._url)
      return await res.json()
    } catch (err) {
      console.error('An error occurred', err)
      return null
    }
  }

  /**
   * Forces data reload (ignores cache).
   *
   * @async
   * @returns {Promise<Object|null>} The JSON data or null on error.
   */
  async refresh() {
    if (this._cache) {
      this._cache.invalidate(this._url)
    }
    return this.get()
  }

  /**
   * Invalidates the cache for this URL.
   */
  invalidateCache() {
    if (this._cache) {
      this._cache.invalidate(this._url)
    }
  }
}

/**
 * Class to retrieve photographer data via the API.
 * @extends Api
 */
class PhotographerApi extends Api {
  /**
   * @param {string} url - The photographers API URL.
   */
  constructor(url) {
    super(url)
  }
  /**
   * Retrieves photographer data.
   * @async
   * @returns {Promise<Object|null>} The JSON data or null on error.
   */
  async getPhotographers() {
    return await this.get()
  }
}
