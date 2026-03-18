/**
 * Mini Redux - Gestionnaire d'état centralisé.
 *
 * CONCEPT : State Management avec Flux/Redux Pattern
 *
 * Le pattern Redux repose sur 3 principes:
 * 1. Single Source of Truth : tout l'état dans un seul store
 * 2. State is Read-Only : on ne modifie jamais l'état directement
 * 3. Changes via Pure Functions : les reducers sont des fonctions pures
 *
 * Flux de données unidirectionnel:
 * Action -> Dispatch -> Reducer -> New State -> Subscribers notifiés
 */

/**
 * Store centralisé pour la gestion de l'état de l'application.
 */
class Store {
  /**
   * Instance unique (Singleton).
   * @type {Store|null}
   */
  static _instance = null

  /**
   * Retourne l'instance unique du Store.
   * @param {Function} [reducer] - Le reducer racine (requis à la création).
   * @param {Object} [initialState] - État initial.
   * @returns {Store} L'instance unique.
   */
  static getInstance(reducer, initialState) {
    if (!Store._instance) {
      if (!reducer) {
        throw new Error(
          'Store.getInstance requiert un reducer à la première création',
        )
      }
      Store._instance = new Store(reducer, initialState)
    }
    return Store._instance
  }

  /**
   * Réinitialise l'instance (utile pour les tests).
   */
  static reset() {
    Store._instance = null
  }

  /**
   * Crée une instance du Store.
   * @param {Function} reducer - Fonction (state, action) => newState.
   * @param {Object} [initialState={}] - État initial.
   */
  constructor(reducer, initialState = {}) {
    /**
     * Le reducer racine.
     * @type {Function}
     * @private
     */
    this._reducer = reducer

    /**
     * L'état actuel de l'application.
     * @type {Object}
     * @private
     */
    this._state = initialState

    /**
     * Liste des fonctions à appeler quand l'état change.
     * @type {Set<Function>}
     * @private
     */
    this._subscribers = new Set()

    /**
     * Middlewares à exécuter avant le reducer.
     * @type {Function[]}
     * @private
     */
    this._middlewares = []

    /**
     * Historique des actions (pour le debugging).
     * @type {Array}
     * @private
     */
    this._actionHistory = []

    /**
     * Limite de l'historique.
     * @type {number}
     * @private
     */
    this._historyLimit = 50

    // Dispatcher l'action initiale
    this.dispatch({ type: '@@INIT' })
  }

  /**
   * Retourne une copie de l'état actuel.
   *
   * @description
   * CONCEPT : Immutabilité
   *
   * On retourne une copie (shallow) de l'état pour éviter
   * les modifications accidentelles. Pour un état plus profond,
   * utiliser structuredClone() ou une lib d'immutabilité.
   *
   * @returns {Object} Une copie de l'état.
   */
  getState() {
    return { ...this._state }
  }

  /**
   * Dispatch une action pour modifier l'état.
   *
   * @description
   * CONCEPT : Actions et Dispatch
   *
   * Une action est un objet avec:
   * - type: string (obligatoire) - décrit ce qui s'est passé
   * - payload: any (optionnel) - données additionnelles
   *
   * Le dispatch:
   * 1. Exécute les middlewares
   * 2. Passe l'action au reducer
   * 3. Met à jour l'état
   * 4. Notifie les subscribers
   *
   * @param {Object} action - L'action à dispatcher.
   * @param {string} action.type - Le type de l'action.
   * @param {*} [action.payload] - Les données de l'action.
   * @returns {Object} L'action dispatchée.
   *
   * @example
   * store.dispatch({ type: 'LIKE_MEDIA', payload: { mediaId: 123 } })
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action doit avoir une propriété "type" de type string')
    }

    // Exécuter les middlewares
    const processedAction = this._runMiddlewares(action)
    if (!processedAction) return action // Middleware a annulé l'action

    // Sauvegarder l'état précédent pour comparaison
    const prevState = this._state

    // Appliquer le reducer
    this._state = this._reducer(this._state, processedAction)

    // Logger dans l'historique
    this._logAction(processedAction, prevState, this._state)

    // Notifier les subscribers si l'état a changé
    if (this._state !== prevState) {
      this._notifySubscribers()
    }

    return processedAction
  }

  /**
   * Souscrit aux changements d'état.
   *
   * @description
   * CONCEPT : Observer Pattern
   *
   * Les composants s'abonnent au store et sont notifiés
   * quand l'état change. Ils peuvent alors se re-render.
   *
   * @param {Function} callback - Fonction appelée avec (newState).
   * @returns {Function} Fonction pour se désabonner.
   *
   * @example
   * const unsubscribe = store.subscribe((state) => {
   *   console.log('Nouvel état:', state)
   *   renderUI(state)
   * })
   *
   * // Plus tard, pour arrêter d'écouter:
   * unsubscribe()
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('subscribe attend une fonction')
    }

    this._subscribers.add(callback)

    // Retourner la fonction de désabonnement
    return () => {
      this._subscribers.delete(callback)
    }
  }

  /**
   * Souscrit à une partie spécifique de l'état (sélecteur).
   *
   * @description
   * CONCEPT : Selectors
   *
   * Permet de ne réagir qu'aux changements d'une partie
   * spécifique de l'état, évitant les re-renders inutiles.
   *
   * @param {Function} selector - Fonction (state) => partOfState.
   * @param {Function} callback - Fonction appelée quand la partie change.
   * @returns {Function} Fonction pour se désabonner.
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
   * Ajoute un middleware.
   *
   * @description
   * CONCEPT : Middleware Pattern
   *
   * Les middlewares interceptent les actions avant qu'elles
   * n'atteignent le reducer. Utilisés pour:
   * - Logging
   * - Async actions (thunks)
   * - Analytics
   * - Validation
   *
   * @param {Function} middleware - Fonction (action, state, next) => action|null.
   *
   * @example
   * store.use((action, state, next) => {
   *   console.log('Action:', action.type)
   *   return next(action) // Continuer
   * })
   */
  use(middleware) {
    this._middlewares.push(middleware)
  }

