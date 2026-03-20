# Event Handling

## Concept

Events allow you to react to user interactions (clicks, key presses, scroll, etc.) and browser state changes.

## addEventListener

### Basic Syntax

```javascript
element.addEventListener(eventType, callback, options)

// Example
button.addEventListener('click', (e) => {
  console.log('Button clicked!')
})
```

### Options

```javascript
element.addEventListener('click', handler, {
  once: true,      // Triggers only once
  capture: true,   // Capture phase (instead of bubbling)
  passive: true    // Will not call preventDefault()
})
```

## Common Event Types

### Mouse Events

```javascript
element.addEventListener('click', handler)
element.addEventListener('dblclick', handler)
element.addEventListener('mouseenter', handler)
element.addEventListener('mouseleave', handler)
element.addEventListener('mousemove', handler)
```

### Keyboard Events

```javascript
element.addEventListener('keydown', handler)
element.addEventListener('keyup', handler)
element.addEventListener('keypress', handler)  // Deprecated
```

### Form Events

```javascript
input.addEventListener('input', handler)     // On each keystroke
input.addEventListener('change', handler)    // On blur if modified
input.addEventListener('focus', handler)
input.addEventListener('blur', handler)
form.addEventListener('submit', handler)
```

## Implementation in Fisheye

### Click Events

**File**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
class FavoriteButton {
  _addEventListeners() {
    this.$button.addEventListener('click', (e) => {
      e.stopPropagation()  // Prevents the click from bubbling up
      e.preventDefault()   // Prevents the default behavior
      this._toggle()
    })
  }
}
```

### Input Events

**File**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

```javascript
class SearchBar {
  _addEventListeners() {
    this.$input.addEventListener('input', (e) => {
      this._debouncedSearch(e.target.value)
    })

    this.$input.addEventListener('focus', () => {
      this._showSuggestions()
    })

    this.$input.addEventListener('blur', () => {
      // Delay to allow clicking on suggestion
      setTimeout(() => this._hideSuggestions(), 200)
    })
  }
}
```

### Keyboard Events

**File**: [scripts/utils/KeyboardShortcutManager.js](../../scripts/utils/KeyboardShortcutManager.js)

```javascript
class KeyboardShortcutManager {
  constructor() {
    this._shortcuts = new Map()
    this._handleKeyDown = this._handleKeyDown.bind(this)
    document.addEventListener('keydown', this._handleKeyDown)
  }

  _handleKeyDown(e) {
    // Ignore if in an input field
    if (this._isInputFocused()) return

    const key = this._getKeyCombo(e)
    const handler = this._shortcuts.get(key)

    if (handler) {
      e.preventDefault()
      handler(e)
    }
  }

  _getKeyCombo(e) {
    const parts = []
    if (e.ctrlKey) parts.push('ctrl')
    if (e.altKey) parts.push('alt')
    if (e.shiftKey) parts.push('shift')
    parts.push(e.key.toLowerCase())
    return parts.join('+')
  }
}
```

**File**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
_handleKeyDown(e) {
  switch (e.key) {
    case 'Escape':
      this.close()
      break
    case 'ArrowLeft':
      this.previous()
      break
    case 'ArrowRight':
      this.next()
      break
  }
  e.preventDefault()
}
```

## The Event Object

### Common Properties

```javascript
element.addEventListener('click', (e) => {
  e.target        // Element that triggered the event
  e.currentTarget // Element with the listener
  e.type          // Event type ('click', 'keydown', etc.)
  e.timeStamp     // Timestamp
})
```

### KeyboardEvent

```javascript
document.addEventListener('keydown', (e) => {
  e.key       // 'Enter', 'Escape', 'a', etc.
  e.code      // 'Enter', 'Escape', 'KeyA', etc.
  e.ctrlKey   // true if Ctrl is pressed
  e.altKey    // true if Alt is pressed
  e.shiftKey  // true if Shift is pressed
  e.metaKey   // true if Cmd (Mac) or Win (Windows)
})
```

### MouseEvent

```javascript
element.addEventListener('click', (e) => {
  e.clientX   // X position in the window
  e.clientY   // Y position in the window
  e.pageX     // X position in the document
  e.pageY     // Y position in the document
  e.button    // 0=left, 1=middle, 2=right
})
```

## Event Propagation

### Bubbling (default)

The event bubbles up from the target to the parents.

```
document
  └── body
       └── div (3. Receives the event)
            └── button (2. Receives the event)
                 └── span (1. Click here - target)
```

