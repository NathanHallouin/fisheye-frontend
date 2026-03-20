# Template Literals

## Concept

Template literals are strings delimited by backticks (`` ` ``) that allow expression interpolation and multi-line strings.

## Syntax

```javascript
// Variable interpolation
const name = 'Alice'
const greeting = `Hello ${name}!`

// Expressions
const a = 5, b = 10
const result = `The sum is ${a + b}`

// Multi-line
const html = `
  <div>
    <h1>Title</h1>
    <p>Content</p>
  </div>
`
```

## Implementation in Fisheye

### Building Image Paths

**File**: [scripts/models/PhotographerProfil.js](../../scripts/models/PhotographerProfil.js)

```javascript
get portrait() {
  return `assets/photographers/${this._portrait}`
}
```

**File**: [scripts/models/PhotographerMedia.js](../../scripts/models/PhotographerMedia.js)

```javascript
get picture() {
  return `assets/media/${this._photographerId}/${this._picture}`
}
```

### Building URLs

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
createCard() {
  // ...
  link.href = `./photographer.html?user=${encodeURIComponent(this._photographer.name)}`
  // ...
}
```

### Dynamic ARIA Attributes

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
link.setAttribute('aria-label', `Link to ${this._photographer.name}'s profile`)
img.alt = `Portrait of ${this._photographer.name}`
```

### HTML Construction (specific cases)

**File**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
const lightboxHTML = `
  <div class="lightbox" role="dialog" aria-label="Image viewer">
    <button class="lightbox__close" aria-label="Close lightbox">
      <span class="sr-only">Close</span>
    </button>
    <button class="lightbox__prev" aria-label="Previous image">
      <span class="sr-only">Previous</span>
    </button>
    <div class="lightbox__content"></div>
    <button class="lightbox__next" aria-label="Next image">
      <span class="sr-only">Next</span>
    </button>
  </div>
`
```

### Formatted Display

**File**: [scripts/templates/PhotographerInfo.js](../../scripts/templates/PhotographerInfo.js)

```javascript
priceText.textContent = `${this._photographer.price}€/day`
```

**File**: [scripts/templates/StatsDashboard.js](../../scripts/templates/StatsDashboard.js)

```javascript
const formatNumber = (num) => num.toLocaleString('fr-FR')
valueEl.textContent = `${formatNumber(stat.value)}${stat.suffix || ''}`
```

## Comparison with Concatenation

### Old Style (concatenation)

```javascript
const message = 'Hello ' + name + ', you have ' + count + ' messages.'
const path = 'assets/media/' + photographerId + '/' + filename
```

### New Style (template literals)

```javascript
const message = `Hello ${name}, you have ${count} messages.`
const path = `assets/media/${photographerId}/${filename}`
```

## Advanced Features

### 1. Complex Expressions

```javascript
const item = { name: 'Photo', price: 100, quantity: 3 }
const receipt = `Total: ${item.price * item.quantity}€`
```

### 2. Function Calls

```javascript
const uppercase = (str) => str.toUpperCase()
const greeting = `Hello ${uppercase(name)}!`
```

### 3. Ternary Operator

```javascript
const status = `User ${isActive ? 'active' : 'inactive'}`
```

### 4. Multi-line Strings

```javascript
const template = `
  <article class="card">
    <h2>${title}</h2>
    <p>${description}</p>
  </article>
`
```

## Use Cases in the Project

| Usage | Example | File |
|-------|---------|------|
| Image paths | `` `assets/media/${id}/${file}` `` | PhotographerMedia.js |
| URLs | `` `./photographer.html?user=${name}` `` | PhotographerCard.js |
| ARIA attributes | `` `Link to ${name}` `` | All templates |
| Price display | `` `${price}€/day` `` | PhotographerInfo.js |
| Complex HTML | Multi-line templates | lightbox.js |

## Best Practices

1. **Prefer template literals** - More readable than concatenation
2. **Avoid innerHTML with user data** - XSS risk
3. **Use textContent for simple text** - Safer

```javascript
// Good - textContent with template literal
element.textContent = `Price: ${price}€`

// Risky - innerHTML with unsanitized data
element.innerHTML = `<p>${userInput}</p>`  // XSS danger!
```

## Practical Exercise

Create a `createMediaCard` function that generates an HTML card using template literals:

```javascript
function createMediaCard(media) {
  return `
    <article class="media-card" data-id="${media.id}">
      <img src="assets/media/${media.photographerId}/${media.image}"
           alt="${media.title}">
      <div class="media-card__info">
        <h3>${media.title}</h3>
        <span class="likes">${media.likes} likes</span>
      </div>
    </article>
  `
}
```

Note: In Fisheye, we prefer `document.createElement()` for DOM creation, but template literals are useful for complex static HTML templates.
