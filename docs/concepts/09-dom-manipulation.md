# DOM Manipulation

## Concept

The DOM (Document Object Model) is the interface that allows JavaScript to interact with HTML. DOM manipulation consists of creating, modifying, and deleting page elements.

## Selecting Elements

### querySelector / querySelectorAll

```javascript
// Select an element
const element = document.querySelector('.my-class')
const elementById = document.querySelector('#my-id')

// Select multiple elements
const elements = document.querySelectorAll('.card')
```

### getElementById

```javascript
const modal = document.getElementById('contact-modal')
```

### Implementation in Fisheye

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
class App {
  constructor() {
    this.$photographerSection = document.querySelector('.photographer_section')
    this.$main = document.querySelector('main')
    this.$header = document.querySelector('.header')
  }
}
```

**File**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
const $modal = document.getElementById('contact-modal')
const $form = $modal.querySelector('form')
const $closeBtn = $modal.querySelector('.modal__close')
```

## Creating Elements

### document.createElement()

This is the preferred method in Fisheye for creating DOM elements.

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
class PhotographerCard {
  createCard() {
    // Create elements
    const article = document.createElement('article')
    const link = document.createElement('a')
    const img = document.createElement('img')
    const title = document.createElement('h2')
    const location = document.createElement('p')
    const tagline = document.createElement('p')
    const price = document.createElement('p')

    // Configure attributes
    article.classList.add('user-card')
    link.href = `./photographer.html?user=${encodeURIComponent(this._photographer.name)}`
    link.setAttribute('aria-label', `Link to ${this._photographer.name}`)

    img.src = this._photographer.portrait
    img.alt = `Portrait of ${this._photographer.name}`
    img.classList.add('user-card__portrait')

    title.textContent = this._photographer.name
    title.classList.add('user-card__name')

    location.textContent = this._photographer.location
    location.classList.add('user-card__location')

    tagline.textContent = this._photographer.tagline
    tagline.classList.add('user-card__tagline')

    price.textContent = `${this._photographer.price}€/day`
    price.classList.add('user-card__price')

    // Assemble the structure
    link.appendChild(img)
    link.appendChild(title)
    article.appendChild(link)
    article.appendChild(location)
    article.appendChild(tagline)
    article.appendChild(price)

    return article
  }
}
```

### innerHTML (specific cases)

For complex and static HTML templates, innerHTML can be used.

**File**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
_createLightbox() {
  const $lightbox = document.createElement('div')
  $lightbox.innerHTML = `
    <div class="lightbox" role="dialog" aria-label="Image viewer">
      <button class="lightbox__close" aria-label="Close">
        <span class="sr-only">Close</span>
      </button>
      <button class="lightbox__prev" aria-label="Previous">
        <span class="sr-only">Previous</span>
      </button>
      <div class="lightbox__content"></div>
      <button class="lightbox__next" aria-label="Next">
        <span class="sr-only">Next</span>
      </button>
    </div>
  `
  return $lightbox
}
```

## Modifying Elements

### classList

```javascript
element.classList.add('active')
element.classList.remove('hidden')
element.classList.toggle('open')
element.classList.contains('active')  // true/false
```

**File**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
_updateUI() {
  const isFav = this._favoritesManager.isFavorite(this._photographerId)
  this.$button.classList.toggle('favorite-btn--active', isFav)
  this.$button.setAttribute('aria-pressed', isFav.toString())
}
```

### textContent vs innerHTML

```javascript
// textContent - Safe, for simple text
element.textContent = photographer.name

// innerHTML - For HTML (beware of XSS!)
element.innerHTML = '<strong>Text</strong>'
```

### setAttribute / removeAttribute

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
link.setAttribute('aria-label', `Link to ${this._photographer.name}`)
link.setAttribute('role', 'link')
img.removeAttribute('data-src')
```

### dataset (data-* attributes)

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
// HTML: <img data-src="image.jpg" data-photographer-id="123">

// Reading
const src = img.dataset.src
const id = img.dataset.photographerId

