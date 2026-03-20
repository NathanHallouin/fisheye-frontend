/**
 * Centralized event bus (Observer/Pub-Sub Pattern).
 *
 * @description
 * Allows components to communicate without knowing each other directly.
 * A component can emit an event, and all subscribers receive it.
 *
 * CONCEPT: Observer Pattern (Pub/Sub)
 *
 * - Publisher (emitter): emits events without knowing who is listening
 * - Subscriber: listens to events without knowing who emits
 * - Event Bus: intermediary that routes events
 *
 * Advantages:
 * - Decoupling: components don't depend on each other
 * - Flexibility: easily add/remove subscribers
 * - Testability: can mock the EventBus
 *
 * TWO IMPLEMENTATIONS:
 * 1. Based on native EventTarget (simpler, integrated with DOM)
 * 2. Based on Map (more control, works outside DOM)
 */
class EventBus {
  /**
   * Singleton instance.
   * @type {EventBus|null}
   */
  static _instance = null

  /**
   * Returns the unique EventBus instance.
   * @returns {EventBus} The unique instance.
   */
  static getInstance() {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus()
    }
    return EventBus._instance
  }

  /**
   * Creates an EventBus instance.
   *
   * @description
   * Two approaches can be used:
   * 1. Native EventTarget: leverages the DOM API
   * 2. Custom Map: more control
   *
   * Here we combine both to demonstrate the two approaches.
   */
  constructor() {
    /**
     * CONCEPT: EventTarget
     *
     * EventTarget is the base class for anything that can
     * emit/receive events in the DOM.
     * We can create our own EventTarget!
     */
    this._target = new EventTarget()

    /**
     * Map to store listeners with more metadata.
     * Allows supporting advanced features like once, priority, etc.
     */
    this._listeners = new Map()

    // Event history (for debugging)
    this._history = []
    this._historySize = 50
  }

  /**
   * Subscribes to an event.
   *
   * @description
   * CONCEPT: Subscribe
   * The callback will be called each time the event is emitted.
   *
   * @param {string} eventName - Event name.
   * @param {Function} callback - Function to call.
   * @param {Object} [options] - Subscription options.
   * @param {boolean} [options.once=false] - Unsubscribe after the first call.
   * @param {number} [options.priority=0] - Priority (higher = called first).
   * @returns {Function} Function to unsubscribe.
   *
   * @example
   * const unsubscribe = eventBus.on('user-login', (data) => {
   *   console.log('User logged in:', data.username)
   * })
   *
   * // Later, to unsubscribe:
   * unsubscribe()
   */
  on(eventName, callback, options = {}) {
    const { once = false, priority = 0 } = options

    // Create the listener list if it doesn't exist
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, [])
    }

    // Add the listener with its metadata
    const listener = { callback, once, priority }
    const listeners = this._listeners.get(eventName)
    listeners.push(listener)

    // Sort by priority (highest first)
    listeners.sort((a, b) => b.priority - a.priority)

    // Return an unsubscribe function
    return () => this.off(eventName, callback)
  }

  /**
   * Subscribes to an event for ONE call only.
   *
   * @param {string} eventName - Event name.
   * @param {Function} callback - Function to call.
   * @returns {Function} Function to unsubscribe.
   */
  once(eventName, callback) {
    return this.on(eventName, callback, { once: true })
  }

  /**
   * Unsubscribes from an event.
   *
   * @param {string} eventName - Event name.
   * @param {Function} callback - Function to remove.
   */
  off(eventName, callback) {
    const listeners = this._listeners.get(eventName)
    if (!listeners) return

    const index = listeners.findIndex((l) => l.callback === callback)
    if (index !== -1) {
      listeners.splice(index, 1)
    }

    // Clean up if no more listeners
    if (listeners.length === 0) {
      this._listeners.delete(eventName)
    }
  }

  /**
   * Emits an event.
   *
   * @description
   * CONCEPT: Emit (Publish)
   * All subscribers will be notified with the provided data.
   *
   * @param {string} eventName - Event name.
   * @param {*} [data] - Data to transmit.
   *
   * @example
   * eventBus.emit('user-login', { username: 'john', timestamp: Date.now() })
   */
  emit(eventName, data) {
    // Add to history
    this._addToHistory(eventName, data)

    const listeners = this._listeners.get(eventName)
    if (!listeners || listeners.length === 0) return

    // Copy the list to avoid issues if a listener unsubscribes
    const listenersCopy = [...listeners]

    // Call each listener
    listenersCopy.forEach((listener) => {
      try {
        listener.callback(data)

        // If once=true, unsubscribe after the first call
        if (listener.once) {
          this.off(eventName, listener.callback)
        }
      } catch (error) {
        console.error(`EventBus: Error in listener for "${eventName}"`, error)
      }
    })
  }

  /**
   * Emits an event asynchronously.
   *
   * @description
   * Uses setTimeout(0) to defer the emission,
   * allowing other code to execute first.
   *
   * @param {string} eventName - Event name.
   * @param {*} [data] - Data to transmit.
   * @returns {Promise<void>} Promise resolved after emission.
   */
  emitAsync(eventName, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(eventName, data)
        resolve()
      }, 0)
    })
  }

  /**
   * Checks if an event has subscribers.
   *
   * @param {string} eventName - Event name.
   * @returns {boolean} True if subscribers exist.
   */
  hasListeners(eventName) {
    const listeners = this._listeners.get(eventName)
    return listeners && listeners.length > 0
  }

  /**
   * Returns the number of subscribers for an event.
   *
   * @param {string} eventName - Event name.
   * @returns {number} The number of subscribers.
   */
  listenerCount(eventName) {
    const listeners = this._listeners.get(eventName)
    return listeners ? listeners.length : 0
  }

  /**
   * Removes all subscribers from an event.
   *
   * @param {string} eventName - Event name.
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this._listeners.delete(eventName)
    } else {
      this._listeners.clear()
    }
  }

  /**
   * Adds an event to the history.
   *
   * @param {string} eventName - Event name.
   * @param {*} data - Event data.
   * @private
   */
  _addToHistory(eventName, data) {
    this._history.push({
      event: eventName,
      data,
      timestamp: Date.now(),
    })

    // Limit history size
    if (this._history.length > this._historySize) {
      this._history.shift()
    }
  }

  /**
   * Returns the event history.
   *
   * @returns {Array} The history.
   */
  getHistory() {
    return [...this._history]
  }

  /**
   * Clears the history.
   */
  clearHistory() {
    this._history = []
  }

  /**
   * Returns all event names that have subscribers.
   *
   * @returns {string[]} The event names.
   */
  getEventNames() {
    return [...this._listeners.keys()]
  }

  /**
   * Creates an event namespace.
   *
   * @description
   * Allows grouping events under a common prefix.
   *
   * @param {string} namespace - The namespace prefix.
   * @returns {Object} An object with scoped methods.
   *
   * @example
   * const userEvents = eventBus.namespace('user')
   * userEvents.on('login', callback)  // Listens to 'user:login'
   * userEvents.emit('logout', data)   // Emits 'user:logout'
   */
  namespace(namespace) {
    const prefix = `${namespace}:`

    return {
      on: (event, callback, options) =>
        this.on(`${prefix}${event}`, callback, options),
      once: (event, callback) => this.once(`${prefix}${event}`, callback),
      off: (event, callback) => this.off(`${prefix}${event}`, callback),
      emit: (event, data) => this.emit(`${prefix}${event}`, data),
    }
  }
}

// Predefined events for the Fisheye application
EventBus.Events = {
  // Navigation
  PAGE_CHANGE: 'page:change',
  FILTER_CHANGE: 'filter:change',

  // User
  FAVORITE_ADD: 'favorite:add',
  FAVORITE_REMOVE: 'favorite:remove',
  LIKE_TOGGLE: 'like:toggle',

  // UI
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  LIGHTBOX_OPEN: 'lightbox:open',
  LIGHTBOX_CLOSE: 'lightbox:close',

  // Data
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
}
