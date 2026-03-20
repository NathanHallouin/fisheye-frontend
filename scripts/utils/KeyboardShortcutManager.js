/**
 * Keyboard shortcut manager.
 *
 * @description
 * Centralizes all keyboard shortcuts of the application.
 *
 * KEY CONCEPTS:
 *
 * 1. KeyboardEvent
 *    - e.key: the pressed key ('a', 'Enter', 'Escape', etc.)
 *    - e.code: the physical key code ('KeyA', 'Enter', 'Escape')
 *    - e.ctrlKey, e.altKey, e.shiftKey, e.metaKey: modifiers
 *
 * 2. Modifiers
 *    - Ctrl (ctrlKey): standard shortcuts (Ctrl+S, Ctrl+K)
 *    - Meta (metaKey): Cmd on Mac, Windows on Windows
 *    - Alt (altKey): alternative shortcuts
 *    - Shift (shiftKey): reverse the action (Shift+Tab)
 *
 * 3. preventDefault()
 *    - Prevents the browser's default behavior
 *    - Ex: Ctrl+K opens the browser's search bar, we block it
 *
 * 4. Event Capturing vs Bubbling
 *    - Capturing (capture: true): goes down from parent to child
 *    - Bubbling (default): goes up from child to parent
 *    - For global shortcuts, we use capturing to intercept them early
 */
class KeyboardShortcutManager {
  /**
   * Unique instance (Singleton).
   * @type {KeyboardShortcutManager|null}
   */
  static _instance = null

  /**
   * Returns the unique instance of KeyboardShortcutManager.
   * @returns {KeyboardShortcutManager} The unique instance.
   */
  static getInstance() {
    if (!KeyboardShortcutManager._instance) {
      KeyboardShortcutManager._instance = new KeyboardShortcutManager()
    }
    return KeyboardShortcutManager._instance
  }

  /**
   * Creates a KeyboardShortcutManager instance.
   */
  constructor() {
    /**
     * Map of registered shortcuts.
     * Key: shortcut identifier (e.g., 'ctrl+k')
     * Value: { handler, description, enabled }
     */
    this._shortcuts = new Map()

    /**
     * Active context (allows grouping shortcuts).
     * E.g., 'global', 'lightbox', 'modal'
     */
    this._activeContext = 'global'

    /**
     * Help overlay state.
     */
    this._helpOverlayVisible = false

    /**
     * Help overlay DOM element.
     */
    this._helpOverlay = null

    // Initialize the global listener
    this._init()
  }

  /**
   * Initializes the global keyboard listener.
   *
   * @description
   * CONCEPT: Event Capturing
   *
   * We use { capture: true } to intercept events
   * BEFORE they reach the page elements.
   * This allows capturing Ctrl+K before the browser
   * opens its own search bar.
   *
   * @private
   */
  _init() {
    /**
     * CONCEPT: keydown vs keyup vs keypress
     *
     * - keydown: triggered when the key is pressed (repeated if held)
     * - keyup: triggered when the key is released
     * - keypress: OBSOLETE, do not use
     *
     * We use keydown for shortcuts because:
     * - Immediate response to the press
     * - Supports modifier keys
     * - Can be repeated (useful for J/K navigation)
     */
    document.addEventListener(
      'keydown',
      (e) => this._handleKeydown(e),
      { capture: true }, // Capture BEFORE bubbling
    )

    // Register default shortcuts
    this._registerDefaultShortcuts()
  }

