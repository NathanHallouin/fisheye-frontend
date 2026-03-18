/**
 * Pattern Error Boundary pour la gestion centralisée des erreurs.
 *
 * CONCEPT : Error Boundary Pattern
 *
 * Ce pattern permet de:
 * - Capturer les erreurs sans faire crasher l'application
 * - Afficher un UI de fallback en cas d'erreur
 * - Logger les erreurs pour le debugging
 * - Permettre à l'utilisateur de réessayer
 *
 * Inspiré du concept React Error Boundaries, adapté à Vanilla JS.
 */

/**
 * Gestionnaire centralisé des erreurs de l'application.
 */
class ErrorBoundary {
  /**
   * Enveloppe une fonction asynchrone avec gestion d'erreur.
   * @param {Function} fn - La fonction à exécuter.
   * @param {*} fallback - Valeur de retour en cas d'erreur.
   * @param {Object} [options] - Options de configuration.
   * @param {boolean} [options.silent=false] - Ne pas logger l'erreur.
   * @param {Function} [options.onError] - Callback appelé en cas d'erreur.
   * @param {string} [options.context] - Contexte pour le logging.
   * @returns {Promise<*>} Le résultat de la fonction ou le fallback.
   *
   * @example
   * const data = await ErrorBoundary.wrap(
   *   () => api.fetchPhotographers(),
   *   [],
   *   { context: 'HomePage.init' }
   * )
   */
  static async wrap(fn, fallback, options = {}) {
    const { silent = false, onError = null, context = '' } = options

    try {
      return await fn()
    } catch (error) {
      if (!silent) {
        ErrorBoundary._logError(error, context)
      }

      if (onError) {
        try {
          onError(error)
        } catch (callbackError) {
          console.error(
            '[ErrorBoundary] Erreur dans onError callback:',
            callbackError,
          )
        }
      }

      return fallback
    }
  }

  /**
   * Enveloppe une fonction synchrone avec gestion d'erreur.
   * @param {Function} fn - La fonction à exécuter.
   * @param {*} fallback - Valeur de retour en cas d'erreur.
   * @param {Object} [options] - Options de configuration.
   * @returns {*} Le résultat de la fonction ou le fallback.
   */
  static wrapSync(fn, fallback, options = {}) {
    const { silent = false, onError = null, context = '' } = options

    try {
      return fn()
    } catch (error) {
      if (!silent) {
        ErrorBoundary._logError(error, context)
      }

      if (onError) {
        try {
          onError(error)
        } catch (callbackError) {
          console.error(
            '[ErrorBoundary] Erreur dans onError callback:',
            callbackError,
          )
        }
      }

      return fallback
    }
  }

  /**
   * Crée un wrapper réutilisable pour une fonction.
   * @param {*} fallback - Valeur de fallback par défaut.
   * @param {Object} [options] - Options par défaut.
   * @returns {Function} Fonction wrapper.
   *
   * @example
   * const safeFetch = ErrorBoundary.createWrapper(null, { context: 'API' })
   * const data = await safeFetch(() => fetch('/api/data'))
   */
  static createWrapper(fallback, options = {}) {
    return (fn) => ErrorBoundary.wrap(fn, fallback, options)
  }

