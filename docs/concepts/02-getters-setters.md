# Getters et Setters

## Concept

Les getters et setters sont des méthodes spéciales qui permettent de contrôler l'accès aux propriétés d'un objet. Ils permettent d'encapsuler la logique d'accès et de modification des données.

## Syntaxe

```javascript
class Exemple {
  constructor(valeur) {
    this._valeur = valeur
  }

  // Getter - accès en lecture
  get valeur() {
    return this._valeur
  }

  // Setter - accès en écriture
  set valeur(nouvelleValeur) {
    if (nouvelleValeur >= 0) {
      this._valeur = nouvelleValeur
    }
  }
}

const obj = new Exemple(10)
console.log(obj.valeur)  // 10 (appelle le getter)
obj.valeur = 20          // Appelle le setter
```

## Implémentation dans Fisheye

### Getters simples - PhotographerProfil

**Fichier**: [scripts/models/PhotographerProfil.js](../../scripts/models/PhotographerProfil.js)

```javascript
class PhotographerProfil {
  constructor(data) {
    this._id = data.id
    this._name = data.name
    this._city = data.city
    this._country = data.country
    this._tagline = data.tagline
    this._price = data.price
    this._portrait = data.portrait
    this._tags = data.tags || []
  }

  get id() {
    return this._id
  }

  get name() {
    return this._name
  }

  get city() {
    return this._city
  }

  get location() {
    return `${this._city}, ${this._country}`
  }

  get portrait() {
    return `assets/photographers/${this._portrait}`
  }
}
```

### Getter calculé - location

```javascript
get location() {
  return `${this._city}, ${this._country}`
}
```

Ce getter **calcule** une valeur à partir de plusieurs propriétés. Il n'y a pas de `_location` stockée.

### Getter avec transformation - portrait

```javascript
get portrait() {
  return `assets/photographers/${this._portrait}`
}
```

Ce getter **transforme** la valeur stockée en ajoutant le chemin complet.

### Getters dans PhotographerMediaCard

**Fichier**: [scripts/templates/PhotographerMediaCard.js](../../scripts/templates/PhotographerMediaCard.js)

```javascript
class PhotographerMediaCard {
  constructor(media, photographerId) {
    this._media = media
    this._photographerId = photographerId
  }

  get media() {
    return this._media
  }

  set media(value) {
    this._media = value
  }

  get photographerId() {
    return this._photographerId
  }
}
```

## Avantages des getters

### 1. Encapsulation
Les propriétés internes (`_name`) sont protégées. L'accès se fait via le getter.

```javascript
// Sans getter
console.log(photographer._name)  // Accès direct (déconseillé)

// Avec getter
console.log(photographer.name)   // Accès contrôlé
```

### 2. Propriétés calculées
Les getters peuvent retourner des valeurs calculées à la volée.

```javascript
get fullInfo() {
  return `${this._name} - ${this._city}, ${this._country}`
}
```

### 3. Validation dans les setters

```javascript
set price(value) {
  if (typeof value !== 'number' || value < 0) {
    throw new Error('Le prix doit être un nombre positif')
  }
  this._price = value
}
```

### 4. Lazy loading
Calculer une valeur seulement quand elle est demandée.

```javascript
get expensiveCalculation() {
  if (!this._cachedResult) {
    this._cachedResult = this._computeExpensiveValue()
  }
  return this._cachedResult
}
```

## Comparaison avec les méthodes

| Aspect | Getter | Méthode |
|--------|--------|---------|
| Syntaxe d'appel | `obj.property` | `obj.method()` |
| Peut prendre des arguments | Non | Oui |
| Intention | Accéder à une valeur | Effectuer une action |
| Usage recommandé | Propriétés dérivées | Opérations avec side effects |

### Quand utiliser un getter vs une méthode ?

```javascript
// Getter - retourne une valeur, pas de side effect
get fullName() {
  return `${this._firstName} ${this._lastName}`
}

// Méthode - effectue une action
formatForDisplay() {
  return `${this._name.toUpperCase()} (${this._city})`
}
```

## Bonnes pratiques

1. **Nommer le getter comme la propriété** - `get name()` pour `this._name`
2. **Pas de side effects** - Un getter ne doit pas modifier l'état
3. **Retourner rapidement** - Les getters doivent être légers
4. **Documenter avec JSDoc** - Indiquer le type de retour

```javascript
/**
 * Retourne le nom complet du photographe.
 * @returns {string} Le nom du photographe
 */
get name() {
  return this._name
}
```

## Exercice pratique

Créer une classe `Product` avec :
- Propriétés `_price` et `_quantity`
- Getter `price` et `quantity`
- Setter `quantity` avec validation (>= 0)
- Getter calculé `total` qui retourne `price * quantity`

```javascript
class Product {
  constructor(price, quantity) {
    this._price = price
    this._quantity = quantity
  }

  get price() {
    return this._price
  }

  get quantity() {
    return this._quantity
  }

  set quantity(value) {
    if (value < 0) {
      throw new Error('La quantité ne peut pas être négative')
    }
    this._quantity = value
  }

  get total() {
    return this._price * this._quantity
  }
}
```
