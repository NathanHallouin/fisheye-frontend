# Accessibility (A11Y)

## Concept

Web accessibility ensures that websites are usable by everyone, including people using assistive technologies (screen readers, keyboard navigation, etc.).

## WCAG Principles

1. **Perceivable** - Information must be presented in a perceivable way
2. **Operable** - Components must be operable
3. **Understandable** - Information must be understandable
4. **Robust** - Content must be robust for various technologies

---

## ARIA Attributes

### aria-label

Provides an accessible label when visible text is not sufficient.

**File**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
createCard() {
  const link = document.createElement('a')
  link.href = `./photographer.html?user=${encodeURIComponent(this._photographer.name)}`
  link.setAttribute('aria-label', `Link to ${this._photographer.name}'s profile`)

  const img = document.createElement('img')
  img.alt = `Portrait of ${this._photographer.name}`

  return article
}
```

### aria-pressed

Indicates the state of a toggle button.

**File**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
_updateUI() {
  const isFav = this._favoritesManager.isFavorite(this._photographerId)
  this.$button.classList.toggle('favorite-btn--active', isFav)
  this.$button.setAttribute('aria-pressed', isFav.toString())
}

createButton() {
  const $button = document.createElement('button')
  $button.classList.add('favorite-btn')
  $button.setAttribute('aria-label', `Add ${this._photographerName} to favorites`)
  $button.setAttribute('aria-pressed', 'false')
  return $button
}
```

### aria-hidden

Hides an element from assistive technologies.

```javascript
const decorativeIcon = document.createElement('span')
decorativeIcon.classList.add('icon')
decorativeIcon.setAttribute('aria-hidden', 'true')
```

### aria-expanded

Indicates whether a dropdown element is open.

**File**: [scripts/templates/MediaFilter.js](../../scripts/templates/MediaFilter.js)

```javascript
_toggle() {
  this._isOpen = !this._isOpen
  this.$dropdown.classList.toggle('open', this._isOpen)
  this.$button.setAttribute('aria-expanded', this._isOpen.toString())
}
```

### role

Defines the semantic role of an element.

```javascript
const $modal = document.createElement('div')
$modal.setAttribute('role', 'dialog')
$modal.setAttribute('aria-modal', 'true')
$modal.setAttribute('aria-labelledby', 'modal-title')

const $listbox = document.createElement('ul')
$listbox.setAttribute('role', 'listbox')
```

---

## Alternative Text for Images

### Informative images

```javascript
img.alt = `Portrait of ${photographer.name}`
img.alt = `Photo ${media.title} by ${photographer.name}`
```

### Decorative images

```javascript
img.alt = ''  // Empty for decorative images
img.setAttribute('role', 'presentation')
```

### Implementation in Fisheye

**File**: [scripts/templates/CreateImageCard.js](../../scripts/templates/CreateImageCard.js)

```javascript
createCard() {
  const img = document.createElement('img')
  img.src = this._media.picture
  img.alt = `${this._media.title}, enlarged view`
  img.classList.add('media-card__image')
  return img
}
```

---

## Keyboard Navigation

### Visible focus

```css
/* Never remove focus outline without an alternative */
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Alternative with focus-visible */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--color-primary);
}
```

### Focus management

**File**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
function openModal() {
  $modal.style.display = 'block'
  $modal.setAttribute('aria-hidden', 'false')

  // Focus on the first interactive element
  const firstInput = $modal.querySelector('input, button')
  firstInput.focus()
}

function closeModal() {
  $modal.style.display = 'none'
  $modal.setAttribute('aria-hidden', 'true')

  // Return focus to the trigger element
  $triggerButton.focus()
}
```

### Focus trap

**File**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
_trapFocus(e) {
  const focusableElements = this.$lightbox.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const focusable = Array.from(focusableElements)
  const firstFocusable = focusable[0]
  const lastFocusable = focusable[focusable.length - 1]

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }
}
```

### Keyboard shortcuts

**File**: [scripts/utils/KeyboardShortcutManager.js](../../scripts/utils/KeyboardShortcutManager.js)

```javascript
_initDefaultShortcuts() {
  // Escape to close modals
  this.register('escape', () => {
    const openModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])')
    if (openModal) {
      closeModal(openModal)
    }
  })

  // Navigation with J/K
  this.register('j', () => this._navigateNext(), 'gallery')
  this.register('k', () => this._navigatePrev(), 'gallery')
}
```