  /**
   * Exécute une fonction avec retry automatique.
   * @param {Function} fn - La fonction à exécuter.
   * @param {Object} [options] - Options de retry.
   * @param {number} [options.maxRetries=3] - Nombre maximum de tentatives.
   * @param {number} [options.delay=1000] - Délai entre les tentatives (ms).
   * @param {number} [options.backoffMultiplier=2] - Multiplicateur de délai.
   * @param {Function} [options.shouldRetry] - Fonction pour décider si on retry.
   * @returns {Promise<*>} Le résultat de la fonction.
   *
   * @example
   * const data = await ErrorBoundary.withRetry(
   *   () => api.fetchData(),
   *   { maxRetries: 3, delay: 1000 }
   * )
   */
  static async withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoffMultiplier = 2,
      shouldRetry = () => true,
    } = options

    let lastError
    let currentDelay = delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        console.warn(
          `[ErrorBoundary] Tentative ${attempt}/${maxRetries} échouée:`,
          error.message,
        )

        if (attempt < maxRetries && shouldRetry(error)) {
          await ErrorBoundary._sleep(currentDelay)
          currentDelay *= backoffMultiplier
        }
      }
    }

    throw lastError
  }

  /**
   * Crée un composant d'erreur visuel.
   * @param {Error} error - L'erreur à afficher.
   * @param {Object} [options] - Options d'affichage.
   * @param {Function} [options.onRetry] - Callback pour le bouton Réessayer.
   * @param {string} [options.message] - Message personnalisé.
   * @returns {HTMLElement} L'élément DOM d'erreur.
   */
  static createErrorUI(error, options = {}) {
    const { onRetry = null, message = null } = options

    const container = document.createElement('div')
    container.classList.add('error-boundary')
    container.setAttribute('role', 'alert')
    container.setAttribute('aria-live', 'assertive')

    const icon = document.createElement('span')
    icon.classList.add('error-boundary__icon')
    icon.textContent = '⚠️'
    icon.setAttribute('aria-hidden', 'true')

    const title = document.createElement('h3')
    title.classList.add('error-boundary__title')
    title.textContent = "Oups, quelque chose s'est mal passé"

    const messageEl = document.createElement('p')
    messageEl.classList.add('error-boundary__message')
    messageEl.textContent = message || ErrorBoundary._getUserMessage(error)

    container.appendChild(icon)
    container.appendChild(title)
    container.appendChild(messageEl)

    if (onRetry) {
      const retryBtn = document.createElement('button')
      retryBtn.classList.add('error-boundary__retry', 'btn')
      retryBtn.textContent = 'Réessayer'
      retryBtn.addEventListener('click', onRetry)
      container.appendChild(retryBtn)
    }

    return container
  }

  /**
   * Affiche une erreur dans un conteneur avec possibilité de retry.
   * @param {HTMLElement} container - Conteneur où afficher l'erreur.
   * @param {Error} error - L'erreur à afficher.
   * @param {Function} [retryFn] - Fonction à appeler pour réessayer.
   */
  static showError(container, error, retryFn = null) {
    container.innerHTML = ''

    const errorUI = ErrorBoundary.createErrorUI(error, {
      onRetry: retryFn
        ? () => {
            container.innerHTML = '<p class="loading">Chargement...</p>'
            retryFn()
          }
        : null,
    })

    container.appendChild(errorUI)
  }

  /**
   * Configure un gestionnaire global d'erreurs non capturées.
   * @param {Object} [options] - Options de configuration.
   * @param {Function} [options.onError] - Callback pour chaque erreur.
   * @param {boolean} [options.showToast=true] - Afficher un toast.
   */
  static setupGlobalHandler(options = {}) {
    const { onError = null, showToast = true } = options

    // Erreurs synchrones non capturées
    window.addEventListener('error', (event) => {
      ErrorBoundary._logError(event.error || event.message, 'Global')

      if (onError) {
        onError(event.error || new Error(event.message))
      }

      if (showToast && typeof Toast !== 'undefined') {
        Toast.error('Une erreur inattendue est survenue.')
      }
    })

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason))

      ErrorBoundary._logError(error, 'Unhandled Promise')

      if (onError) {
        onError(error)
      }

      if (showToast && typeof Toast !== 'undefined') {
        Toast.error('Une erreur est survenue lors du chargement.')
      }
    })
  }

  /**
   * Log une erreur avec contexte.
   * @param {Error} error - L'erreur à logger.
   * @param {string} [context] - Contexte de l'erreur.
   * @private
   */
  static _logError(error, context = '') {
    const prefix = context ? `[${context}]` : '[ErrorBoundary]'
    console.error(`${prefix} Erreur capturée:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Retourne un message utilisateur pour une erreur.
   * @param {Error} error - L'erreur à analyser.
   * @returns {string} Message pour l'utilisateur.
   * @private
   */
  static _getUserMessage(error) {
    // Utiliser ErrorHandler si disponible
    if (typeof ErrorHandler !== 'undefined') {
      return ErrorHandler.getDisplayMessage(error)
    }

    // Messages de base
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Problème de connexion. Vérifiez votre réseau et réessayez.'
    }

    if (error.name === 'TypeError') {
      return 'Une erreur technique est survenue.'
    }

    return 'Une erreur inattendue est survenue. Veuillez réessayer.'
  }

  /**
   * Utilitaire pour attendre.
   * @param {number} ms - Millisecondes à attendre.
   * @returns {Promise<void>}
   * @private
   */
  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
