# Méthodes de tableau (Array Methods)

## Concept

JavaScript offre de nombreuses méthodes pour manipuler les tableaux de manière fonctionnelle. Ces méthodes sont essentielles pour transformer, filtrer et agréger des données.

---

## map()

Transforme chaque élément du tableau et retourne un nouveau tableau.

### Syntaxe

```javascript
const result = array.map((element, index, array) => transformation)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/factories/PhotographersFactory.js](../../scripts/factories/PhotographersFactory.js)

```javascript
constructor(data, type) {
  if (type === 'photographers') {
    return data.photographers.map((data) => new PhotographerProfil(data))
  }
}
```

**Fichier**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

```javascript
_getAllTags() {
  const allTags = this._photographers.flatMap(p => p.tags)
  const uniqueTags = [...new Set(allTags)]
  return uniqueTags.map(tag => ({
    name: tag,
    label: tag.charAt(0).toUpperCase() + tag.slice(1)
  }))
}
```

---

## filter()

Retourne un nouveau tableau contenant les éléments qui passent le test.

### Syntaxe

```javascript
const result = array.filter((element, index, array) => condition)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
_filterPhotographers(state) {
  let filtered = [...this._allPhotographers]

  if (state.search) {
    const normalizedQuery = state.search.toLowerCase().trim()
    filtered = filtered.filter((photographer) => {
      const name = photographer.name.toLowerCase()
      const city = photographer.city.toLowerCase()
      return name.includes(normalizedQuery) || city.includes(normalizedQuery)
    })
  }

  return filtered
}
```

**Fichier**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

```javascript
filter(photographers) {
  if (this._activeTags.size === 0) {
    return photographers
  }

  return photographers.filter(photographer =>
    [...this._activeTags].some(tag => photographer.hasTag(tag))
  )
}
```

---

## find() / findIndex()

Trouve le premier élément qui satisfait la condition.

### Syntaxe

```javascript
const element = array.find((element) => condition)
const index = array.findIndex((element) => condition)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
isFavorite(photographerId) {
  return this._favorites.find(fav => fav.id === photographerId) !== undefined
}

remove(photographerId) {
  const index = this._favorites.findIndex(fav => fav.id === photographerId)
  if (index !== -1) {
    this._favorites.splice(index, 1)
    this._save()
  }
}
```

**Fichier**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
_findCurrentIndex() {
  return this._mediaList.findIndex(
    media => media.picture === this._currentMedia.picture
  )
}
```

---

## reduce()

Réduit le tableau à une seule valeur en accumulant les résultats.

### Syntaxe

```javascript
const result = array.reduce((accumulator, current, index, array) => {
  return newAccumulator
}, initialValue)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/StatsCalculator.js](../../scripts/utils/StatsCalculator.js)

```javascript
getTotalLikes() {
  return this._media.reduce((total, media) => total + media.likes, 0)
}

_getLikesByPhotographer() {
  return this._media.reduce((acc, media) => {
    const id = media.photographerId
    acc[id] = (acc[id] || 0) + media.likes
    return acc
  }, {})
}
```

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
// Grouper les médias par catégorie
const grouped = media.reduce((acc, item) => {
  const key = item.category || 'other'
  if (!acc[key]) acc[key] = []
  acc[key].push(item)
  return acc
}, {})
```

---

## sort()

Trie le tableau en place (mute le tableau original).

### Syntaxe

```javascript
array.sort((a, b) => comparison)  // Retourne négatif, zéro, ou positif
```

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
sort(data) {
  const sortedData = [...data]  // Copie pour éviter mutation

  switch (this._currentSort) {
    case 'popularity':
      sortedData.sort((a, b) => b._likes - a._likes)  // Décroissant
      break
    case 'date':
      sortedData.sort((a, b) => new Date(b._date) - new Date(a._date))
      break
    case 'title':
      sortedData.sort((a, b) =>
        a._title.localeCompare(b._title, 'fr', { sensitivity: 'base' })
      )
      break
  }

  return sortedData
}
```

---

## forEach()

Exécute une fonction pour chaque élément (ne retourne rien).

### Syntaxe

```javascript
array.forEach((element, index, array) => {
  // side effect
})
```

### Implémentation dans Fisheye

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
_displayPhotographers(photographers) {
  this.$photographerSection.innerHTML = ''

  photographers.forEach((photographer) => {
    const card = new PhotographerCard(photographer)
    this.$photographerSection.appendChild(card.createCard())
  })
}
```