---

## .sr-only Class

Text visible only to screen readers.

### CSS

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Usage

```javascript
const $closeBtn = document.createElement('button')
$closeBtn.classList.add('lightbox__close')
$closeBtn.setAttribute('aria-label', 'Close lightbox')

const $srText = document.createElement('span')
$srText.classList.add('sr-only')
$srText.textContent = 'Close'
$closeBtn.appendChild($srText)

// The button has a visible icon + text for screen readers
```

---

## Accessible Forms

**File**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
function createFormField(id, label, type = 'text', required = false) {
  const $wrapper = document.createElement('div')
  $wrapper.classList.add('form-field')

  const $label = document.createElement('label')
  $label.setAttribute('for', id)
  $label.textContent = label

  const $input = document.createElement('input')
  $input.type = type
  $input.id = id
  $input.name = id

  if (required) {
    $input.setAttribute('required', '')
    $input.setAttribute('aria-required', 'true')
  }

  // Error message
  const $error = document.createElement('span')
  $error.id = `${id}-error`
  $error.classList.add('form-field__error')
  $error.setAttribute('aria-live', 'polite')

  $input.setAttribute('aria-describedby', `${id}-error`)

  $wrapper.appendChild($label)
  $wrapper.appendChild($input)
  $wrapper.appendChild($error)

  return $wrapper
}
```

### Accessible validation

```javascript
function showError($input, message) {
  const $error = document.getElementById(`${$input.id}-error`)
  $error.textContent = message
  $input.setAttribute('aria-invalid', 'true')
}

function clearError($input) {
  const $error = document.getElementById(`${$input.id}-error`)
  $error.textContent = ''
  $input.removeAttribute('aria-invalid')
}
```

---

## Live Regions

Announce dynamic changes.

```javascript
// Create a live region
const $liveRegion = document.createElement('div')
$liveRegion.setAttribute('aria-live', 'polite')
$liveRegion.setAttribute('aria-atomic', 'true')
$liveRegion.classList.add('sr-only')
document.body.appendChild($liveRegion)

// Announce a change
function announce(message) {
  $liveRegion.textContent = ''
  setTimeout(() => {
    $liveRegion.textContent = message
  }, 100)
}

// Usage
announce('3 photographers found')
announce('Next image: Sunset')
```

---

## Accessibility Checklist

| Element | Verification |
|---------|--------------|
| Images | Descriptive `alt` or empty if decorative |
| Links | Descriptive text or `aria-label` |
| Buttons | Text or `aria-label` |
| Forms | Labels associated with `for` |
| Modals | `role="dialog"`, focus trap |
| States | `aria-pressed`, `aria-expanded`, `aria-selected` |
| Errors | `aria-invalid`, `aria-describedby` |
| Navigation | Keyboard accessible |
| Focus | Visible and logical |

---

## Practical Exercise

Create an accessible alert component:

```javascript
class AccessibleAlert {
  constructor() {
    this._createContainer()
  }

  _createContainer() {
    this.$container = document.createElement('div')
    this.$container.classList.add('alert-container')
    this.$container.setAttribute('role', 'alert')
    this.$container.setAttribute('aria-live', 'assertive')
    this.$container.setAttribute('aria-atomic', 'true')
    document.body.appendChild(this.$container)
  }

  show(message, type = 'info') {
    const $alert = document.createElement('div')
    $alert.classList.add('alert', `alert--${type}`)

    const $message = document.createElement('p')
    $message.textContent = message

    const $closeBtn = document.createElement('button')
    $closeBtn.classList.add('alert__close')
    $closeBtn.setAttribute('aria-label', 'Close alert')
    $closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>'
    $closeBtn.addEventListener('click', () => this._close($alert))

    $alert.appendChild($message)
    $alert.appendChild($closeBtn)
    this.$container.appendChild($alert)

    // Auto-close after 5s
    setTimeout(() => this._close($alert), 5000)
  }

  _close($alert) {
    $alert.remove()
  }
}

// Usage
const alert = new AccessibleAlert()
alert.show('Photographer added to favorites!', 'success')
```
