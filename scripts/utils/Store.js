/**
 * Mini Redux - Centralized state manager.
 *
 * CONCEPT: State Management with Flux/Redux Pattern
 *
 * The Redux pattern relies on 3 principles:
 * 1. Single Source of Truth: all state in a single store
 * 2. State is Read-Only: never modify state directly
 * 3. Changes via Pure Functions: reducers are pure functions
 *
 * Unidirectional data flow:
 * Action -> Dispatch -> Reducer -> New State -> Subscribers notified
 */

/**
 * Centralized store for application state management.
 */
class Store {
  /**
   * Singleton instance.
   * @type {Store|null}
   */
  static _instance = null

  /**
   * Returns the unique Store instance.
   * @param {Function} [reducer] - The root reducer (required at creation).
   * @param {Object} [initialState] - Initial state.
   * @returns {Store} The unique instance.
   */
  static getInstance(reducer, initialState) {
    if (!Store._instance) {
      if (!reducer) {
        throw new Error(
          'Store.getInstance requires a reducer at first creation',
        )
      }
      Store._instance = new Store(reducer, initialState)
    }
    return Store._instance
  }

  /**
   * Resets the instance (useful for tests).
   */
  static reset() {
    Store._instance = null
  }

  /**
   * Creates a Store instance.
   * @param {Function} reducer - Function (state, action) => newState.
   * @param {Object} [initialState={}] - Initial state.
   */
  constructor(reducer, initialState = {}) {
    /**
     * The root reducer.
     * @type {Function}
     * @private
     */
    this._reducer = reducer

    /**
     * The current application state.
     * @type {Object}
     * @private
     */
    this._state = initialState

    /**
     * List of functions to call when state changes.
     * @type {Set<Function>}
     * @private
     */
    this._subscribers = new Set()

    /**
     * Middlewares to execute before the reducer.
     * @type {Function[]}
     * @private
     */
    this._middlewares = []

    /**
     * Action history (for debugging).
     * @type {Array}
     * @private
     */
    this._actionHistory = []

    /**
     * History limit.
     * @type {number}
     * @private
     */
    this._historyLimit = 50

    // Dispatch the initial action
    this.dispatch({ type: '@@INIT' })
  }

  /**
   * Returns a copy of the current state.
   *
   * @description
   * CONCEPT: Immutability
   *
   * We return a (shallow) copy of the state to avoid
   * accidental modifications. For deeper state,
   * use structuredClone() or an immutability library.
   *
   * @returns {Object} A copy of the state.
   */
  getState() {
    return { ...this._state }
  }

  /**
   * Dispatches an action to modify the state.
   *
   * @description
   * CONCEPT: Actions and Dispatch
   *
   * An action is an object with:
   * - type: string (required) - describes what happened
   * - payload: any (optional) - additional data
   *
   * The dispatch:
   * 1. Executes middlewares
   * 2. Passes the action to the reducer
   * 3. Updates the state
   * 4. Notifies subscribers
   *
   * @param {Object} action - The action to dispatch.
   * @param {string} action.type - The action type.
   * @param {*} [action.payload] - The action data.
   * @returns {Object} The dispatched action.
   *
   * @example
   * store.dispatch({ type: 'LIKE_MEDIA', payload: { mediaId: 123 } })
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action must have a "type" property of type string')
    }

    // Execute middlewares
    const processedAction = this._runMiddlewares(action)
    if (!processedAction) return action // Middleware cancelled the action

    // Save previous state for comparison
    const prevState = this._state

    // Apply the reducer
    this._state = this._reducer(this._state, processedAction)

    // Log to history
    this._logAction(processedAction, prevState, this._state)

    // Notify subscribers if state changed
    if (this._state !== prevState) {
      this._notifySubscribers()
    }

    return processedAction
  }

  /**
   * Subscribes to state changes.
   *
   * @description
   * CONCEPT: Observer Pattern
   *
   * Components subscribe to the store and are notified
   * when state changes. They can then re-render.
   *
   * @param {Function} callback - Function called with (newState).
   * @returns {Function} Function to unsubscribe.
   *
   * @example
   * const unsubscribe = store.subscribe((state) => {
   *   console.log('New state:', state)
   *   renderUI(state)
   * })
   *
   * // Later, to stop listening:
   * unsubscribe()
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('subscribe expects a function')
    }

    this._subscribers.add(callback)

    // Return the unsubscribe function
    return () => {
      this._subscribers.delete(callback)
    }
  }

  /**
   * Subscribes to a specific part of the state (selector).
   *
   * @description
   * CONCEPT: Selectors
   *
   * Allows reacting only to changes in a specific part
   * of the state, avoiding unnecessary re-renders.
   *
   * @param {Function} selector - Function (state) => partOfState.
   * @param {Function} callback - Function called when the part changes.
   * @returns {Function} Function to unsubscribe.
   *
   * @example
   * const unsubscribe = store.subscribeToSelector(
   *   (state) => state.likes,
   *   (likes) => updateLikesUI(likes)
   * )
   */
  subscribeToSelector(selector, callback) {
    let previousValue = selector(this._state)

    return this.subscribe((state) => {
      const newValue = selector(state)
      if (newValue !== previousValue) {
        previousValue = newValue
        callback(newValue, state)
      }
    })
  }

