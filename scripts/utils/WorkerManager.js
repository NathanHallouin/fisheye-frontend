/**
 * Web Workers manager.
 *
 * CONCEPT: Web Worker Management
 *
 * This class encapsulates Web Workers complexity:
 * - Creation and lifecycle management
 * - Communication via Promises (simpler than callbacks)
 * - Error handling
 * - Worker pool for parallel tasks
 */

/**
 * Manager for easy communication with a Web Worker.
 */
class WorkerManager {
  /**
   * Creates a worker manager.
   * @param {string} workerPath - Path to the worker file.
   */
  constructor(workerPath) {
    /**
     * Path to the worker file.
     * @type {string}
     * @private
     */
    this._workerPath = workerPath

    /**
     * Worker instance.
     * @type {Worker|null}
     * @private
     */
    this._worker = null

    /**
     * Map of pending promises.
     * @type {Map<string, {resolve: Function, reject: Function}>}
     * @private
     */
    this._pending = new Map()

    /**
     * Counter for generating unique IDs.
     * @type {number}
     * @private
     */
    this._idCounter = 0

    /**
     * Worker state.
     * @type {boolean}
     * @private
     */
    this._isReady = false

    this._initWorker()
  }

  /**
   * Initializes the worker and configures handlers.
   * @private
   */
  _initWorker() {
    try {
      this._worker = new Worker(this._workerPath)

      this._worker.onmessage = (e) => this._handleMessage(e)
      this._worker.onerror = (e) => this._handleError(e)

      this._isReady = true
    } catch (error) {
      console.error('[WorkerManager] Unable to create worker:', error)
      this._isReady = false
    }
  }

  /**
   * Handles messages received from the worker.
   * @param {MessageEvent} e - The message event.
   * @private
   */
  _handleMessage(e) {
    const { type, id, result, error } = e.data

    const pending = this._pending.get(id)
    if (!pending) {
      console.warn(
        '[WorkerManager] Message received without corresponding request:',
        id,
      )
      return
    }

    this._pending.delete(id)

    if (type === 'SUCCESS') {
      pending.resolve(result)
    } else if (type === 'ERROR') {
      pending.reject(new Error(error))
    }
  }

  /**
   * Handles worker errors.
   * @param {ErrorEvent} e - The error event.
   * @private
   */
  _handleError(e) {
    console.error('[WorkerManager] Worker error:', e.message)

    // Reject all pending promises
    this._pending.forEach((pending) => {
      pending.reject(new Error(`Worker error: ${e.message}`))
    })
    this._pending.clear()
  }

  /**
   * Generates a unique ID for a request.
   * @returns {string} The unique ID.
   * @private
   */
  _generateId() {
    return `req_${++this._idCounter}_${Date.now()}`
  }

  /**
   * Sends a request to the worker and returns a Promise.
   * @param {string} type - The operation type.
   * @param {Object} payload - The data to send.
   * @param {number} [timeout=30000] - Timeout in ms.
   * @returns {Promise<*>} The operation result.
   * @private
   */
  _send(type, payload, timeout = 30000) {
    if (!this._isReady || !this._worker) {
      return Promise.reject(new Error('Worker not available'))
    }

    return new Promise((resolve, reject) => {
      const id = this._generateId()

      // Configure timeout
      const timeoutId = setTimeout(() => {
        this._pending.delete(id)
        reject(
          new Error(`Timeout: operation ${type} took more than ${timeout}ms`),
        )
      }, timeout)

      // Store the promise
      this._pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
      })

      // Send to worker
      this._worker.postMessage({ type, payload, id })
    })
  }

  /**
   * Sorts data in the worker.
   * @param {Array} data - The data to sort.
   * @param {string} sortBy - The sort property.
   * @param {string} [order='desc'] - The order ('asc' or 'desc').
   * @returns {Promise<Array>} The sorted data.
   *
   * @example
   * const sorted = await workerManager.sort(media, 'likes', 'desc')
   */
  sort(data, sortBy, order = 'desc') {
    return this._send('SORT', { data, sortBy, order })
  }

  /**
   * Filters data in the worker.
   * @param {Array} data - The data to filter.
   * @param {Object} filters - The filters to apply.
   * @returns {Promise<Array>} The filtered data.
   *
   * @example
   * const filtered = await workerManager.filter(media, { type: 'image' })
   */
  filter(data, filters) {
    return this._send('FILTER', { data, filters })
  }

  /**
   * Sorts and filters data in a single operation.
   * @param {Array} data - The data.
   * @param {Object} filters - The filters.
   * @param {string} sortBy - The sort property.
   * @param {string} [order='desc'] - The sort order.
   * @returns {Promise<Array>} The sorted and filtered data.
   */
  sortAndFilter(data, filters, sortBy, order = 'desc') {
    return this._send('SORT_AND_FILTER', { data, filters, sortBy, order })
  }

  /**
   * Searches within data.
   * @param {Array} data - The data to search.
   * @param {string} query - The search query.
   * @param {string[]} fields - The fields to search.
   * @returns {Promise<Array>} The results.
   *
   * @example
   * const results = await workerManager.search(
   *   photographers,
   *   'paris portrait',
   *   ['name', 'city', 'tagline']
   * )
   */
  search(data, query, fields) {
    return this._send('SEARCH', { data, query, fields })
  }

  /**
   * Aggregates data with grouping.
   * @param {Array} data - The data to aggregate.
   * @param {string} groupBy - The grouping property.
   * @param {Object} aggregations - The aggregations.
   * @returns {Promise<Object>} The aggregated data.
   *
   * @example
   * const stats = await workerManager.aggregate(media, 'photographerId', {
   *   totalLikes: { field: 'likes', operation: 'sum' },
   *   mediaCount: { operation: 'count' }
   * })
   */
  aggregate(data, groupBy, aggregations) {
    return this._send('AGGREGATE', { data, groupBy, aggregations })
  }

  /**
   * Checks if the worker is available.
   * @returns {boolean} True if the worker is ready.
   */
  get isAvailable() {
    return this._isReady && this._worker !== null
  }

  /**
   * Terminates the worker and releases resources.
   */
  terminate() {
    if (this._worker) {
      this._worker.terminate()
      this._worker = null
    }

    // Reject pending promises
    this._pending.forEach((pending) => {
      pending.reject(new Error('Worker terminated'))
    })
    this._pending.clear()

    this._isReady = false
  }

  /**
   * Restarts the worker.
   */
  restart() {
    this.terminate()
    this._initWorker()
  }
}

/**
 * Singleton for the sort/filter worker.
 */
class SortWorker {
  static _instance = null

  /**
   * Returns the unique SortWorker instance.
   * @returns {WorkerManager} The instance.
   */
  static getInstance() {
    if (!SortWorker._instance) {
      SortWorker._instance = new WorkerManager(
        './scripts/workers/sortWorker.js',
      )
    }
    return SortWorker._instance
  }

  /**
   * Checks if Web Workers are supported.
   * @returns {boolean} True if supported.
   */
  static isSupported() {
    return typeof Worker !== 'undefined'
  }
}
