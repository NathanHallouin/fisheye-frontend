# Gestion des événements (Event Handling)

## Concept

Les événements permettent de réagir aux interactions utilisateur (clics, touches clavier, scroll, etc.) et aux changements d'état du navigateur.

## addEventListener

### Syntaxe de base

```javascript
element.addEventListener(eventType, callback, options)

// Exemple
button.addEventListener('click', (e) => {
  console.log('Bouton cliqué!')
})
```

### Options

```javascript
element.addEventListener('click', handler, {
  once: true,      // Se déclenche une seule fois
  capture: true,   // Phase de capture (au lieu de bubbling)
  passive: true    // N'appellera pas preventDefault()
})
```

## Types d'événements courants

### Événements souris

```javascript
element.addEventListener('click', handler)
element.addEventListener('dblclick', handler)
element.addEventListener('mouseenter', handler)
element.addEventListener('mouseleave', handler)
element.addEventListener('mousemove', handler)
```

### Événements clavier

```javascript
element.addEventListener('keydown', handler)
element.addEventListener('keyup', handler)
element.addEventListener('keypress', handler)  // Déprécié
```

### Événements de formulaire

```javascript
input.addEventListener('input', handler)     // À chaque frappe
input.addEventListener('change', handler)    // Au blur si modifié
input.addEventListener('focus', handler)
input.addEventListener('blur', handler)
form.addEventListener('submit', handler)
```

## Implémentation dans Fisheye

### Événements click

**Fichier**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
class FavoriteButton {
  _addEventListeners() {
    this.$button.addEventListener('click', (e) => {
      e.stopPropagation()  // Empêche le clic de remonter
      e.preventDefault()   // Empêche le comportement par défaut
      this._toggle()
    })
  }
}
```

### Événements input

**Fichier**: [scripts/templates/SearchBar.js](../../scripts/templates/SearchBar.js)

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
      // Délai pour permettre le clic sur suggestion
      setTimeout(() => this._hideSuggestions(), 200)
    })
  }
}
```

### Événements clavier

**Fichier**: [scripts/utils/KeyboardShortcutManager.js](../../scripts/utils/KeyboardShortcutManager.js)

```javascript
class KeyboardShortcutManager {
  constructor() {
    this._shortcuts = new Map()
    this._handleKeyDown = this._handleKeyDown.bind(this)
    document.addEventListener('keydown', this._handleKeyDown)
  }

  _handleKeyDown(e) {
    // Ignorer si dans un champ de saisie
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

**Fichier**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

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

## L'objet Event

### Propriétés communes

```javascript
element.addEventListener('click', (e) => {
  e.target        // Élément qui a déclenché l'événement
  e.currentTarget // Élément avec le listener
  e.type          // Type d'événement ('click', 'keydown', etc.)
  e.timeStamp     // Timestamp
})
```

### KeyboardEvent

```javascript
document.addEventListener('keydown', (e) => {
  e.key       // 'Enter', 'Escape', 'a', etc.
  e.code      // 'Enter', 'Escape', 'KeyA', etc.
  e.ctrlKey   // true si Ctrl est pressé
  e.altKey    // true si Alt est pressé
  e.shiftKey  // true si Shift est pressé
  e.metaKey   // true si Cmd (Mac) ou Win (Windows)
})
```

### MouseEvent

```javascript
element.addEventListener('click', (e) => {
  e.clientX   // Position X dans la fenêtre
  e.clientY   // Position Y dans la fenêtre
  e.pageX     // Position X dans le document
  e.pageY     // Position Y dans le document
  e.button    // 0=gauche, 1=milieu, 2=droit
})
```

## Propagation des événements

### Bubbling (par défaut)

L'événement remonte du target vers les parents.

```
document
  └── body
       └── div (3. Reçoit l'événement)
            └── button (2. Reçoit l'événement)
                 └── span (1. Clic ici - target)
```

### Capturing

L'événement descend du document vers le target.

```javascript
element.addEventListener('click', handler, { capture: true })
```

### stopPropagation

Arrête la propagation de l'événement.

**Fichier**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
this.$button.addEventListener('click', (e) => {
  e.stopPropagation()  // Le clic ne remontera pas au parent
  this._toggle()
})
```

### preventDefault

Empêche le comportement par défaut du navigateur.

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault()  // Empêche l'envoi du formulaire
  // Validation custom...
})

link.addEventListener('click', (e) => {
  e.preventDefault()  // Empêche la navigation
  // Navigation custom...
})
```

## Event Delegation

Technique pour gérer les événements sur de nombreux éléments avec un seul listener.

**Fichier**: [scripts/utils/LikeManager.js](../../scripts/utils/LikeManager.js)

```javascript
class LikeManager {
  constructor($container) {
    this.$container = $container
    // Un seul listener pour tous les boutons like
    this.$container.addEventListener('click', (e) => this._handleClick(e))
  }

  _handleClick(e) {
    // Trouver le bouton like le plus proche
    const $likeBtn = e.target.closest('[data-like-id]')
    if (!$likeBtn) return

    const mediaId = $likeBtn.dataset.likeId
    this._toggleLike(mediaId, $likeBtn)
  }
}
```

### Avantages de la délégation

1. **Performance** - Un seul listener au lieu de N
2. **Éléments dynamiques** - Fonctionne avec les éléments ajoutés après
3. **Mémoire** - Moins de listeners = moins de mémoire

## Custom Events

Créer et dispatcher des événements personnalisés.

**Fichier**: [scripts/utils/FavoritesManager.js](../../scripts/utils/FavoritesManager.js)

```javascript
class FavoritesManager {
  _notifyChange(photographerId, isFavorite) {
    document.dispatchEvent(new CustomEvent('favorites:change', {
      detail: { photographerId, isFavorite }
    }))
  }
}

// Écouter ailleurs
document.addEventListener('favorites:change', (e) => {
  const { photographerId, isFavorite } = e.detail
  console.log(`Photographe ${photographerId}: ${isFavorite ? 'ajouté' : 'retiré'}`)
})
```

## Nettoyage des listeners

Important pour éviter les fuites mémoire.

**Fichier**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

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

### Pattern avec bind

```javascript
class Component {
  constructor() {
    // Bind une fois dans le constructeur
    this.handleClick = this.handleClick.bind(this)
  }

  mount() {
    this.$button.addEventListener('click', this.handleClick)
  }

  unmount() {
    this.$button.removeEventListener('click', this.handleClick)
  }

  handleClick(e) {
    // 'this' fait référence à l'instance
  }
}
```

## Cas d'usage dans le projet

| Événement | Fichier | Usage |
|-----------|---------|-------|
| click | FavoriteButton.js | Toggle favoris |
| input | SearchBar.js | Recherche en temps réel |
| keydown | KeyboardShortcutManager.js | Raccourcis clavier |
| submit | contactForm.js | Envoi de formulaire |
| popstate | UrlStateManager.js | Navigation arrière |
| focus/blur | SearchBar.js | Affichage suggestions |

## Bonnes pratiques

1. **Utiliser la délégation** pour les listes dynamiques
2. **Nettoyer les listeners** dans les méthodes de fermeture
3. **Bind dans le constructeur** pour pouvoir retirer le listener
4. **Éviter les fonctions anonymes** si vous devez retirer le listener
5. **Utiliser passive: true** pour les événements scroll/touch

## Exercice pratique

Créer un composant de navigation au clavier pour une galerie :

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
