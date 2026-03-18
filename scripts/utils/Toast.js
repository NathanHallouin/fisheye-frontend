/**
 * Classe pour afficher des notifications toast.
 * Singleton pattern pour une gestion centralisée des toasts.
 */
class Toast {
  static _instance = null
  static _container = null

  /**
   * Types de toast disponibles.
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
   * Durées par défaut en ms.
   */
  static DURATIONS = {
    short: 3000,
    medium: 5000,
    long: 8000
  }

  /**
   * Initialise le conteneur de toasts.
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
   * Affiche un toast.
   * @param {string} message - Le message à afficher.
   * @param {string} [type='info'] - Le type de toast (success, error, warning, info).
   * @param {number|string} [duration='medium'] - La durée d'affichage.
   * @returns {HTMLElement} L'élément toast créé.
   */
  static show(message, type = 'info', duration = 'medium') {
    Toast._initContainer()

    const config = Toast.TYPES[type] || Toast.TYPES.info
    const durationMs =
      typeof duration === 'number' ? duration : Toast.DURATIONS[duration] || Toast.DURATIONS.medium

    // Créer le toast
    const $toast = document.createElement('div')
    $toast.classList.add('toast', config.className)
    $toast.setAttribute('role', 'alert')

    // Icône
    const $icon = document.createElement('span')
    $icon.classList.add('toast__icon')
    $icon.textContent = config.icon
    $icon.setAttribute('aria-hidden', 'true')

    // Message
    const $message = document.createElement('span')
    $message.classList.add('toast__message')
    $message.textContent = message

    // Bouton de fermeture
    const $closeBtn = document.createElement('button')
    $closeBtn.classList.add('toast__close')
    $closeBtn.setAttribute('aria-label', 'Fermer la notification')
    $closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>'
    $closeBtn.addEventListener('click', () => Toast._dismiss($toast))

    $toast.appendChild($icon)
    $toast.appendChild($message)
    $toast.appendChild($closeBtn)

    // Ajouter au conteneur
    Toast._container.appendChild($toast)

    // Animation d'entrée
    requestAnimationFrame(() => {
      $toast.classList.add('toast--visible')
    })

    // Auto-dismiss
    const timeoutId = setTimeout(() => Toast._dismiss($toast), durationMs)
    $toast._timeoutId = timeoutId

    return $toast
  }

  /**
   * Ferme un toast avec animation.
   * @param {HTMLElement} $toast - L'élément toast à fermer.
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
   * Raccourci pour un toast de succès.
   * @param {string} message - Le message.
   * @param {number|string} [duration] - La durée.
   */
  static success(message, duration) {
    return Toast.show(message, 'success', duration)
  }

  /**
   * Raccourci pour un toast d'erreur.
   * @param {string} message - Le message.
   * @param {number|string} [duration] - La durée.
   */
  static error(message, duration) {
    return Toast.show(message, 'error', duration)
  }

  /**
   * Raccourci pour un toast d'avertissement.
   * @param {string} message - Le message.
   * @param {number|string} [duration] - La durée.
   */
  static warning(message, duration) {
    return Toast.show(message, 'warning', duration)
  }

  /**
   * Raccourci pour un toast d'information.
   * @param {string} message - Le message.
   * @param {number|string} [duration] - La durée.
   */
  static info(message, duration) {
    return Toast.show(message, 'info', duration)
  }

  /**
   * Ferme tous les toasts.
   */
  static dismissAll() {
    if (!Toast._container) return

    const toasts = Toast._container.querySelectorAll('.toast')
    toasts.forEach((toast) => Toast._dismiss(toast))
  }
}