  /**
   * Adds a middleware.
   *
   * @description
   * CONCEPT: Middleware Pattern
   *
   * Middlewares intercept actions before they
   * reach the reducer. Used for:
   * - Logging
   * - Async actions (thunks)
   * - Analytics
   * - Validation
   *
   * @param {Function} middleware - Function (action, state, next) => action|null.
   *
   * @example
   * store.use((action, state, next) => {
   *   console.log('Action:', action.type)
   *   return next(action) // Continue
   * })
   */
  use(middleware) {
    this._middlewares.push(middleware)
  }

  /**
   * Executes middlewares in chain.
   * @param {Object} action - The action to process.
   * @returns {Object|null} The modified action or null if cancelled.
   * @private
   */
  _runMiddlewares(action) {
    let currentAction = action

    for (const middleware of this._middlewares) {
      const next = (a) => a
      currentAction = middleware(currentAction, this._state, next)

      if (currentAction === null || currentAction === undefined) {
        return null // Action cancelled
      }
    }

    return currentAction
  }

  /**
   * Notifies all subscribers of state change.
   * @private
   */
  _notifySubscribers() {
    const state = this.getState()
    this._subscribers.forEach((callback) => {
      try {
        callback(state)
      } catch (error) {
        console.error('[Store] Error in subscriber:', error)
      }
    })
  }

  /**
   * Adds an action to the history.
   * @param {Object} action - The action.
   * @param {Object} prevState - Previous state.
   * @param {Object} nextState - New state.
   * @private
   */
  _logAction(action, prevState, nextState) {
    this._actionHistory.push({
      action,
      prevState,
      nextState,
      timestamp: Date.now(),
    })

    // Limit history size
    if (this._actionHistory.length > this._historyLimit) {
      this._actionHistory.shift()
    }
  }

  /**
   * Returns the action history (for debugging).
   * @returns {Array} The action history.
   */
  getHistory() {
    return [...this._actionHistory]
  }

  /**
   * Clears the action history.
   */
  clearHistory() {
    this._actionHistory = []
  }
}

// ============================================
// Helpers for creating reducers
// ============================================

/**
 * Combines multiple reducers into one.
 *
 * @description
 * CONCEPT: Reducer Composition
 *
 * Allows dividing the state into "slices" managed by
 * separate reducers, then combining them.
 *
 * @param {Object} reducers - Object { key: reducerFunction }.
 * @returns {Function} The combined reducer.
 *
 * @example
 * const rootReducer = combineReducers({
 *   likes: likesReducer,
 *   filters: filtersReducer,
 *   sort: sortReducer
 * })
 */
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers)

  return function (state = {}, action) {
    let hasChanged = false
    const nextState = {}

    for (const key of reducerKeys) {
      const reducer = reducers[key]
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)

      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }

    return hasChanged ? nextState : state
  }
}

/**
 * Creates a reducer from an action -> handler mapping.
 *
 * @description
 * Simplifies reducer creation by avoiding switch statements.
 *
 * @param {Object} initialState - Initial state.
 * @param {Object} handlers - Mapping { [actionType]: (state, action) => newState }.
 * @returns {Function} The reducer.
 *
 * @example
 * const likesReducer = createReducer({ liked: [] }, {
 *   'LIKE_MEDIA': (state, action) => ({
 *     ...state,
 *     liked: [...state.liked, action.payload.mediaId]
 *   }),
 *   'UNLIKE_MEDIA': (state, action) => ({
 *     ...state,
 *     liked: state.liked.filter(id => id !== action.payload.mediaId)
 *   })
 * })
 */
function createReducer(initialState, handlers) {
  return function (state = initialState, action) {
    const handler = handlers[action.type]
    if (handler) {
      return handler(state, action)
    }
    return state
  }
}

/**
 * Creates an action creator.
 *
 * @description
 * An action creator is a function that returns an action.
 * Avoids creating action objects manually.
 *
 * @param {string} type - The action type.
 * @returns {Function} Function (payload) => action.
 *
 * @example
 * const likeMedia = createAction('LIKE_MEDIA')
 * store.dispatch(likeMedia({ mediaId: 123 }))
 */
function createAction(type) {
  const actionCreator = (payload) => ({ type, payload })
  actionCreator.type = type
  return actionCreator
}

// ============================================
// Ready-to-use middlewares
// ============================================

/**
 * Logging middleware for debugging.
 * @param {Object} action - The action.
 * @param {Object} state - The current state.
 * @param {Function} next - Function to continue.
 * @returns {Object} The action.
 */
function loggerMiddleware(action, state, next) {
  console.group(`[Store] ${action.type}`)
  console.log('Payload:', action.payload)
  console.log('Current state:', state)
  console.groupEnd()
  return next(action)
}

/**
 * Middleware for handling async actions (thunks).
 *
 * @description
 * CONCEPT: Thunks
 *
 * A thunk is a function that returns a function.
 * Allows dispatching async actions.
 *
 * @example
 * // Create a thunk
 * const fetchPhotographers = () => async (dispatch, getState) => {
 *   dispatch({ type: 'FETCH_START' })
 *   try {
 *     const data = await api.getPhotographers()
 *     dispatch({ type: 'FETCH_SUCCESS', payload: data })
 *   } catch (error) {
 *     dispatch({ type: 'FETCH_ERROR', payload: error })
 *   }
 * }
 *
 * // Dispatch the thunk
 * store.dispatch(fetchPhotographers())
 */
function thunkMiddleware(action, state, next) {
  if (typeof action === 'function') {
    return action(
      (a) => Store.getInstance().dispatch(a),
      () => Store.getInstance().getState(),
    )
  }
  return next(action)
}
