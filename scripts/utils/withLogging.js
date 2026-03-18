/**
 * Decorator Pattern pour le logging et la mesure de performance.
 *
 * CONCEPT : Higher-Order Functions et Decorator Pattern
 *
 * Un decorator est une fonction qui enveloppe une autre fonction pour
 * ajouter des fonctionnalités sans modifier le code original.
 * C'est un pattern AOP (Aspect-Oriented Programming).
 *
 * Avantages:
 * - Séparation des préoccupations (cross-cutting concerns)
 * - Réutilisabilité du logging
 * - Code métier plus propre
 * - Activation/désactivation facile du debug
 */

/**
 * Décorateur qui ajoute du logging à une fonction.
 * @param {Function} fn - La fonction à décorer.
 * @param {string} name - Le nom à afficher dans les logs.
 * @param {Object} options - Options de configuration.
 * @param {boolean} [options.logArgs=true] - Logger les arguments.
 * @param {boolean} [options.logResult=true] - Logger le résultat.
 * @param {boolean} [options.logDuration=true] - Logger la durée d'exécution.
 * @param {boolean} [options.logErrors=true] - Logger les erreurs.
 * @param {string} [options.level='log'] - Niveau de log ('log', 'debug', 'info').
 * @returns {Function} La fonction décorée.
 *
 * @example
 * const fetchData = withLogging(
 *   async (id) => await api.get(`/users/${id}`),
 *   'fetchUser',
 *   { logDuration: true }
 * )
 */
