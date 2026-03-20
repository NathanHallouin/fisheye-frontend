# Getters and Setters

## Concept

Getters and setters are special methods that allow you to control access to an object's properties. They enable encapsulation of data access and modification logic.

## Syntax

```javascript
class Example {
  constructor(value) {
    this._value = value
  }

  // Getter - read access
  get value() {
    return this._value
  }

  // Setter - write access
  set value(newValue) {
    if (newValue >= 0) {
      this._value = newValue
    }
  }
}

const obj = new Example(10)
console.log(obj.value)  // 10 (calls the getter)
obj.value = 20          // Calls the setter
```

## Implementation in Fisheye

### Simple Getters - PhotographerProfil

**File**: [scripts/models/PhotographerProfil.js](../../scripts/models/PhotographerProfil.js)

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

### Computed Getter - location

```javascript
get location() {
  return `${this._city}, ${this._country}`
}
```

This getter **computes** a value from multiple properties. There is no stored `_location`.

### Getter with Transformation - portrait

```javascript
get portrait() {
  return `assets/photographers/${this._portrait}`
}
```

This getter **transforms** the stored value by adding the full path.

### Getters in PhotographerMediaCard

**File**: [scripts/templates/PhotographerMediaCard.js](../../scripts/templates/PhotographerMediaCard.js)

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

## Advantages of Getters

### 1. Encapsulation
Internal properties (`_name`) are protected. Access is through the getter.

```javascript
// Without getter
console.log(photographer._name)  // Direct access (not recommended)

// With getter
console.log(photographer.name)   // Controlled access
```

### 2. Computed Properties
Getters can return values calculated on the fly.

```javascript
get fullInfo() {
  return `${this._name} - ${this._city}, ${this._country}`
}
```

### 3. Validation in Setters

```javascript
set price(value) {
  if (typeof value !== 'number' || value < 0) {
    throw new Error('Price must be a positive number')
  }
  this._price = value
}
```

### 4. Lazy Loading
Calculate a value only when it's requested.

```javascript
get expensiveCalculation() {
  if (!this._cachedResult) {
    this._cachedResult = this._computeExpensiveValue()
  }
  return this._cachedResult
}
```

## Comparison with Methods

| Aspect | Getter | Method |
|--------|--------|--------|
| Call syntax | `obj.property` | `obj.method()` |
| Can take arguments | No | Yes |
| Intent | Access a value | Perform an action |
| Recommended usage | Derived properties | Operations with side effects |

### When to Use a Getter vs a Method?

```javascript
// Getter - returns a value, no side effect
get fullName() {
  return `${this._firstName} ${this._lastName}`
}

// Method - performs an action
formatForDisplay() {
  return `${this._name.toUpperCase()} (${this._city})`
}
```

## Best Practices

1. **Name the getter like the property** - `get name()` for `this._name`
2. **No side effects** - A getter should not modify state
3. **Return quickly** - Getters should be lightweight
4. **Document with JSDoc** - Indicate the return type

```javascript
/**
 * Returns the photographer's full name.
 * @returns {string} The photographer's name
 */
get name() {
  return this._name
}
```

## Practical Exercise

Create a `Product` class with:
- Properties `_price` and `_quantity`
- Getter `price` and `quantity`
- Setter `quantity` with validation (>= 0)
- Computed getter `total` that returns `price * quantity`

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
      throw new Error('Quantity cannot be negative')
    }
    this._quantity = value
  }

  get total() {
    return this._price * this._quantity
  }
}
```
