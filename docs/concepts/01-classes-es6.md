# ES6 Classes

## Concept

ES6 classes are a modern syntax for creating objects and managing inheritance in JavaScript. They offer a clearer and more readable approach than traditional constructor functions.

## Basic Syntax

```javascript
class ClassName {
  constructor(param) {
    this._privateProperty = param
  }

  method() {
    return this._privateProperty
  }
}
```

## Implementation in Fisheye

### Data Class - PhotographerProfil

**File**: [scripts/models/PhotographerProfil.js](../../scripts/models/PhotographerProfil.js)

```javascript
class PhotographerProfil {
  constructor(data) {
    this._id = data.id
    this._name = data.name
    this._city = data.city
    this._country = data.country
    this._tagline = data.tagline
    this._price = data.price
    this._portrait = data.portrait
    this._tags = data.tags || []
  }

  get id() {
    return this._id
  }

  get name() {
    return this._name
  }

  // ... other getters
}
```

### Utility Class - FavoritesManager

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  static _instance = null

  static getInstance() {
    if (!FavoritesManager._instance) {
      FavoritesManager._instance = new FavoritesManager()
    }
    return FavoritesManager._instance
  }

  constructor() {
    this._storageKey = 'fisheye_favorites'
    this._favorites = this._load()
    this._listeners = []
  }

  toggle(photographerId, photographerData) {
    // Toggle logic
  }
}
```

## Key Features

### 1. Constructor
The `constructor` is automatically called when creating an instance with `new`.

### 2. Private Properties (convention)
The `_` prefix indicates a private property by convention (not truly private in JS).

```javascript
this._name = data.name  // Convention: private property
```

### 3. Methods
Methods are defined directly in the class body without the `function` keyword.

```javascript
class Example {
  myMethod() {
    return 'result'
  }
}
```

### 4. Static Properties and Methods
Accessible on the class itself, not on instances.

```javascript
class Counter {
  static count = 0

  static increment() {
    Counter.count++
  }
}

Counter.increment()
console.log(Counter.count) // 1
```

## Inheritance with extends

**File**: [scripts/api/Api.js](../../scripts/api/Api.js)

```javascript
class Api {
  constructor(url) {
    this._url = url
  }

  async get() {
    const res = await fetch(this._url)
    return await res.json()
  }
}

class PhotographerApi extends Api {
  constructor() {
    super('./data/photographers.json')
  }

  async getPhotographers() {
    return this.get()
  }
}
```

### The `super` Keyword
- `super()` calls the parent class constructor
- `super.method()` calls a method from the parent class

## Use Cases in the Project

| Class | Role | File |
|-------|------|------|
| `PhotographerProfil` | Photographer data model | models/PhotographerProfil.js |
| `PhotographerMedia` | Media data model | models/PhotographerMedia.js |
| `Api` | Base class for API calls | api/Api.js |
| `FavoritesManager` | Favorites management | utils/FavoritesManager.js |
| `EventBus` | Communication between components | utils/EventBus.js |
| `LazyLoader` | Lazy loading | utils/LazyLoader.js |
| `CacheManager` | Data caching | utils/CacheManager.js |

## Best Practices

1. **One file = one class** - Each class in its own file
2. **PascalCase naming** - `PhotographerCard`, not `photographerCard`
3. **`_` prefix for private** - `this._data` for internal properties
4. **Getters for access** - Expose data via getters
5. **JSDoc documentation** - Document each class and method

## Practical Exercise

Create a `MediaItem` class that:
- Stores `id`, `title`, `likes`
- Has a getter for each property
- Has an `incrementLikes()` method that increases likes by 1

```javascript
class MediaItem {
  constructor(data) {
    this._id = data.id
    this._title = data.title
    this._likes = data.likes
  }

  get id() { return this._id }
  get title() { return this._title }
  get likes() { return this._likes }

  incrementLikes() {
    this._likes++
    return this._likes
  }
}
```
