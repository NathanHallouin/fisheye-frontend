# State Management (Mini Redux)

## Concept

**State Management** centralizes the application state in a single "store". The Redux pattern implements a unidirectional data flow: components dispatch actions, reducers modify the state, and subscribers are notified.

## The 3 Redux Principles

1. **Single Source of Truth**: All state in a single store
2. **State is Read-Only**: Never modify state directly
3. **Changes via Pure Functions**: Reducers are pure functions

## Data Flow

```
+--------------+     +--------------+     +--------------+
|   UI Event   | --> |   dispatch   | --> |   Reducer    |
+--------------+     +--------------+     +--------------+
                                                  |
                                                  v
+--------------+     +--------------+     +--------------+
|  Update UI   | <-- |  Subscribers | <-- |  New State   |
+--------------+     +--------------+     +--------------+
```

## Implementation in Fisheye

### File: `scripts/utils/Store.js`

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

  // Returns a copy of the state (immutability)
  getState() {
    return { ...this._state }
  }

  // Dispatch an action to modify the state
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action must have a type')
    }

    const prevState = this._state
    this._state = this._reducer(this._state, action)

    if (this._state !== prevState) {
      this._notifySubscribers()
    }

    return action
  }

  // Subscribe to changes
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

## Actions and Reducers

```javascript
// An action is an object with type and payload
const action = {
  type: 'LIKE_MEDIA',
  payload: { mediaId: 123 }
}

// A reducer is a pure function (state, action) => newState
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

## Useful Helpers

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

// Usage
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

// Usage
const likeMedia = createAction('LIKE_MEDIA')
store.dispatch(likeMedia({ mediaId: 123 }))
```

### subscribeToSelector

```javascript
// Listen only to a part of the state
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

// Usage
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
  console.log('State:', state)
  console.groupEnd()
  return next(action)
}

// Thunk middleware (async actions)
function thunkMiddleware(action, state, next) {
  if (typeof action === 'function') {
    return action(
      (a) => store.dispatch(a),
      () => store.getState()
    )
  }
  return next(action)
}

// Using thunks
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

## Advantages

1. **Predictability**: State changes only via dispatch
2. **Debugging**: Action history, time-travel debugging
3. **Testability**: Reducers are pure functions
4. **Decoupling**: Components don't know about each other

## Best Practices

- Keep reducers pure (no side effects)
- Never mutate state, always return a new object
- Use selectors to access state
- Normalize state (flat structures)

## See Also

- [Observer Pattern](08-observer-pattern.md)
- [Redux Documentation](https://redux.js.org/)
