/**
 * Error Boundary pattern for centralized error handling.
 *
 * CONCEPT: Error Boundary Pattern
 *
 * This pattern allows you to:
 * - Capture errors without crashing the application
 * - Display a fallback UI in case of error
 * - Log errors for debugging
 * - Allow the user to retry
 *
 * Inspired by the React Error Boundaries concept, adapted to Vanilla JS.
 */

/**
 * Centralized error handler for the application.
 */
class ErrorBoundary {
  /**
   * Wraps an asynchronous function with error handling.
   * @param {Function} fn - The function to execute.
   * @param {*} fallback - Return value in case of error.
   * @param {Object} [options] - Configuration options.
   * @param {boolean} [options.silent=false] - Do not log the error.
   * @param {Function} [options.onError] - Callback called in case of error.
   * @param {string} [options.context] - Context for logging.
   * @returns {Promise<*>} The function result or the fallback.
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
            '[ErrorBoundary] Error in onError callback:',
            callbackError,
          )
        }
      }

      return fallback
    }
  }

  /**
   * Wraps a synchronous function with error handling.
   * @param {Function} fn - The function to execute.
   * @param {*} fallback - Return value in case of error.
   * @param {Object} [options] - Configuration options.
   * @returns {*} The function result or the fallback.
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
            '[ErrorBoundary] Error in onError callback:',
            callbackError,
          )
        }
      }

      return fallback
    }
  }

  /**
   * Creates a reusable wrapper for a function.
   * @param {*} fallback - Default fallback value.
   * @param {Object} [options] - Default options.
   * @returns {Function} Wrapper function.
   *
   * @example
   * const safeFetch = ErrorBoundary.createWrapper(null, { context: 'API' })
   * const data = await safeFetch(() => fetch('/api/data'))
   */
  static createWrapper(fallback, options = {}) {
    return (fn) => ErrorBoundary.wrap(fn, fallback, options)
  }

  /**
   * Executes a function with automatic retry.
   * @param {Function} fn - The function to execute.
   * @param {Object} [options] - Retry options.
   * @param {number} [options.maxRetries=3] - Maximum number of attempts.
   * @param {number} [options.delay=1000] - Delay between attempts (ms).
   * @param {number} [options.backoffMultiplier=2] - Delay multiplier.
   * @param {Function} [options.shouldRetry] - Function to decide if we retry.
   * @returns {Promise<*>} The function result.
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
          `[ErrorBoundary] Attempt ${attempt}/${maxRetries} failed:`,
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
   * Creates a visual error component.
   * @param {Error} error - The error to display.
   * @param {Object} [options] - Display options.
   * @param {Function} [options.onRetry] - Callback for the Retry button.
   * @param {string} [options.message] - Custom message.
   * @returns {HTMLElement} The error DOM element.
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
    title.textContent = 'Oops, something went wrong'

    const messageEl = document.createElement('p')
    messageEl.classList.add('error-boundary__message')
    messageEl.textContent = message || ErrorBoundary._getUserMessage(error)

    container.appendChild(icon)
    container.appendChild(title)
    container.appendChild(messageEl)

    if (onRetry) {
      const retryBtn = document.createElement('button')
      retryBtn.classList.add('error-boundary__retry', 'btn')
      retryBtn.textContent = 'Retry'
      retryBtn.addEventListener('click', onRetry)
      container.appendChild(retryBtn)
    }

    return container
  }

  /**
   * Displays an error in a container with retry option.
   * @param {HTMLElement} container - Container where to display the error.
   * @param {Error} error - The error to display.
   * @param {Function} [retryFn] - Function to call to retry.
   */
  static showError(container, error, retryFn = null) {
    container.innerHTML = ''

    const errorUI = ErrorBoundary.createErrorUI(error, {
      onRetry: retryFn
        ? () => {
            container.innerHTML = '<p class="loading">Loading...</p>'
            retryFn()
          }
        : null,
    })

    container.appendChild(errorUI)
  }

  /**
   * Sets up a global handler for uncaught errors.
   * @param {Object} [options] - Configuration options.
   * @param {Function} [options.onError] - Callback for each error.
   * @param {boolean} [options.showToast=true] - Display a toast.
   */
  static setupGlobalHandler(options = {}) {
    const { onError = null, showToast = true } = options

    // Uncaught synchronous errors
    window.addEventListener('error', (event) => {
      ErrorBoundary._logError(event.error || event.message, 'Global')

      if (onError) {
        onError(event.error || new Error(event.message))
      }

      if (showToast && typeof Toast !== 'undefined') {
        Toast.error('An unexpected error occurred.')
      }
    })

    // Unhandled rejected promises
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
        Toast.error('An error occurred during loading.')
      }
    })
  }

  /**
   * Logs an error with context.
   * @param {Error} error - The error to log.
   * @param {string} [context] - Error context.
   * @private
   */
  static _logError(error, context = '') {
    const prefix = context ? `[${context}]` : '[ErrorBoundary]'
    console.error(`${prefix} Error captured:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Returns a user message for an error.
   * @param {Error} error - The error to analyze.
   * @returns {string} Message for the user.
   * @private
   */
  static _getUserMessage(error) {
    // Use ErrorHandler if available
    if (typeof ErrorHandler !== 'undefined') {
      return ErrorHandler.getDisplayMessage(error)
    }

    // Basic messages
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Connection problem. Check your network and try again.'
    }

    if (error.name === 'TypeError') {
      return 'A technical error occurred.'
    }

    return 'An unexpected error occurred. Please try again.'
  }

  /**
   * Utility to wait.
   * @param {number} ms - Milliseconds to wait.
   * @returns {Promise<void>}
   * @private
   */
  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
