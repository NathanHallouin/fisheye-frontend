# State Management (Mini Redux)

## Concept

Le **State Management** centralise l'état de l'application dans un "store" unique. Le pattern Redux implémente un flux de données unidirectionnel : les composants dispatchent des actions, les reducers modifient l'état, et les subscribers sont notifiés.

## Les 3 principes de Redux

1. **Single Source of Truth** : Tout l'état dans un seul store
2. **State is Read-Only** : On ne modifie jamais l'état directement
3. **Changes via Pure Functions** : Les reducers sont des fonctions pures

## Flux de données

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Event   │ ──> │   dispatch   │ ──> │   Reducer    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  v
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Update UI   │ <── │  Subscribers │ <── │  New State   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Implémentation dans Fisheye

### Fichier: `scripts/utils/Store.js`

```javascript
class Store {
  static _instance = null

  static getInstance(reducer, initialState) {
    if (!Store._instance) {
      Store._instance = new Store(reducer, initialState)
    }
    return Store._instance
  }

  constructor(reducer, initialState = {}) {
    this._reducer = reducer
    this._state = initialState
    this._subscribers = new Set()
    this.dispatch({ type: '@@INIT' })
  }

  // Retourne une copie de l'état (immutabilité)
  getState() {
    return { ...this._state }
  }

  // Dispatch une action pour modifier l'état
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action doit avoir un type')
    }

    const prevState = this._state
    this._state = this._reducer(this._state, action)

    if (this._state !== prevState) {
      this._notifySubscribers()
    }

    return action
  }

  // S'abonner aux changements
  subscribe(callback) {
    this._subscribers.add(callback)
    return () => this._subscribers.delete(callback)
  }

  _notifySubscribers() {
    const state = this.getState()
    this._subscribers.forEach(cb => cb(state))
  }
}
```

## Actions et Reducers

```javascript
// Une action est un objet avec type et payload
const action = {
  type: 'LIKE_MEDIA',
  payload: { mediaId: 123 }
}

// Un reducer est une fonction pure (state, action) => newState
function likesReducer(state = { liked: [] }, action) {
  switch (action.type) {
    case 'LIKE_MEDIA':
      return {
        ...state,
        liked: [...state.liked, action.payload.mediaId]
      }
    case 'UNLIKE_MEDIA':
      return {
        ...state,
        liked: state.liked.filter(id => id !== action.payload.mediaId)
      }
    default:
      return state
  }
}
```

## Helpers utiles

### combineReducers

```javascript
function combineReducers(reducers) {
  return function(state = {}, action) {
    const nextState = {}
    let hasChanged = false

    for (const [key, reducer] of Object.entries(reducers)) {
      const prevStateForKey = state[key]
      nextState[key] = reducer(prevStateForKey, action)
      hasChanged = hasChanged || nextState[key] !== prevStateForKey
    }

    return hasChanged ? nextState : state
  }
}

// Utilisation
const rootReducer = combineReducers({
  likes: likesReducer,
  filters: filtersReducer,
  sort: sortReducer
})
```

### createAction

```javascript
function createAction(type) {
  const actionCreator = (payload) => ({ type, payload })
  actionCreator.type = type
  return actionCreator
}

// Utilisation
const likeMedia = createAction('LIKE_MEDIA')
store.dispatch(likeMedia({ mediaId: 123 }))
```

### subscribeToSelector

```javascript
// N'écouter qu'une partie de l'état
subscribeToSelector(selector, callback) {
  let previousValue = selector(this._state)

  return this.subscribe((state) => {
    const newValue = selector(state)
    if (newValue !== previousValue) {
      previousValue = newValue
      callback(newValue)
    }
  })
}

// Utilisation
store.subscribeToSelector(
  (state) => state.likes.liked,
  (liked) => updateLikesUI(liked)
)
```

## Middlewares

```javascript
// Logger middleware
function loggerMiddleware(action, state, next) {
  console.group(`[Store] ${action.type}`)
  console.log('Payload:', action.payload)
  console.log('État:', state)
  console.groupEnd()
  return next(action)
}

// Thunk middleware (actions async)
function thunkMiddleware(action, state, next) {
  if (typeof action === 'function') {
    return action(
      (a) => store.dispatch(a),
      () => store.getState()
    )
  }
  return next(action)
}

// Utilisation des thunks
const fetchPhotographers = () => async (dispatch, getState) => {
  dispatch({ type: 'FETCH_START' })
  try {
    const data = await api.getPhotographers()
    dispatch({ type: 'FETCH_SUCCESS', payload: data })
  } catch (error) {
    dispatch({ type: 'FETCH_ERROR', payload: error })
  }
}

store.dispatch(fetchPhotographers())
```

## Avantages

1. **Prédictibilité** : L'état change uniquement via dispatch
2. **Debugging** : Historique des actions, time-travel debugging
3. **Testabilité** : Les reducers sont des fonctions pures
4. **Découplage** : Les composants ne se connaissent pas

## Bonnes pratiques

- Garder les reducers purs (pas d'effets de bord)
- Ne jamais muter l'état, toujours retourner un nouvel objet
- Utiliser des selectors pour accéder à l'état
- Normaliser l'état (structures plates)

## Voir aussi

- [Observer Pattern](08-observer-pattern.md)
- [Redux Documentation](https://redux.js.org/)