// Writing
img.dataset.loaded = 'true'
```

## Inserting Elements

### appendChild

```javascript
parent.appendChild(child)
```

### insertBefore

**File**: [scripts/App.js](../../scripts/App.js)

```javascript
_initSearchBar() {
  const searchBar = new SearchBar(this._photographers, (filtered) => {
    this._displayPhotographers(filtered)
  })
  // Insert before the first child
  this.$main.insertBefore(searchBar.render(), this.$main.firstChild)
}
```

### remove()

```javascript
element.remove()  // Removes the element from the DOM
```

## Style Management

### style property

**File**: [scripts/templates/StatsDashboard.js](../../scripts/templates/StatsDashboard.js)

```javascript
const progressBar = document.createElement('div')
progressBar.classList.add('progress-bar')
progressBar.style.width = `${percentage}%`
```

### CSS Classes (recommended)

```javascript
// Prefer CSS classes over inline styles
element.classList.add('hidden')  // .hidden { display: none; }
element.classList.add('active')  // .active { ... }
```

## Focus and Accessibility

**File**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
function openModal() {
  $modal.style.display = 'block'
  $modal.setAttribute('aria-hidden', 'false')

  // Focus on the first field
  const firstInput = $modal.querySelector('input')
  firstInput.focus()
}

function closeModal() {
  $modal.style.display = 'none'
  $modal.setAttribute('aria-hidden', 'true')

  // Return focus to the trigger element
  $triggerButton.focus()
}
```

## Common Patterns in Fisheye

### Card Creation Pattern

```javascript
class MediaCard {
  constructor(media) {
    this._media = media
  }

  createCard() {
    const $card = document.createElement('article')
    $card.classList.add('media-card')

    const $image = this._createImage()
    const $info = this._createInfo()

    $card.appendChild($image)
    $card.appendChild($info)

    return $card
  }

  _createImage() {
    const $img = document.createElement('img')
    $img.src = this._media.picture
    $img.alt = this._media.title
    return $img
  }

  _createInfo() {
    const $info = document.createElement('div')
    $info.classList.add('media-card__info')
    // ...
    return $info
  }
}
```

### Clear and Fill Pattern

```javascript
_displayPhotographers(photographers) {
  // Clear the container
  this.$photographerSection.innerHTML = ''

  // Fill with new cards
  photographers.forEach((photographer) => {
    const card = new PhotographerCard(photographer)
    this.$photographerSection.appendChild(card.createCard())
  })
}
```

## Best Practices

### 1. Prefer createElement over innerHTML

```javascript
// Good - createElement
const p = document.createElement('p')
p.textContent = userData.name

// Risky - innerHTML with user data
container.innerHTML = `<p>${userData.name}</p>`  // XSS possible!
```

### 2. Use textContent for text

```javascript
element.textContent = text  // Safe
element.innerHTML = text    // Risky if text comes from user
```

### 3. Group DOM modifications

```javascript
// Bad - multiple reflows
items.forEach(item => {
  container.appendChild(createCard(item))
})

// Good - DocumentFragment
const fragment = document.createDocumentFragment()
items.forEach(item => {
  fragment.appendChild(createCard(item))
})
container.appendChild(fragment)
```

### 4. $ Naming Convention

In Fisheye, DOM variables are prefixed with `$`:

```javascript
this.$wrapper = document.querySelector('.wrapper')
this.$modal = document.getElementById('modal')
```

## Practical Exercise

Create a function that generates a list of photographers:

```javascript
function createPhotographerList(photographers) {
  const $list = document.createElement('ul')
  $list.classList.add('photographer-list')

  photographers.forEach(photographer => {
    const $item = document.createElement('li')
    $item.classList.add('photographer-list__item')

    const $name = document.createElement('span')
    $name.classList.add('photographer-list__name')
    $name.textContent = photographer.name

    const $price = document.createElement('span')
    $price.classList.add('photographer-list__price')
    $price.textContent = `${photographer.price}€/day`

    $item.appendChild($name)
    $item.appendChild($price)
    $list.appendChild($item)
  })

  return $list
}
```