### Capturing

The event descends from the document to the target.

```javascript
element.addEventListener('click', handler, { capture: true })
```

### stopPropagation

Stops the event propagation.

**File**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
this.$button.addEventListener('click', (e) => {
  e.stopPropagation()  // The click will not bubble up to the parent
  this._toggle()
})
```

### preventDefault

Prevents the browser's default behavior.

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault()  // Prevents form submission
  // Custom validation...
})

link.addEventListener('click', (e) => {
  e.preventDefault()  // Prevents navigation
  // Custom navigation...
})
```

## Event Delegation

A technique for handling events on many elements with a single listener.

**File**: [scripts/utils/LikeManager.js](../../scripts/utils/LikeManager.js)

```javascript
class LikeManager {
  constructor($container) {
    this.$container = $container
    // A single listener for all like buttons
    this.$container.addEventListener('click', (e) => this._handleClick(e))
  }

  _handleClick(e) {
    // Find the closest like button
    const $likeBtn = e.target.closest('[data-like-id]')
    if (!$likeBtn) return

    const mediaId = $likeBtn.dataset.likeId
    this._toggleLike(mediaId, $likeBtn)
  }
}
```

### Advantages of Delegation

1. **Performance** - A single listener instead of N
2. **Dynamic elements** - Works with elements added later
3. **Memory** - Fewer listeners = less memory

## Custom Events

Create and dispatch custom events.

**File**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  _notifyChange(photographerId, isFavorite) {
    document.dispatchEvent(new CustomEvent('favorites:change', {
      detail: { photographerId, isFavorite }
    }))
  }
}

// Listen elsewhere
document.addEventListener('favorites:change', (e) => {
  const { photographerId, isFavorite } = e.detail
  console.log(`Photographer ${photographerId}: ${isFavorite ? 'added' : 'removed'}`)
})
```

## Cleaning Up Listeners

Important to avoid memory leaks.

**File**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
class Lightbox {
  open() {
    this._keyDownHandler = this._handleKeyDown.bind(this)
    document.addEventListener('keydown', this._keyDownHandler)
  }

  close() {
    document.removeEventListener('keydown', this._keyDownHandler)
    this.$lightbox.remove()
  }
}
```

### Pattern with bind

```javascript
class Component {
  constructor() {
    // Bind once in the constructor
    this.handleClick = this.handleClick.bind(this)
  }

  mount() {
    this.$button.addEventListener('click', this.handleClick)
  }

  unmount() {
    this.$button.removeEventListener('click', this.handleClick)
  }

  handleClick(e) {
    // 'this' refers to the instance
  }
}
```

## Use Cases in the Project

| Event | File | Usage |
|-------|------|-------|
| click | FavoriteButton.js | Toggle favorites |
| input | SearchBar.js | Real-time search |
| keydown | KeyboardShortcutManager.js | Keyboard shortcuts |
| submit | contactForm.js | Form submission |
| popstate | UrlStateManager.js | Back navigation |
| focus/blur | SearchBar.js | Suggestions display |

## Best Practices

1. **Use delegation** for dynamic lists
2. **Clean up listeners** in close methods
3. **Bind in constructor** to be able to remove the listener
4. **Avoid anonymous functions** if you need to remove the listener
5. **Use passive: true** for scroll/touch events

## Practical Exercise

Create a keyboard navigation component for a gallery:

```javascript
class GalleryKeyboardNav {
  constructor($gallery) {
    this.$gallery = $gallery
    this.$items = $gallery.querySelectorAll('.gallery-item')
    this._currentIndex = 0

    this._handleKeyDown = this._handleKeyDown.bind(this)
    document.addEventListener('keydown', this._handleKeyDown)
  }

  _handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowRight':
      case 'j':
        this._next()
        e.preventDefault()
        break
      case 'ArrowLeft':
      case 'k':
        this._previous()
        e.preventDefault()
        break
      case 'Enter':
        this._select()
        e.preventDefault()
        break
    }
  }

  _next() {
    this._currentIndex = (this._currentIndex + 1) % this.$items.length
    this._focus()
  }

  _previous() {
    this._currentIndex = (this._currentIndex - 1 + this.$items.length) % this.$items.length
    this._focus()
  }

  _focus() {
    this.$items[this._currentIndex].focus()
  }

  destroy() {
    document.removeEventListener('keydown', this._handleKeyDown)
  }
}
```
