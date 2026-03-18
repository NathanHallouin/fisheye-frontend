# Classes ES6

## Concept

Les classes ES6 sont une syntaxe moderne pour créer des objets et gérer l'héritage en JavaScript. Elles offrent une approche plus claire et plus lisible que les fonctions constructeurs traditionnelles.

## Syntaxe de base

```javascript
class NomClasse {
  constructor(param) {
    this._privateProperty = param
  }

  methode() {
    return this._privateProperty
  }
}
```

## Implémentation dans Fisheye

### Classe de données - PhotographerProfil

**Fichier**: [scripts/models/PhotographerProfil.js](../../scripts/models/PhotographerProfil.js)

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

  // ... autres getters
}
```

### Classe utilitaire - FavoritesManager

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

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
    // Logique de toggle
  }
}
```

## Caractéristiques clés

### 1. Constructeur
Le `constructor` est appelé automatiquement lors de la création d'une instance avec `new`.

### 2. Propriétés privées (convention)
Le préfixe `_` indique une propriété privée par convention (pas vraiment privée en JS).

```javascript
this._name = data.name  // Convention: propriété privée
```

### 3. Méthodes
Les méthodes sont définies directement dans le corps de la classe sans le mot-clé `function`.

```javascript
class Example {
  maMethode() {
    return 'résultat'
  }
}
```

### 4. Propriétés et méthodes statiques
Accessibles sur la classe elle-même, pas sur les instances.

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

## Héritage avec extends

**Fichier**: [scripts/api/Api.js](../../scripts/api/Api.js)

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

### Mot-clé `super`
- `super()` appelle le constructeur de la classe parente
- `super.methode()` appelle une méthode de la classe parente

## Cas d'usage dans le projet

| Classe | Rôle | Fichier |
|--------|------|---------|
| `PhotographerProfil` | Modèle de données photographe | models/PhotographerProfil.js |
| `PhotographerMedia` | Modèle de données média | models/PhotographerMedia.js |
| `Api` | Classe de base pour les appels API | api/Api.js |
| `FavoritesManager` | Gestion des favoris | utils/FavoritesManager.js |
| `EventBus` | Communication entre composants | utils/EventBus.js |
| `LazyLoader` | Chargement paresseux | utils/LazyLoader.js |
| `CacheManager` | Cache des données | utils/CacheManager.js |

## Bonnes pratiques

1. **Un fichier = une classe** - Chaque classe dans son propre fichier
2. **Nommage PascalCase** - `PhotographerCard`, pas `photographerCard`
3. **Préfixe `_` pour le privé** - `this._data` pour les propriétés internes
4. **Getters pour l'accès** - Exposer les données via des getters
5. **Documentation JSDoc** - Documenter chaque classe et méthode

## Exercice pratique

Créer une classe `MediaItem` qui :
- Stocke `id`, `title`, `likes`
- A un getter pour chaque propriété
- A une méthode `incrementLikes()` qui augmente les likes de 1

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
