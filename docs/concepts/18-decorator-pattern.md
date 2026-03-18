# Decorator Pattern (Higher-Order Functions)

## Concept

Le **Decorator Pattern** permet d'ajouter des comportements à une fonction sans modifier son code original. En JavaScript, cela se fait via les **Higher-Order Functions** (fonctions qui prennent ou retournent des fonctions).

## Cas d'utilisation

- Logging automatique des appels de fonctions
- Mesure de performance
- Gestion d'erreurs centralisée
- Mise en cache (memoization)
- Rate limiting
- Validation des arguments

## Syntaxe de base

```javascript
// Un decorator est une fonction qui enveloppe une autre fonction
function withLogging(fn, name) {
  return function(...args) {
    console.log(`[${name}] Appelé avec:`, args)
    const result = fn.apply(this, args)
    console.log(`[${name}] Résultat:`, result)
    return result
  }
}

// Utilisation
const add = (a, b) => a + b
const loggedAdd = withLogging(add, 'add')

loggedAdd(2, 3) // Logs: [add] Appelé avec: [2, 3] puis [add] Résultat: 5
```

## Implémentation dans Fisheye

### Fichier: `scripts/utils/withLogging.js`

```javascript
// Decorator avec options configurables
function withLogging(fn, name, options = {}) {
  const { logArgs = true, logResult = true, logDuration = true } = options

  return function(...args) {
    const start = performance.now()

    if (logArgs) console.log(`[${name}] Appelé avec:`, args)

    const result = fn.apply(this, args)

    // Gérer les Promises
    if (result instanceof Promise) {
      return result.then(value => {
        if (logResult) console.log(`[${name}] Résultat:`, value)
        if (logDuration) console.log(`[${name}] Durée: ${performance.now() - start}ms`)
        return value
      })
    }

    if (logResult) console.log(`[${name}] Résultat:`, result)
    if (logDuration) console.log(`[${name}] Durée: ${performance.now() - start}ms`)
    return result
  }
}
```

### Decorator de memoization

```javascript
function withMemoization(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  const memoized = function(...args) {
    const key = keyFn(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }

  memoized.cache = cache
  memoized.clearCache = () => cache.clear()

  return memoized
}

// Utilisation
const expensiveCalc = withMemoization((n) => {
  console.log('Calcul...')
  return n * 2
})

expensiveCalc(5) // "Calcul..." puis 10
expensiveCalc(5) // 10 (depuis le cache, pas de log)
```

### Composer plusieurs decorators

```javascript
function compose(...decorators) {
  return function(fn) {
    return decorators.reduceRight(
      (decorated, decorator) => decorator(decorated),
      fn
    )
  }
}

// Utilisation
const enhancedFetch = compose(
  (fn) => withLogging(fn, 'fetchData'),
  (fn) => withErrorHandling(fn, null),
  (fn) => withMemoization(fn)
)(originalFetch)
```

## Avantages

1. **Séparation des préoccupations** : Le code métier reste propre
2. **Réutilisabilité** : Un decorator peut s'appliquer à n'importe quelle fonction
3. **Composition** : Les decorators se combinent facilement
4. **Testabilité** : Chaque decorator peut être testé indépendamment

## Bonnes pratiques

- Préserver le contexte `this` avec `apply(this, args)`
- Gérer les fonctions async (retournant des Promises)
- Fournir des options de configuration
- Permettre de désactiver les decorators en production

## Voir aussi

- [Closures](05-closures.md)
- [Higher-Order Functions](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)
