# Manipulation du DOM

## Concept

Le DOM (Document Object Model) est l'interface qui permet à JavaScript d'interagir avec le HTML. La manipulation du DOM consiste à créer, modifier et supprimer des éléments de la page.

## Sélection d'éléments

### querySelector / querySelectorAll

```javascript
// Sélectionner un élément
const element = document.querySelector('.my-class')
const elementById = document.querySelector('#my-id')

// Sélectionner plusieurs éléments
const elements = document.querySelectorAll('.card')
```

### getElementById

```javascript
const modal = document.getElementById('contact-modal')
```

### Implémentation dans Fisheye

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
class App {
  constructor() {
    this.$photographerSection = document.querySelector('.photographer_section')
    this.$main = document.querySelector('main')
    this.$header = document.querySelector('.header')
  }
}
```

**Fichier**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
const $modal = document.getElementById('contact-modal')
const $form = $modal.querySelector('form')
const $closeBtn = $modal.querySelector('.modal__close')
```

## Création d'éléments

### document.createElement()

C'est la méthode privilégiée dans Fisheye pour créer des éléments DOM.

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
class PhotographerCard {
  createCard() {
    // Créer les éléments
    const article = document.createElement('article')
    const link = document.createElement('a')
    const img = document.createElement('img')
    const title = document.createElement('h2')
    const location = document.createElement('p')
    const tagline = document.createElement('p')
    const price = document.createElement('p')

    // Configurer les attributs
    article.classList.add('user-card')
    link.href = `./photographer.html?user=${encodeURIComponent(this._photographer.name)}`
    link.setAttribute('aria-label', `Lien vers ${this._photographer.name}`)

    img.src = this._photographer.portrait
    img.alt = `Portrait de ${this._photographer.name}`
    img.classList.add('user-card__portrait')

    title.textContent = this._photographer.name
    title.classList.add('user-card__name')

    location.textContent = this._photographer.location
    location.classList.add('user-card__location')

    tagline.textContent = this._photographer.tagline
    tagline.classList.add('user-card__tagline')

    price.textContent = `${this._photographer.price}€/jour`
    price.classList.add('user-card__price')

    // Assembler la structure
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

### innerHTML (cas spécifiques)

Pour les templates HTML complexes et statiques, innerHTML peut être utilisé.

**Fichier**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
_createLightbox() {
  const $lightbox = document.createElement('div')
  $lightbox.innerHTML = `
    <div class="lightbox" role="dialog" aria-label="Visionneuse d'images">
      <button class="lightbox__close" aria-label="Fermer">
        <span class="sr-only">Fermer</span>
      </button>
      <button class="lightbox__prev" aria-label="Précédent">
        <span class="sr-only">Précédent</span>
      </button>
      <div class="lightbox__content"></div>
      <button class="lightbox__next" aria-label="Suivant">
        <span class="sr-only">Suivant</span>
      </button>
    </div>
  `
  return $lightbox
}
```

## Modification d'éléments

### classList

```javascript
element.classList.add('active')
element.classList.remove('hidden')
element.classList.toggle('open')
element.classList.contains('active')  // true/false
```

**Fichier**: [scripts/templates/FavoriteButton.js](../../scripts/templates/FavoriteButton.js)

```javascript
_updateUI() {
  const isFav = this._favoritesManager.isFavorite(this._photographerId)
  this.$button.classList.toggle('favorite-btn--active', isFav)
  this.$button.setAttribute('aria-pressed', isFav.toString())
}
```

### textContent vs innerHTML

```javascript
// textContent - Sécurisé, pour le texte simple
element.textContent = photographer.name

// innerHTML - Pour le HTML (attention XSS!)
element.innerHTML = '<strong>Texte</strong>'
```

### setAttribute / removeAttribute

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
link.setAttribute('aria-label', `Lien vers ${this._photographer.name}`)
link.setAttribute('role', 'link')
img.removeAttribute('data-src')
```

### dataset (data-* attributes)

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
// HTML: <img data-src="image.jpg" data-photographer-id="123">

// Lecture
const src = img.dataset.src
const id = img.dataset.photographerId

// Écriture
img.dataset.loaded = 'true'
```

## Insertion d'éléments

### appendChild

```javascript
parent.appendChild(child)
```

### insertBefore

**Fichier**: [scripts/App.js](../../scripts/App.js)

```javascript
_initSearchBar() {
  const searchBar = new SearchBar(this._photographers, (filtered) => {
    this._displayPhotographers(filtered)
  })
  // Insérer avant le premier enfant
  this.$main.insertBefore(searchBar.render(), this.$main.firstChild)
}
```

### remove()

```javascript
element.remove()  // Supprime l'élément du DOM
```

## Gestion des styles

### style property

**Fichier**: [scripts/templates/StatsDashboard.js](../../scripts/templates/StatsDashboard.js)

```javascript
const progressBar = document.createElement('div')
progressBar.classList.add('progress-bar')
progressBar.style.width = `${percentage}%`
```

### Classes CSS (recommandé)

```javascript
// Préférer les classes CSS aux styles inline
element.classList.add('hidden')  // .hidden { display: none; }
element.classList.add('active')  // .active { ... }
```

## Focus et accessibilité

**Fichier**: [scripts/utils/contactForm.js](../../scripts/utils/contactForm.js)

```javascript
function openModal() {
  $modal.style.display = 'block'
  $modal.setAttribute('aria-hidden', 'false')

  // Focus sur le premier champ
  const firstInput = $modal.querySelector('input')
  firstInput.focus()
}

function closeModal() {
  $modal.style.display = 'none'
  $modal.setAttribute('aria-hidden', 'true')

  // Rendre le focus à l'élément déclencheur
  $triggerButton.focus()
}
```

## Patterns courants dans Fisheye

### Pattern de création de carte

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

### Pattern de vidage et remplissage

```javascript
_displayPhotographers(photographers) {
  // Vider le conteneur
  this.$photographerSection.innerHTML = ''

  // Remplir avec les nouvelles cartes
  photographers.forEach((photographer) => {
    const card = new PhotographerCard(photographer)
    this.$photographerSection.appendChild(card.createCard())
  })
}
```

## Bonnes pratiques

### 1. Préférer createElement à innerHTML

```javascript
// Bon - createElement
const p = document.createElement('p')
p.textContent = userData.name

// Risqué - innerHTML avec données utilisateur
container.innerHTML = `<p>${userData.name}</p>`  // XSS possible!
```

### 2. Utiliser textContent pour le texte

```javascript
element.textContent = text  // Sûr
element.innerHTML = text    // Risqué si text vient de l'utilisateur
```

### 3. Grouper les modifications DOM

```javascript
// Mauvais - multiple reflows
items.forEach(item => {
  container.appendChild(createCard(item))
})

// Bon - DocumentFragment
const fragment = document.createDocumentFragment()
items.forEach(item => {
  fragment.appendChild(createCard(item))
})
container.appendChild(fragment)
```

### 4. Convention de nommage $

Dans Fisheye, les variables DOM sont préfixées par `$` :

```javascript
this.$wrapper = document.querySelector('.wrapper')
this.$modal = document.getElementById('modal')
```

## Exercice pratique

Créer une fonction qui génère une liste de photographes :

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
    $price.textContent = `${photographer.price}€/jour`

    $item.appendChild($name)
    $item.appendChild($price)
    $list.appendChild($item)
  })

  return $list
}
```
