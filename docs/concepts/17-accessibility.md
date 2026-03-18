# Accessibilité (A11Y)

## Concept

L'accessibilité web garantit que les sites sont utilisables par tous, y compris les personnes utilisant des technologies d'assistance (lecteurs d'écran, navigation au clavier, etc.).

## Principes WCAG

1. **Perceptible** - L'information doit être présentée de manière perceptible
2. **Utilisable** - Les composants doivent être utilisables
3. **Compréhensible** - L'information doit être compréhensible
4. **Robuste** - Le contenu doit être robuste pour diverses technologies

---

## Attributs ARIA

### aria-label

Fournit un label accessible quand le texte visible ne suffit pas.

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
createCard() {
  const link = document.createElement('a')
  link.href = `./photographer.html?user=${encodeURIComponent(this._photographer.name)}`
  link.setAttribute('aria-label', `Lien vers le profil de ${this._photographer.name}`)

  const img = document.createElement('img')
  img.alt = `Portrait de ${this._photographer.name}`

  return article
}
```

### aria-pressed

Indique l'état d'un bouton toggle.

**Fichier**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
_updateUI() {
  const isFav = this._favoritesManager.isFavorite(this._photographerId)
  this.$button.classList.toggle('favorite-btn--active', isFav)
  this.$button.setAttribute('aria-pressed', isFav.toString())
}

createButton() {
  const $button = document.createElement('button')
  $button.classList.add('favorite-btn')
  $button.setAttribute('aria-label', `Ajouter ${this._photographerName} aux favoris`)
  $button.setAttribute('aria-pressed', 'false')
  return $button
}
```

### aria-hidden

Cache un élément des technologies d'assistance.

```javascript
const decorativeIcon = document.createElement('span')
decorativeIcon.classList.add('icon')
decorativeIcon.setAttribute('aria-hidden', 'true')
```

### aria-expanded

Indique si un élément déroulant est ouvert.

**Fichier**: [scripts/templates/MediaFilter.js](../../scripts/templates/MediaFilter.js)

```javascript
_toggle() {
  this._isOpen = !this._isOpen
  this.$dropdown.classList.toggle('open', this._isOpen)
  this.$button.setAttribute('aria-expanded', this._isOpen.toString())
}
```

### role

Définit le rôle sémantique d'un élément.

```javascript
const $modal = document.createElement('div')
$modal.setAttribute('role', 'dialog')
$modal.setAttribute('aria-modal', 'true')
$modal.setAttribute('aria-labelledby', 'modal-title')

const $listbox = document.createElement('ul')
$listbox.setAttribute('role', 'listbox')
```

---

## Texte alternatif des images

### Images informatives

```javascript
img.alt = `Portrait de ${photographer.name}`
img.alt = `Photo ${media.title} par ${photographer.name}`
```

### Images décoratives

```javascript
img.alt = ''  // Vide pour les images décoratives
img.setAttribute('role', 'presentation')
```

### Implémentation dans Fisheye

**Fichier**: [scripts/templates/CreateImageCard.js](../../scripts/templates/CreateImageCard.js)

```javascript
createCard() {
  const img = document.createElement('img')
  img.src = this._media.picture
  img.alt = `${this._media.title}, vue agrandie`
  img.classList.add('media-card__image')
  return img
}
```

---

## Navigation au clavier

### Focus visible

```css
/* Ne jamais supprimer le focus outline sans alternative */
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Alternative avec focus-visible */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--color-primary);
}
```

### Gestion du focus

**Fichier**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
function openModal() {
  $modal.style.display = 'block'
  $modal.setAttribute('aria-hidden', 'false')

  // Focus sur le premier élément interactif
  const firstInput = $modal.querySelector('input, button')
  firstInput.focus()
}

function closeModal() {
  $modal.style.display = 'none'
  $modal.setAttribute('aria-hidden', 'true')

  // Rendre le focus à l'élément déclencheur
  $triggerButton.focus()
}
```

### Focus trap (piège à focus)

**Fichier**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

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

### Raccourcis clavier

**Fichier**: [scripts/utils/KeyboardShortcutManager.js](../../scripts/utils/KeyboardShortcutManager.js)

```javascript
_initDefaultShortcuts() {
  // Escape pour fermer les modals
  this.register('escape', () => {
    const openModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])')
    if (openModal) {
      closeModal(openModal)
    }
  })

  // Navigation avec J/K
  this.register('j', () => this._navigateNext(), 'gallery')
  this.register('k', () => this._navigatePrev(), 'gallery')
}
```

---

## Classe .sr-only

Texte visible uniquement pour les lecteurs d'écran.

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
$closeBtn.setAttribute('aria-label', 'Fermer la lightbox')

const $srText = document.createElement('span')
$srText.classList.add('sr-only')
$srText.textContent = 'Fermer'
$closeBtn.appendChild($srText)

// Le bouton a une icône visible + texte pour lecteurs d'écran
```

---

## Formulaires accessibles

**Fichier**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

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

  // Message d'erreur
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

### Validation accessible

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

## Live regions

Annoncent les changements dynamiques.

```javascript
// Créer une région live
const $liveRegion = document.createElement('div')
$liveRegion.setAttribute('aria-live', 'polite')
$liveRegion.setAttribute('aria-atomic', 'true')
$liveRegion.classList.add('sr-only')
document.body.appendChild($liveRegion)

// Annoncer un changement
function announce(message) {
  $liveRegion.textContent = ''
  setTimeout(() => {
    $liveRegion.textContent = message
  }, 100)
}

// Usage
announce('3 photographes trouvés')
announce('Image suivante: Coucher de soleil')
```

---

## Checklist d'accessibilité

| Élément | Vérification |
|---------|--------------|
| Images | `alt` descriptif ou vide si décorative |
| Liens | Texte ou `aria-label` descriptif |
| Boutons | Texte ou `aria-label` |
| Formulaires | Labels associés avec `for` |
| Modals | `role="dialog"`, focus trap |
| États | `aria-pressed`, `aria-expanded`, `aria-selected` |
| Erreurs | `aria-invalid`, `aria-describedby` |
| Navigation | Possible au clavier |
| Focus | Visible et logique |

---

## Exercice pratique

Créer un composant d'alerte accessible :

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
    $closeBtn.setAttribute('aria-label', 'Fermer l\'alerte')
    $closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>'
    $closeBtn.addEventListener('click', () => this._close($alert))

    $alert.appendChild($message)
    $alert.appendChild($closeBtn)
    this.$container.appendChild($alert)

    // Auto-fermeture après 5s
    setTimeout(() => this._close($alert), 5000)
  }

  _close($alert) {
    $alert.remove()
  }
}

// Usage
const alert = new AccessibleAlert()
alert.show('Photographe ajouté aux favoris!', 'success')
```