  /**
   * Registers the application's default shortcuts.
   * @private
   */
  _registerDefaultShortcuts() {
    // Help shortcut (always available)
    this.register('?', {
      handler: () => this.toggleHelpOverlay(),
      description: 'Show/hide shortcuts help',
      context: 'global',
    })

    // Search
    this.register('ctrl+k', {
      handler: () => this._focusSearch(),
      description: 'Open search',
      context: 'global',
    })

    // Escape - close modals/lightbox
    this.register('Escape', {
      handler: () => this._handleEscape(),
      description: 'Close modal/lightbox',
      context: 'global',
    })

    // Media navigation (J/K like Vim)
    this.register('j', {
      handler: () => this._navigateMedia('next'),
      description: 'Next media',
      context: 'gallery',
    })

    this.register('k', {
      handler: () => this._navigateMedia('prev'),
      description: 'Previous media',
      context: 'gallery',
    })

    // Like
    this.register('l', {
      handler: () => this._likeCurrentMedia(),
      description: 'Like current media',
      context: 'gallery',
    })

    // Lightbox navigation
    this.register('ArrowRight', {
      handler: () => this._lightboxNext(),
      description: 'Next image (lightbox)',
      context: 'lightbox',
    })

    this.register('ArrowLeft', {
      handler: () => this._lightboxPrev(),
      description: 'Previous image (lightbox)',
      context: 'lightbox',
    })
  }

  /**
   * Handles the keydown event.
   *
   * @param {KeyboardEvent} e - The keyboard event.
   * @private
   */
  _handleKeydown(e) {
    // Ignore if we're in an input field (except Escape)
    if (this._isInputFocused(e) && e.key !== 'Escape') {
      return
    }

    // Build the shortcut identifier
    const shortcutKey = this._buildShortcutKey(e)

    // Look for the shortcut
    const shortcut = this._shortcuts.get(shortcutKey)

    if (shortcut && shortcut.enabled) {
      // Check the context
      if (this._isContextActive(shortcut.context)) {
        /**
         * CONCEPT: preventDefault()
         *
         * Prevents the browser's default behavior.
         * E.g., Ctrl+K normally opens the address bar,
         * we want our own behavior.
         */
        e.preventDefault()

        /**
         * CONCEPT: stopPropagation()
         *
         * Stops the event propagation.
         * Prevents other listeners from receiving the event.
         */
        e.stopPropagation()

        // Execute the handler
        shortcut.handler(e)
      }
    }
  }

