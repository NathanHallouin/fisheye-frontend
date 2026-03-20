/**
 * URL state manager with History API.
 *
 * @description
 * Allows synchronizing the application state with the browser URL.
 * This enables:
 * - Shareable URLs (e.g., ?tags=portrait,travel&search=paris)
 * - Browser back/forward navigation
 * - State restoration on page load
 *
 * KEY CONCEPTS:
 *
 * 1. URLSearchParams
 *    API to manipulate URL query parameters.
 *    Cleaner than manipulating strings manually.
 *
 * 2. history.pushState()
 *    Adds an entry to the browser history WITHOUT reloading the page.
 *    Allows changing the visible URL while staying on the same page.
 *
 * 3. history.replaceState()
 *    Replaces the current history entry (no addition).
 *    Useful for updating the URL without polluting the history.
 *
 * 4. popstate event
 *    Triggered when the user navigates with back/forward buttons.
 *    Allows reacting to history changes.
 */
class UrlStateManager {
  /**
   * Unique instance (Singleton).
   * @type {UrlStateManager|null}
   */
  static _instance = null

  /**
   * Name of the event emitted on state changes.
   * @type {string}
   */
  static STATE_CHANGE_EVENT = 'url-state-changed'

  /**
   * Returns the unique instance of UrlStateManager.
   *
   * @returns {UrlStateManager} The unique instance.
   */
  static getInstance() {
    if (!UrlStateManager._instance) {
      UrlStateManager._instance = new UrlStateManager()
    }
    return UrlStateManager._instance
  }

  /**
   * Creates a UrlStateManager instance.
   * Initializes popstate listening.
   */
  constructor() {
    this._state = this._parseCurrentUrl()
    this._initPopStateListener()
  }

  /**
   * Initializes the popstate event listener.
   *
   * @description
   * CONCEPT: popstate event
   * This event is triggered when the user clicks
   * the browser's back/forward buttons.
   * NOTE: popstate is NOT triggered by pushState/replaceState.
   *
   * @private
   */
  _initPopStateListener() {
    window.addEventListener('popstate', (event) => {
      // event.state contains the object passed to pushState/replaceState
      // If null, parse the current URL
      this._state = event.state || this._parseCurrentUrl()
      this._emitChange()
    })
  }

  /**
   * Parses the current URL and extracts parameters.
   *
   * @description
   * CONCEPT: URLSearchParams
   * Allows reading and manipulating URL parameters easily.
   *
   * @example
   * // URL: ?tags=portrait,travel&search=paris
   * // Returns: { tags: ['portrait', 'travel'], search: 'paris' }
   *
   * @returns {Object} The state extracted from the URL.
   * @private
   */
  _parseCurrentUrl() {
    // window.location.search contains the query string (e.g., "?tags=portrait")
    const params = new URLSearchParams(window.location.search)

    return {
      tags: this._parseArrayParam(params.get('tags')),
      search: params.get('search') || '',
      sort: params.get('sort') || '',
      order: params.get('order') || 'asc',
    }
  }

  /**
   * Parses an array-type parameter (comma-separated values).
   *
   * @param {string|null} value - The parameter value.
   * @returns {Array<string>} The array of values.
   * @private
   */
  _parseArrayParam(value) {
    if (!value || value.trim() === '') {
      return []
    }
    // "portrait,travel" → ['portrait', 'travel']
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  }

  /**
   * Builds a URL with state parameters.
   *
   * @description
   * CONCEPT: URLSearchParams to build a URL
   * Safer than string concatenation (automatic encoding).
   *
   * @param {Object} state - The state to encode in the URL.
   * @returns {string} The built URL.
   * @private
   */
  _buildUrl(state) {
    const params = new URLSearchParams()

    // Add tags if there are any
    if (state.tags && state.tags.length > 0) {
      params.set('tags', state.tags.join(','))
    }

    // Add search if not empty
    if (state.search && state.search.trim() !== '') {
      params.set('search', state.search.trim())
    }

    // Add sort if defined
    if (state.sort && state.sort !== '') {
      params.set('sort', state.sort)
    }

    // Add order if different from default value
    if (state.order && state.order !== 'asc') {
      params.set('order', state.order)
    }

    // Build the final URL
    const queryString = params.toString()
    // window.location.pathname = the path without parameters (e.g., "/index.html")
    return queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname
  }

