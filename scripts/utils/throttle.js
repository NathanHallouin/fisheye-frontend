/**
 * Crée une version throttled d'une fonction.
 * La fonction sera exécutée au maximum une fois par intervalle.
 *
 * @param {Function} fn - La fonction à throttler.
 * @param {number} limit - L'intervalle minimum entre les exécutions en ms.
 * @param {Object} [options] - Options de configuration.
 * @param {boolean} [options.leading=true] - Exécuter au début de l'intervalle.
 * @param {boolean} [options.trailing=true] - Exécuter à la fin de l'intervalle.
 * @returns {Function} La fonction throttled.
 *
 * @example
 * // Limiter les appels à une fois toutes les 100ms
 * const throttledScroll = throttle(handleScroll, 100)
 * window.addEventListener('scroll', throttledScroll)
 *
 * @example
 * // Throttle avec options
 * const throttledResize = throttle(handleResize, 200, { trailing: false })
 */
function throttle(fn, limit, options = {}) {
  const { leading = true, trailing = true } = options

  let lastCall = 0
  let timeoutId = null
  let lastArgs = null

  /**
   * Fonction throttled.
   */
  function throttled(...args) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Sauvegarder les derniers arguments pour le trailing call
    lastArgs = args

    // Premier appel ou intervalle écoulé
    if (timeSinceLastCall >= limit) {
      if (leading || lastCall !== 0) {
        lastCall = now
        fn.apply(this, args)
      } else {
        lastCall = now
      }

      // Annuler le timeout trailing si présent
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    } else if (trailing && !timeoutId) {
      // Planifier un appel trailing
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn.apply(this, lastArgs)
      }, limit - timeSinceLastCall)
    }
  }

  /**
   * Annule les appels en attente.
   */
  throttled.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastCall = 0
    lastArgs = null
  }

  /**
   * Force l'exécution immédiate si un appel est en attente.
   */
  throttled.flush = function () {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastCall = Date.now()
      fn.apply(this, lastArgs)
      lastArgs = null
    }
  }

  return throttled
}

/**
 * Crée une version throttled utilisant requestAnimationFrame.
 * Idéal pour les animations et les mises à jour visuelles.
 *
 * @param {Function} fn - La fonction à throttler.
 * @returns {Function} La fonction throttled.
 *
 * @example
 * const throttledUpdate = rafThrottle(updatePosition)
 * window.addEventListener('mousemove', throttledUpdate)
 */
function rafThrottle(fn) {
  let rafId = null
  let lastArgs = null

  function throttled(...args) {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn.apply(this, lastArgs)
        rafId = null
      })
    }
  }

  throttled.cancel = function () {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastArgs = null
  }

  return throttled
}