  /**
   * Exécute les middlewares en chaîne.
   * @param {Object} action - L'action à traiter.
   * @returns {Object|null} L'action modifiée ou null si annulée.
   * @private
   */
  _runMiddlewares(action) {
    let currentAction = action

    for (const middleware of this._middlewares) {
      const next = (a) => a
      currentAction = middleware(currentAction, this._state, next)

      if (currentAction === null || currentAction === undefined) {
        return null // Action annulée
      }
    }

    return currentAction
  }

  /**
   * Notifie tous les subscribers du changement d'état.
   * @private
   */
  _notifySubscribers() {
    const state = this.getState()
    this._subscribers.forEach((callback) => {
      try {
        callback(state)
      } catch (error) {
        console.error('[Store] Erreur dans subscriber:', error)
      }
    })
  }

  /**
   * Ajoute une action à l'historique.
   * @param {Object} action - L'action.
   * @param {Object} prevState - État précédent.
   * @param {Object} nextState - Nouvel état.
   * @private
   */
  _logAction(action, prevState, nextState) {
    this._actionHistory.push({
      action,
      prevState,
      nextState,
      timestamp: Date.now(),
    })

    // Limiter la taille de l'historique
    if (this._actionHistory.length > this._historyLimit) {
      this._actionHistory.shift()
    }
  }

  /**
   * Retourne l'historique des actions (pour debugging).
   * @returns {Array} L'historique des actions.
   */
  getHistory() {
    return [...this._actionHistory]
  }

  /**
   * Vide l'historique des actions.
   */
  clearHistory() {
    this._actionHistory = []
  }
}

// ============================================
// Helpers pour créer des reducers
// ============================================

/**
 * Combine plusieurs reducers en un seul.
 *
 * @description
 * CONCEPT : Reducer Composition
 *
 * Permet de diviser l'état en "slices" gérés par
 * des reducers séparés, puis de les combiner.
 *
 * @param {Object} reducers - Objet { key: reducerFunction }.
 * @returns {Function} Le reducer combiné.
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
 * Crée un reducer à partir d'un mapping action -> handler.
 *
 * @description
 * Simplifie la création de reducers en évitant les switch statements.
 *
 * @param {Object} initialState - État initial.
 * @param {Object} handlers - Mapping { [actionType]: (state, action) => newState }.
 * @returns {Function} Le reducer.
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
 * Crée un action creator.
 *
 * @description
 * Un action creator est une fonction qui retourne une action.
 * Évite de créer les objets action manuellement.
 *
 * @param {string} type - Le type de l'action.
 * @returns {Function} Fonction (payload) => action.
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
// Middlewares prêts à l'emploi
// ============================================

/**
 * Middleware de logging pour le debugging.
 * @param {Object} action - L'action.
 * @param {Object} state - L'état actuel.
 * @param {Function} next - Fonction pour continuer.
 * @returns {Object} L'action.
 */
function loggerMiddleware(action, state, next) {
  console.group(`[Store] ${action.type}`)
  console.log('Payload:', action.payload)
  console.log('État actuel:', state)
  console.groupEnd()
  return next(action)
}

/**
 * Middleware pour gérer les actions asynchrones (thunks).
 *
 * @description
 * CONCEPT : Thunks
 *
 * Un thunk est une fonction qui retourne une fonction.
 * Permet de dispatcher des actions asynchrones.
 *
 * @example
 * // Créer un thunk
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
 * // Dispatcher le thunk
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