  /**
   * Checks if an input field has focus.
   *
   * @param {KeyboardEvent} e - The keyboard event.
   * @returns {boolean} True if an input has focus.
   * @private
   */
  _isInputFocused(e) {
    const target = e.target
    const tagName = target.tagName.toLowerCase()

    // Inputs, textareas, and contenteditable elements
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    )
  }

  /**
   * Builds the shortcut identifier from the event.
   *
   * @description
   * CONCEPT: Shortcut Normalization
   *
   * We build a normalized string like 'ctrl+shift+k'
   * to compare with registered shortcuts.
   *
   * @param {KeyboardEvent} e - The keyboard event.
   * @returns {string} The shortcut identifier.
   * @private
   */
  _buildShortcutKey(e) {
    const parts = []

    // Add modifiers in order
    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.altKey) parts.push('alt')
    if (e.shiftKey) parts.push('shift')

    // Add the main key (lowercase except special keys)
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    parts.push(key)

    return parts.join('+')
  }

  /**
   * Checks if a context is active.
   *
   * @param {string} context - The context to check.
   * @returns {boolean} True if the context is active.
   * @private
   */
  _isContextActive(context) {
    // 'global' is always active
    if (context === 'global') return true

    // Check the active context
    return context === this._activeContext
  }

  /**
   * Registers a new shortcut.
   *
   * @param {string} key - The shortcut identifier (e.g., 'ctrl+k', 'Escape').
   * @param {Object} options - Shortcut options.
   * @param {Function} options.handler - Function to execute.
   * @param {string} options.description - Description for help.
   * @param {string} [options.context='global'] - Shortcut context.
   * @returns {Function} Function to unregister the shortcut.
   *
   * @example
   * const unregister = shortcuts.register('ctrl+s', {
   *   handler: () => console.log('Save!'),
   *   description: 'Save',
   *   context: 'editor'
   * })
   */
  register(key, options) {
    const normalizedKey = key.toLowerCase()

    this._shortcuts.set(normalizedKey, {
      handler: options.handler,
      description: options.description,
      context: options.context || 'global',
      enabled: true,
    })

    // Return an unregister function
    return () => this.unregister(normalizedKey)
  }

  /**
   * Unregisters a shortcut.
   *
   * @param {string} key - The shortcut identifier.
   */
  unregister(key) {
    this._shortcuts.delete(key.toLowerCase())
  }

  /**
   * Enables or disables a shortcut.
   *
   * @param {string} key - The shortcut identifier.
   * @param {boolean} enabled - Desired state.
   */
  setEnabled(key, enabled) {
    const shortcut = this._shortcuts.get(key.toLowerCase())
    if (shortcut) {
      shortcut.enabled = enabled
    }
  }

  /**
   * Changes the active context.
   *
   * @param {string} context - The new context.
   */
  setContext(context) {
    this._activeContext = context
  }

  /**
   * Returns to the global context.
   */
  resetContext() {
    this._activeContext = 'global'
  }

  // ============================================
  // Default shortcut handlers
  // ============================================

  /**
   * Focuses the search field.
   * @private
   */
  _focusSearch() {
    const searchInput = document.querySelector('.search-bar__input')
    if (searchInput) {
      searchInput.focus()
      searchInput.select() // Select existing text
    }
  }

  /**
   * Handles the Escape key.
   * @private
   */
  _handleEscape() {
    // Close help overlay first
    if (this._helpOverlayVisible) {
      this.hideHelpOverlay()
      return
    }

    // Close lightbox if open
    if (window.lightbox && window.lightbox.close) {
      window.lightbox.close()
      return
    }

    // Close contact modal if open
    const contactModal = document.querySelector('.contact-modal')
    if (contactModal && contactModal.style.display !== 'none') {
      // Look for the close function
      const closeBtn = contactModal.querySelector('.contact-modal__close')
      if (closeBtn) closeBtn.click()
      return
    }

    // Blur the active element
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur()
    }
  }

  /**
   * Navigates between media.
   *
   * @param {string} direction - 'next' or 'prev'.
   * @private
   */
  _navigateMedia(direction) {
    const mediaCards = document.querySelectorAll('.media-card')
    if (mediaCards.length === 0) return

    // Find the currently focused or highlighted card
    const currentIndex = this._getCurrentMediaIndex(mediaCards)

    let newIndex
    if (direction === 'next') {
      newIndex = currentIndex < mediaCards.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : mediaCards.length - 1
    }

    // Focus the new card
    const newCard = mediaCards[newIndex]
    newCard.focus()
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Add a class for visual highlight
    mediaCards.forEach((card) => card.classList.remove('media-card--focused'))
    newCard.classList.add('media-card--focused')
  }

  /**
   * Returns the index of the currently selected media.
   *
   * @param {NodeList} mediaCards - List of media cards.
   * @returns {number} The current index.
   * @private
   */
  _getCurrentMediaIndex(mediaCards) {
    const focused = document.querySelector('.media-card--focused')
    if (focused) {
      return Array.from(mediaCards).indexOf(focused)
    }

    // If none is focused, return -1 to start at the beginning
    return -1
  }

  /**
   * Likes the currently selected media.
   * @private
   */
  _likeCurrentMedia() {
    const focusedCard = document.querySelector('.media-card--focused')
    if (focusedCard) {
      const likeBtn = focusedCard.querySelector('[data-like-id]')
      if (likeBtn) {
        likeBtn.click()
      }
    }
  }

  /**
   * Next image in lightbox.
   * @private
   */
  _lightboxNext() {
    if (window.lightbox && window.lightbox.next) {
      window.lightbox.next()
    }
  }

  /**
   * Previous image in lightbox.
   * @private
   */
  _lightboxPrev() {
    if (window.lightbox && window.lightbox.prev) {
      window.lightbox.prev()
    }
  }

  // ============================================
  // Help overlay
  // ============================================

  /**
   * Toggles the help overlay display.
   */
  toggleHelpOverlay() {
    if (this._helpOverlayVisible) {
      this.hideHelpOverlay()
    } else {
      this.showHelpOverlay()
    }
  }

  /**
   * Shows the help overlay with all shortcuts.
   */
  showHelpOverlay() {
    if (!this._helpOverlay) {
      this._createHelpOverlay()
    }

    this._updateHelpContent()
    this._helpOverlay.classList.add('shortcut-help--visible')
    this._helpOverlayVisible = true

    // Focus the overlay for accessibility
    this._helpOverlay.focus()
  }

  /**
   * Hides the help overlay.
   */
  hideHelpOverlay() {
    if (this._helpOverlay) {
      this._helpOverlay.classList.remove('shortcut-help--visible')
      this._helpOverlayVisible = false
    }
  }

  /**
   * Creates the help overlay DOM element.
   * @private
   */
  _createHelpOverlay() {
    this._helpOverlay = document.createElement('div')
    this._helpOverlay.classList.add('shortcut-help')
    this._helpOverlay.setAttribute('role', 'dialog')
    this._helpOverlay.setAttribute('aria-label', 'Keyboard shortcuts')
    this._helpOverlay.setAttribute('tabindex', '-1')

    // Close when clicking on the overlay
    this._helpOverlay.addEventListener('click', (e) => {
      if (e.target === this._helpOverlay) {
        this.hideHelpOverlay()
      }
    })

    document.body.appendChild(this._helpOverlay)
  }

  /**
   * Updates the help overlay content.
   * @private
   */
  _updateHelpContent() {
    // Group shortcuts by context
    const byContext = new Map()

    this._shortcuts.forEach((shortcut, key) => {
      if (!byContext.has(shortcut.context)) {
        byContext.set(shortcut.context, [])
      }
      byContext.get(shortcut.context).push({ key, ...shortcut })
    })

    // Generate the HTML
    let html = `
      <div class="shortcut-help__content">
        <h2 class="shortcut-help__title">Keyboard shortcuts</h2>
        <button class="shortcut-help__close" aria-label="Close">&times;</button>
    `

    const contextNames = {
      global: 'Global',
      gallery: 'Gallery',
      lightbox: 'Lightbox',
    }

    byContext.forEach((shortcuts, context) => {
      html += `
        <section class="shortcut-help__section">
          <h3 class="shortcut-help__section-title">${contextNames[context] || context}</h3>
          <dl class="shortcut-help__list">
      `

      shortcuts.forEach((shortcut) => {
        const keyDisplay = this._formatKeyForDisplay(shortcut.key)
        html += `
          <div class="shortcut-help__item">
            <dt class="shortcut-help__key">${keyDisplay}</dt>
            <dd class="shortcut-help__description">${shortcut.description}</dd>
          </div>
        `
      })

      html += `
          </dl>
        </section>
      `
    })

    html += `
        <p class="shortcut-help__hint">Press <kbd>?</kbd> to close</p>
      </div>
    `

    this._helpOverlay.innerHTML = html

    // Attach close listener
    const closeBtn = this._helpOverlay.querySelector('.shortcut-help__close')
    closeBtn.addEventListener('click', () => this.hideHelpOverlay())
  }

  /**
   * Formats a key for display.
   *
   * @param {string} key - The shortcut identifier.
   * @returns {string} Formatted HTML for display.
   * @private
   */
  _formatKeyForDisplay(key) {
    const parts = key.split('+')

    return parts
      .map((part) => {
        // Replace names with symbols or readable names
        const displayMap = {
          ctrl: 'Ctrl',
          alt: 'Alt',
          shift: 'Shift',
          arrowright: '→',
          arrowleft: '←',
          arrowup: '↑',
          arrowdown: '↓',
          escape: 'Esc',
          enter: '↵',
          ' ': 'Space',
        }
        const display = displayMap[part] || part.toUpperCase()
        return `<kbd>${display}</kbd>`
      })
      .join(' + ')
  }

  /**
   * Returns all registered shortcuts.
   *
   * @returns {Map} Map of shortcuts.
   */
  getShortcuts() {
    return new Map(this._shortcuts)
  }
}