  /**
   * Emits a custom event to notify state changes.
   *
   * @private
   */
  _emitChange() {
    const event = new CustomEvent(UrlStateManager.STATE_CHANGE_EVENT, {
      detail: { ...this._state },
    })
    document.dispatchEvent(event)
  }

  /**
   * Updates the state and URL.
   *
   * @description
   * CONCEPT: history.pushState(state, title, url)
   * - state: A JavaScript object associated with this history entry
   * - title: Ignored by most browsers (pass '')
   * - url: The new URL to display
   *
   * pushState ADDS an entry to the history.
   * The user will be able to go back.
   *
   * @param {Object} newState - The new partial state.
   * @param {boolean} [replace=false] - If true, use replaceState instead of pushState.
   */
  setState(newState, replace = false) {
    // Merge with current state
    this._state = {
      ...this._state,
      ...newState,
    }

    const url = this._buildUrl(this._state)

    if (replace) {
      // replaceState replaces the current entry (no new entry)
      // Useful for frequent updates (e.g., while typing)
      history.replaceState(this._state, '', url)
    } else {
      // pushState adds a new entry
      // The user will be able to go back
      history.pushState(this._state, '', url)
    }
  }

  /**
   * Updates a single state parameter.
   *
   * @param {string} key - The parameter key.
   * @param {*} value - The new value.
   * @param {boolean} [replace=false] - If true, use replaceState.
   */
  setParam(key, value, replace = false) {
    this.setState({ [key]: value }, replace)
  }

  /**
   * Returns the current state.
   *
   * @returns {Object} A copy of the current state.
   */
  getState() {
    return { ...this._state }
  }

  /**
   * Returns a specific state parameter.
   *
   * @param {string} key - The parameter key.
   * @returns {*} The parameter value.
   */
  getParam(key) {
    return this._state[key]
  }

  /**
   * Checks if a tag is active.
   *
   * @param {string} tag - The tag to check.
   * @returns {boolean} True if the tag is active.
   */
  hasTag(tag) {
    return this._state.tags.includes(tag)
  }

  /**
   * Adds a tag to the state.
   *
   * @param {string} tag - The tag to add.
   */
  addTag(tag) {
    if (!this.hasTag(tag)) {
      this.setState({
        tags: [...this._state.tags, tag],
      })
    }
  }

  /**
   * Removes a tag from the state.
   *
   * @param {string} tag - The tag to remove.
   */
  removeTag(tag) {
    this.setState({
      tags: this._state.tags.filter((t) => t !== tag),
    })
  }

  /**
   * Toggles a tag state (adds if absent, removes if present).
   *
   * @param {string} tag - The tag to toggle.
   */
  toggleTag(tag) {
    if (this.hasTag(tag)) {
      this.removeTag(tag)
    } else {
      this.addTag(tag)
    }
  }

  /**
   * Resets all filters.
   */
  clearFilters() {
    this.setState({
      tags: [],
      search: '',
      sort: '',
      order: 'asc',
    })
  }

  /**
   * Listens to URL state changes.
   *
   * @param {Function} callback - The function to call on changes.
   * @returns {Function} A function to stop listening.
   */
  onChange(callback) {
    const handler = (event) => callback(event.detail)
    document.addEventListener(UrlStateManager.STATE_CHANGE_EVENT, handler)

    // Return a cleanup function
    return () => {
      document.removeEventListener(UrlStateManager.STATE_CHANGE_EVENT, handler)
    }
  }

  /**
   * Generates a shareable URL with the current state.
   *
   * @returns {string} The complete shareable URL.
   */
  getShareableUrl() {
    return window.location.origin + this._buildUrl(this._state)
  }

  /**
   * Copies the shareable URL to the clipboard.
   *
   * @async
   * @returns {Promise<boolean>} True if copy succeeded.
   */
  async copyShareableUrl() {
    try {
      await navigator.clipboard.writeText(this.getShareableUrl())
      return true
    } catch (error) {
      console.error('Unable to copy URL:', error)
      return false
    }
  }
}