function withLogging(fn, name, options = {}) {
  const {
    logArgs = true,
    logResult = true,
    logDuration = true,
    logErrors = true,
    level = 'log',
  } = options

  const logger = console[level] || console.log
  const prefix = `[${name}]`

  return function (...args) {
    const start = performance.now()

    if (logArgs) {
      logger(`${prefix} Appelé avec:`, args)
    }

    try {
      const result = fn.apply(this, args)

      // Gérer les Promises (fonctions async)
      if (result instanceof Promise) {
        return result
          .then((value) => {
            if (logResult) {
              logger(`${prefix} Résultat:`, value)
            }
            if (logDuration) {
              logger(
                `${prefix} Durée: ${(performance.now() - start).toFixed(2)}ms`,
              )
            }
            return value
          })
          .catch((error) => {
            if (logErrors) {
              console.error(`${prefix} Erreur:`, error)
            }
            if (logDuration) {
              logger(
                `${prefix} Durée avant erreur: ${(performance.now() - start).toFixed(2)}ms`,
              )
            }
            throw error
          })
      }

      // Fonctions synchrones
      if (logResult) {
        logger(`${prefix} Résultat:`, result)
      }
      if (logDuration) {
        logger(`${prefix} Durée: ${(performance.now() - start).toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      if (logErrors) {
        console.error(`${prefix} Erreur:`, error)
      }
      if (logDuration) {
        logger(
          `${prefix} Durée avant erreur: ${(performance.now() - start).toFixed(2)}ms`,
        )
      }
      throw error
    }
  }
}

/**
 * Décorateur qui mesure uniquement la durée d'exécution.
 * @param {Function} fn - La fonction à mesurer.
 * @param {string} name - Le nom pour les logs.
 * @returns {Function} La fonction décorée.
 *
 * @example
 * const sortMedia = withTiming(
 *   (items) => items.sort((a, b) => b.likes - a.likes),
 *   'sortByLikes'
 * )
 */
function withTiming(fn, name) {
  return withLogging(fn, name, {
    logArgs: false,
    logResult: false,
    logDuration: true,
    logErrors: true,
  })
}

/**
 * Décorateur qui ajoute la gestion d'erreurs avec fallback.
 * @param {Function} fn - La fonction à décorer.
 * @param {*} fallback - Valeur de fallback en cas d'erreur.
 * @param {string} [name] - Nom optionnel pour le logging.
 * @returns {Function} La fonction décorée.
 *
 * @example
 * const safeParseJSON = withErrorHandling(
 *   JSON.parse,
 *   {},
 *   'parseJSON'
 * )
 * safeParseJSON('invalid json') // Retourne {} au lieu de throw
 */
function withErrorHandling(fn, fallback, name = '') {
  const prefix = name ? `[${name}] ` : ''

  return function (...args) {
    try {
      const result = fn.apply(this, args)

      if (result instanceof Promise) {
        return result.catch((error) => {
          console.warn(
            `${prefix}Erreur capturée, utilisation du fallback:`,
            error.message,
          )
          return fallback
        })
      }

      return result
    } catch (error) {
      console.warn(
        `${prefix}Erreur capturée, utilisation du fallback:`,
        error.message,
      )
      return fallback
    }
  }
}

/**
 * Décorateur qui met en cache les résultats (memoization).
 * @param {Function} fn - La fonction à mémoizer.
 * @param {Function} [keyFn] - Fonction pour générer la clé de cache.
 * @returns {Function} La fonction mémoizée avec propriété .cache.
 *
 * @example
 * const expensiveCalc = withMemoization(
 *   (n) => n * 2, // calcul coûteux
 *   (n) => `calc_${n}`
 * )
 * expensiveCalc(5) // Calcule
 * expensiveCalc(5) // Retourne du cache
 */
function withMemoization(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  const memoized = function (...args) {
    const key = keyFn(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn.apply(this, args)

    // Gérer les Promises
    if (result instanceof Promise) {
      // Stocker la promesse, pas le résultat
      cache.set(key, result)
      // En cas d'erreur, retirer du cache
      result.catch(() => cache.delete(key))
      return result
    }

    cache.set(key, result)
    return result
  }

  // Exposer le cache pour permettre l'invalidation manuelle
  memoized.cache = cache
  memoized.clearCache = () => cache.clear()

  return memoized
}

/**
 * Décorateur qui limite le nombre d'appels par période.
 * @param {Function} fn - La fonction à limiter.
 * @param {number} maxCalls - Nombre maximum d'appels.
 * @param {number} period - Période en millisecondes.
 * @returns {Function} La fonction limitée.
 *
 * @example
 * const limitedAPI = withRateLimit(
 *   fetchAPI,
 *   10,
 *   60000 // Max 10 appels par minute
 * )
 */
function withRateLimit(fn, maxCalls, period) {
  const calls = []

  return function (...args) {
    const now = Date.now()

    // Nettoyer les appels expirés
    while (calls.length > 0 && calls[0] <= now - period) {
      calls.shift()
    }

    if (calls.length >= maxCalls) {
      const waitTime = calls[0] + period - now
      console.warn(
        `Rate limit atteint. Réessayez dans ${Math.ceil(waitTime / 1000)}s`,
      )
      return Promise.reject(new Error('Rate limit exceeded'))
    }

    calls.push(now)
    return fn.apply(this, args)
  }
}

/**
 * Décorateur qui ajoute une validation des arguments.
 * @param {Function} fn - La fonction à décorer.
 * @param {Function[]} validators - Fonctions de validation pour chaque argument.
 * @returns {Function} La fonction décorée.
 *
 * @example
 * const divide = withValidation(
 *   (a, b) => a / b,
 *   [
 *     (a) => typeof a === 'number' || 'Le premier argument doit être un nombre',
 *     (b) => b !== 0 || 'Division par zéro impossible'
 *   ]
 * )
 */
function withValidation(fn, validators) {
  return function (...args) {
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const result = validator(args[i])

      if (result !== true) {
        throw new Error(
          typeof result === 'string' ? result : `Argument ${i} invalide`,
        )
      }
    }

    return fn.apply(this, args)
  }
}

/**
 * Compose plusieurs décorateurs ensemble.
 * @param {...Function} decorators - Décorateurs à composer (appliqués de droite à gauche).
 * @returns {Function} Fonction qui applique tous les décorateurs.
 *
 * @example
 * const enhancedFn = compose(
 *   (fn) => withLogging(fn, 'myFn'),
 *   (fn) => withErrorHandling(fn, null),
 *   (fn) => withMemoization(fn)
 * )(originalFn)
 */
function compose(...decorators) {
  return function (fn) {
    return decorators.reduceRight(
      (decorated, decorator) => decorator(decorated),
      fn,
    )
  }
}
