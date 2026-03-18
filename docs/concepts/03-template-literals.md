# Template Literals (Littéraux de gabarit)

## Concept

Les template literals sont des chaînes de caractères délimitées par des backticks (`` ` ``) qui permettent l'interpolation d'expressions et les chaînes multi-lignes.

## Syntaxe

```javascript
// Interpolation de variables
const name = 'Alice'
const greeting = `Bonjour ${name}!`

// Expressions
const a = 5, b = 10
const result = `La somme est ${a + b}`

// Multi-lignes
const html = `
  <div>
    <h1>Titre</h1>
    <p>Contenu</p>
  </div>
`
```

## Implémentation dans Fisheye

### Construction de chemins d'images

**Fichier**: [scripts/models/PhotographerProfil.js](../../scripts/models/PhotographerProfil.js)

```javascript
get portrait() {
  return `assets/photographers/${this._portrait}`
}
```

**Fichier**: [scripts/models/PhotographerMedia.js](../../scripts/models/PhotographerMedia.js)

```javascript
get picture() {
  return `assets/media/${this._photographerId}/${this._picture}`
}
```

### Construction d'URLs

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
createCard() {
  // ...
  link.href = `./photographer.html?user=${encodeURIComponent(this._photographer.name)}`
  // ...
}
```

### Attributs ARIA dynamiques

**Fichier**: [scripts/templates/PhotographerCard.js](../../scripts/templates/PhotographerCard.js)

```javascript
link.setAttribute('aria-label', `Lien vers le profil de ${this._photographer.name}`)
img.alt = `Portrait de ${this._photographer.name}`
```

### Construction de HTML (cas spécifiques)

**Fichier**: [scripts/utils/lightbox.js](../../scripts/utils/lightbox.js)

```javascript
const lightboxHTML = `
  <div class="lightbox" role="dialog" aria-label="Visionneuse d'images">
    <button class="lightbox__close" aria-label="Fermer la lightbox">
      <span class="sr-only">Fermer</span>
    </button>
    <button class="lightbox__prev" aria-label="Image précédente">
      <span class="sr-only">Précédent</span>
    </button>
    <div class="lightbox__content"></div>
    <button class="lightbox__next" aria-label="Image suivante">
      <span class="sr-only">Suivant</span>
    </button>
  </div>
`
```

### Affichage formaté

**Fichier**: [scripts/templates/PhotographerInfo.js](../../scripts/templates/PhotographerInfo.js)

```javascript
priceText.textContent = `${this._photographer.price}€/jour`
```

**Fichier**: [scripts/templates/StatsDashboard.js](../../scripts/templates/StatsDashboard.js)

```javascript
const formatNumber = (num) => num.toLocaleString('fr-FR')
valueEl.textContent = `${formatNumber(stat.value)}${stat.suffix || ''}`
```

## Comparaison avec la concaténation

### Ancien style (concaténation)

```javascript
const message = 'Bonjour ' + name + ', vous avez ' + count + ' messages.'
const path = 'assets/media/' + photographerId + '/' + filename
```

### Nouveau style (template literals)

```javascript
const message = `Bonjour ${name}, vous avez ${count} messages.`
const path = `assets/media/${photographerId}/${filename}`
```

## Fonctionnalités avancées

### 1. Expressions complexes

```javascript
const item = { name: 'Photo', price: 100, quantity: 3 }
const receipt = `Total: ${item.price * item.quantity}€`
```

### 2. Appels de fonctions

```javascript
const uppercase = (str) => str.toUpperCase()
const greeting = `Bonjour ${uppercase(name)}!`
```

### 3. Opérateur ternaire

```javascript
const status = `Utilisateur ${isActive ? 'actif' : 'inactif'}`
```

### 4. Chaînes multi-lignes

```javascript
const template = `
  <article class="card">
    <h2>${title}</h2>
    <p>${description}</p>
  </article>
`
```

## Cas d'usage dans le projet

| Utilisation | Exemple | Fichier |
|------------|---------|---------|
| Chemins d'images | `` `assets/media/${id}/${file}` `` | PhotographerMedia.js |
| URLs | `` `./photographer.html?user=${name}` `` | PhotographerCard.js |
| Attributs ARIA | `` `Lien vers ${name}` `` | Tous les templates |
| Affichage prix | `` `${price}€/jour` `` | PhotographerInfo.js |
| HTML complexe | Templates multi-lignes | lightbox.js |

## Bonnes pratiques

1. **Préférer template literals** - Plus lisibles que la concaténation
2. **Éviter innerHTML avec données utilisateur** - Risque XSS
3. **Utiliser textContent pour le texte simple** - Plus sûr

```javascript
// Bon - textContent avec template literal
element.textContent = `Prix: ${price}€`

// Risqué - innerHTML avec données non sanitizées
element.innerHTML = `<p>${userInput}</p>`  // Danger XSS!
```

## Exercice pratique

Créer une fonction `createMediaCard` qui génère une carte HTML en utilisant template literals :

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

Note: Dans Fisheye, on préfère `document.createElement()` pour la création DOM, mais les template literals sont utiles pour les templates HTML statiques complexes.
