# Array Methods

## Concept

JavaScript offers many methods to manipulate arrays in a functional way. These methods are essential for transforming, filtering, and aggregating data.

---

## map()

Transforms each element of the array and returns a new array.

### Syntax

```javascript
const result = array.map((element, index, array) => transformation)
```

### Implementation in Fisheye

**File**: [scripts/factories/PhotographersFactory.js](../../scripts/factories/PhotographersFactory.js)

```javascript
constructor(data, type) {
  if (type === 'photographers') {
    return data.photographers.map((data) => new PhotographerProfil(data))
  }
}
```

**File**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

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

Returns a new array containing elements that pass the test.

### Syntax

```javascript
const result = array.filter((element, index, array) => condition)
```

### Implementation in Fisheye

**File**: [scripts/App.js](../../scripts/App.js)

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

**File**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

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

Finds the first element that satisfies the condition.

### Syntax

```javascript
const element = array.find((element) => condition)
const index = array.findIndex((element) => condition)
```

### Implementation in Fisheye

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

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

**File**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
_findCurrentIndex() {
  return this._mediaList.findIndex(
    media => media.picture === this._currentMedia.picture
  )
}
```

---

## reduce()

Reduces the array to a single value by accumulating results.

### Syntax

```javascript
const result = array.reduce((accumulator, current, index, array) => {
  return newAccumulator
}, initialValue)
```

### Implementation in Fisheye

**File**: [scripts/utils/StatsCalculator.js](../../scripts/utils/StatsCalculator.js)

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

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
// Group media by category
const grouped = media.reduce((acc, item) => {
  const key = item.category || 'other'
  if (!acc[key]) acc[key] = []
  acc[key].push(item)
  return acc
}, {})
```

---

## sort()

Sorts the array in place (mutates the original array).

### Syntax

```javascript
array.sort((a, b) => comparison)  // Returns negative, zero, or positive
```

### Implementation in Fisheye

**File**: [scripts/templates/SortFilters.js](../../scripts/templates/SortFilters.js)

```javascript
sort(data) {
  const sortedData = [...data]  // Copy to avoid mutation

  switch (this._currentSort) {
    case 'popularity':
      sortedData.sort((a, b) => b._likes - a._likes)  // Descending
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

Executes a function for each element (returns nothing).

### Syntax

```javascript
array.forEach((element, index, array) => {
  // side effect
})
```

### Implementation in Fisheye

**File**: [scripts/App.js](../../scripts/App.js)

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

Test whether at least one (some) or all (every) elements pass the test.

### Syntax

```javascript
const hasMatch = array.some((element) => condition)
const allMatch = array.every((element) => condition)
```

### Implementation in Fisheye

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
_filterPhotographers(state) {
  if (state.tags && state.tags.length > 0) {
    filtered = filtered.filter(photographer =>
      state.tags.some(tag => photographer.hasTag(tag))  // At least one tag
    )
  }
  return filtered
}
```

---

## includes()

Checks if an array contains a value.

### Syntax

```javascript
const hasValue = array.includes(value)
```

### Implementation in Fisheye

**File**: [scripts/utils/UrlStateManager.js](../../scripts/utils/UrlStateManager.js)

```javascript
hasTag(tag) {
  return this._state.tags && this._state.tags.includes(tag)
}
```

---

## flatMap()

Combines map() and flat() - transforms and flattens in one step.

### Syntax

```javascript
const result = array.flatMap((element) => transformation)
```

### Implementation in Fisheye

**File**: [scripts/templates/TagFilter.js](../../scripts/templates/TagFilter.js)

```javascript
_getAllTags() {
  // Each photographer has an array of tags
  // flatMap flattens all arrays into one
  const allTags = this._photographers.flatMap(p => p.tags)
  // ['portrait', 'art', 'portrait', 'nature'] -> Set -> ['portrait', 'art', 'nature']
  return [...new Set(allTags)]
}
```

---

## splice()

Modifies the array by removing/adding elements (mutation).

### Syntax

```javascript
array.splice(startIndex, deleteCount, ...itemsToAdd)
```

### Implementation in Fisheye

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
remove(photographerId) {
  const index = this._favorites.findIndex(fav => fav.id === photographerId)
  if (index !== -1) {
    this._favorites.splice(index, 1)  // Removes 1 element at index
    this._save()
  }
}
```

---

## Summary Table

| Method | Returns | Mutates | Usage |
|--------|---------|---------|-------|
| `map()` | New array | No | Transform |
| `filter()` | New array | No | Filter |
| `find()` | Element or undefined | No | Find first match |
| `findIndex()` | Index or -1 | No | Find index |
| `reduce()` | Single value | No | Aggregate |
| `sort()` | Sorted array | **Yes** | Sort |
| `forEach()` | undefined | No | Side effects |
| `some()` | boolean | No | Partial test |
| `every()` | boolean | No | Total test |
| `includes()` | boolean | No | Check presence |
| `flatMap()` | New array | No | Map + flatten |
| `splice()` | Removed elements | **Yes** | Modify |

---

## Method Chaining

Methods can be chained for complex transformations:

```javascript
const result = photographers
  .filter(p => p.price < 200)                    // Filter by price
  .map(p => ({ name: p.name, price: p.price }))  // Extract properties
  .sort((a, b) => a.price - b.price)             // Sort by price

// Result: [{ name: 'Alice', price: 100 }, { name: 'Bob', price: 150 }]
```

---

## Practical Exercise

Implement these functions with array methods:

```javascript
// 1. Find Parisian photographers
const parisian = photographers.filter(p => p.city === 'Paris')

// 2. Calculate average price
const avgPrice = photographers.reduce((sum, p) => sum + p.price, 0) / photographers.length

// 3. Get alphabetically sorted names
const names = photographers
  .map(p => p.name)
  .sort((a, b) => a.localeCompare(b, 'fr'))

// 4. Check if a photographer exists by ID
const exists = photographers.some(p => p.id === targetId)

// 5. Group by city
const byCity = photographers.reduce((acc, p) => {
  if (!acc[p.city]) acc[p.city] = []
  acc[p.city].push(p)
  return acc
}, {})
```