---

## some() / every()

Testent si au moins un (some) ou tous (every) les éléments passent le test.

### Syntaxe

```javascript
const hasMatch = array.some((element) => condition)
const allMatch = array.every((element) => condition)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
_filterPhotographers(state) {
  if (state.tags && state.tags.length > 0) {
    filtered = filtered.filter(photographer =>
      state.tags.some(tag => photographer.hasTag(tag))  // Au moins un tag
    )
  }
  return filtered
}
```

---

## includes()

Vérifie si un tableau contient une valeur.

### Syntaxe

```javascript
const hasValue = array.includes(value)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
hasTag(tag) {
  return this._state.tags && this._state.tags.includes(tag)
}
```

---

## flatMap()

Combine map() et flat() - transforme et aplatit en une étape.

### Syntaxe

```javascript
const result = array.flatMap((element) => transformation)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

```javascript
_getAllTags() {
  // Chaque photographe a un tableau de tags
  // flatMap aplatit tous les tableaux en un seul
  const allTags = this._photographers.flatMap(p => p.tags)
  // ['portrait', 'art', 'portrait', 'nature'] -> Set -> ['portrait', 'art', 'nature']
  return [...new Set(allTags)]
}
```

---

## splice()

Modifie le tableau en supprimant/ajoutant des éléments (mutation).

### Syntaxe

```javascript
array.splice(startIndex, deleteCount, ...itemsToAdd)
```

### Implémentation dans Fisheye

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
remove(photographerId) {
  const index = this._favorites.findIndex(fav => fav.id === photographerId)
  if (index !== -1) {
    this._favorites.splice(index, 1)  // Supprime 1 élément à index
    this._save()
  }
}
```

---

## Tableau récapitulatif

| Méthode | Retourne | Mute | Usage |
|---------|----------|------|-------|
| `map()` | Nouveau tableau | Non | Transformer |
| `filter()` | Nouveau tableau | Non | Filtrer |
| `find()` | Élément ou undefined | Non | Chercher premier match |
| `findIndex()` | Index ou -1 | Non | Chercher index |
| `reduce()` | Valeur unique | Non | Agréger |
| `sort()` | Tableau trié | **Oui** | Trier |
| `forEach()` | undefined | Non | Side effects |
| `some()` | boolean | Non | Test partiel |
| `every()` | boolean | Non | Test total |
| `includes()` | boolean | Non | Vérifier présence |
| `flatMap()` | Nouveau tableau | Non | Map + flatten |
| `splice()` | Éléments supprimés | **Oui** | Modifier |

---

## Chaînage de méthodes

Les méthodes peuvent être chaînées pour des transformations complexes :

```javascript
const result = photographers
  .filter(p => p.price < 200)                    // Filtrer par prix
  .map(p => ({ name: p.name, price: p.price }))  // Extraire propriétés
  .sort((a, b) => a.price - b.price)             // Trier par prix

// Résultat: [{ name: 'Alice', price: 100 }, { name: 'Bob', price: 150 }]
```

---

## Exercice pratique

Implémenter ces fonctions avec les méthodes de tableau :

```javascript
// 1. Trouver les photographes parisiens
const parisian = photographers.filter(p => p.city === 'Paris')

// 2. Calculer le prix moyen
const avgPrice = photographers.reduce((sum, p) => sum + p.price, 0) / photographers.length

// 3. Obtenir les noms triés alphabétiquement
const names = photographers
  .map(p => p.name)
  .sort((a, b) => a.localeCompare(b, 'fr'))

// 4. Vérifier si un photographe existe par ID
const exists = photographers.some(p => p.id === targetId)

// 5. Grouper par ville
const byCity = photographers.reduce((acc, p) => {
  if (!acc[p.city]) acc[p.city] = []
  acc[p.city].push(p)
  return acc
}, {})
```
