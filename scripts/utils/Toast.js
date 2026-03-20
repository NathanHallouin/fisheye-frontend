/**
 * Class for displaying toast notifications.
 * Singleton pattern for centralized toast management.
 */
class Toast {
  static _instance = null
  static _container = null

  /**
   * Available toast types.
   */
  static TYPES = {
    success: {
      icon: '✓',
      className: 'toast--success'
    },
    error: {
      icon: '✕',
      className: 'toast--error'
    },
    warning: {
      icon: '⚠',
      className: 'toast--warning'
    },
    info: {
      icon: 'ℹ',
      className: 'toast--info'
    }
  }

  /**
   * Default durations in ms.
   */
  static DURATIONS = {
    short: 3000,
    medium: 5000,
    long: 8000
  }

  /**
   * Initializes the toast container.
   */
  static _initContainer() {
    if (Toast._container) return

    Toast._container = document.createElement('div')
    Toast._container.classList.add('toast-container')
    Toast._container.setAttribute('aria-live', 'polite')
    Toast._container.setAttribute('aria-atomic', 'true')
    document.body.appendChild(Toast._container)
  }

  /**
   * Displays a toast.
   * @param {string} message - The message to display.
   * @param {string} [type='info'] - The toast type (success, error, warning, info).
   * @param {number|string} [duration='medium'] - The display duration.
   * @returns {HTMLElement} The created toast element.
   */
  static show(message, type = 'info', duration = 'medium') {
    Toast._initContainer()

    const config = Toast.TYPES[type] || Toast.TYPES.info
    const durationMs =
      typeof duration === 'number' ? duration : Toast.DURATIONS[duration] || Toast.DURATIONS.medium

    // Create the toast
    const $toast = document.createElement('div')
    $toast.classList.add('toast', config.className)
    $toast.setAttribute('role', 'alert')

    // Icon
    const $icon = document.createElement('span')
    $icon.classList.add('toast__icon')
    $icon.textContent = config.icon
    $icon.setAttribute('aria-hidden', 'true')

    // Message
    const $message = document.createElement('span')
    $message.classList.add('toast__message')
    $message.textContent = message

    // Close button
    const $closeBtn = document.createElement('button')
    $closeBtn.classList.add('toast__close')
    $closeBtn.setAttribute('aria-label', 'Fermer la notification')
    $closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>'
    $closeBtn.addEventListener('click', () => Toast._dismiss($toast))

    $toast.appendChild($icon)
    $toast.appendChild($message)
    $toast.appendChild($closeBtn)

    // Add to container
    Toast._container.appendChild($toast)

    // Entry animation
    requestAnimationFrame(() => {
      $toast.classList.add('toast--visible')
    })

    // Auto-dismiss
    const timeoutId = setTimeout(() => Toast._dismiss($toast), durationMs)
    $toast._timeoutId = timeoutId

    return $toast
  }

  /**
   * Closes a toast with animation.
   * @param {HTMLElement} $toast - The toast element to close.
   */
  static _dismiss($toast) {
    if (!$toast || !$toast.parentNode) return

    clearTimeout($toast._timeoutId)
    $toast.classList.remove('toast--visible')
    $toast.classList.add('toast--hiding')

    $toast.addEventListener(
      'transitionend',
      () => {
        if ($toast.parentNode) {
          $toast.parentNode.removeChild($toast)
        }
      },
      { once: true }
    )
  }

  /**
   * Shortcut for a success toast.
   * @param {string} message - The message.
   * @param {number|string} [duration] - The duration.
   */
  static success(message, duration) {
    return Toast.show(message, 'success', duration)
  }

  /**
   * Shortcut for an error toast.
   * @param {string} message - The message.
   * @param {number|string} [duration] - The duration.
   */
  static error(message, duration) {
    return Toast.show(message, 'error', duration)
  }

  /**
   * Shortcut for a warning toast.
   * @param {string} message - The message.
   * @param {number|string} [duration] - The duration.
   */
  static warning(message, duration) {
    return Toast.show(message, 'warning', duration)
  }

  /**
   * Shortcut for an info toast.
   * @param {string} message - The message.
   * @param {number|string} [duration] - The duration.
   */
  static info(message, duration) {
    return Toast.show(message, 'info', duration)
  }

  /**
   * Closes all toasts.
   */
  static dismissAll() {
    if (!Toast._container) return

    const toasts = Toast._container.querySelectorAll('.toast')
    toasts.forEach((toast) => Toast._dismiss(toast))
  }
}
