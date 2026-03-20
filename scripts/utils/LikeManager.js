/**
 * Like manager with event delegation.
 *
 * @description
 * Manages likes on media with:
 * - Event Delegation: a single listener for all buttons
 * - Optimistic UI: immediate update before confirmation
 * - localStorage persistence
 * - Feedback animation
 *
 * KEY CONCEPT: Event Delegation
 * Instead of attaching a listener to EACH like button,
 * we attach ONE SINGLE listener to the parent container.
 * The listener then identifies which button was clicked.
 *
 * Advantages:
 * - Performance: fewer listeners = less memory
 * - Dynamic: works with elements added later
 * - Simplicity: one place to handle the logic
 */
class LikeManager {
  /**
   * Unique instance (Singleton).
   * @type {LikeManager|null}
   */
  static _instance = null

  /**
   * localStorage storage key.
   * @type {string}
   */
  static STORAGE_KEY = 'fisheye_likes'

  /**
   * Name of the event emitted on changes.
   * @type {string}
   */
  static CHANGE_EVENT = 'likes-changed'

  /**
   * Returns the unique instance of LikeManager.
   * @returns {LikeManager} The unique instance.
   */
  static getInstance() {
    if (!LikeManager._instance) {
      LikeManager._instance = new LikeManager()
    }
    return LikeManager._instance
  }

  /**
   * Creates a LikeManager instance.
   */
  constructor() {
    this._likes = this._load()
    this._containers = new Set()
  }

  /**
   * Loads likes from localStorage.
   *
   * @returns {Object} The likes { mediaId: likeCount }.
   * @private
   */
  _load() {
    try {
      const data = localStorage.getItem(LikeManager.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('LikeManager: Loading error', error)
      return {}
    }
  }

  /**
   * Saves likes to localStorage.
   * @private
   */
  _save() {
    try {
      localStorage.setItem(LikeManager.STORAGE_KEY, JSON.stringify(this._likes))
    } catch (error) {
      console.error('LikeManager: Saving error', error)
    }
  }

  /**
   * Attaches event delegation to a container.
   *
   * @description
   * CONCEPT: Event Delegation
   *
   * We attach the listener to the CONTAINER, not to the buttons.
   * When a click occurs, the event "bubbles" (rises)
   * up to the container where we capture it.
   *
   * e.target = the clicked element (can be the button or a child)
   * e.target.closest() = finds the ancestor matching the selector
   *
   * @param {HTMLElement} container - The container to observe.
   */
  attachToContainer(container) {
    if (this._containers.has(container)) return

    /**
     * CONCEPT: Event Delegation with closest()
     *
     * closest() climbs up the DOM to find the matching ancestor.
     * If the click is on the SVG icon inside the button,
     * closest('[data-like-id]') finds the parent button.
     */
    container.addEventListener('click', (e) => {
      // Find the closest like button (or null if clicked elsewhere)
      const likeBtn = e.target.closest('[data-like-id]')

      if (likeBtn) {
        e.preventDefault()
        this._handleLikeClick(likeBtn)
      }
    })

    this._containers.add(container)
  }

  /**
   * Handles click on a like button.
   *
   * @description
   * CONCEPT: Optimistic UI
   *
   * We update the interface IMMEDIATELY, even before
   * saving. The user sees the feedback instantly.
   *
   * If saving fails, we could rollback (not implemented here).
   *
   * @param {HTMLElement} button - The clicked button.
   * @private
   */
  _handleLikeClick(button) {
    /**
     * CONCEPT: data-* attributes
     *
     * The data-* attributes allow storing data
     * directly in HTML, accessible via dataset.
     *
     * <button data-like-id="123" data-base-likes="42">
     * button.dataset.likeId = "123"
     * button.dataset.baseLikes = "42"
     */
    const mediaId = button.dataset.likeId
    const baseLikes = parseInt(button.dataset.baseLikes, 10) || 0

    // Toggle the like
    const isLiked = this.toggle(mediaId)

    // OPTIMISTIC UI update (before saving)
    this._updateButtonUI(button, isLiked, baseLikes)

    // Feedback animation
    this._animateButton(button)

    // Save (async in background)
    this._save()

    // Emit change event
    this._emitChange(mediaId, isLiked)
  }

  /**
   * Updates the button appearance.
   *
   * @param {HTMLElement} button - The button to update.
   * @param {boolean} isLiked - Whether the media is liked.
   * @param {number} baseLikes - Base number of likes.
   * @private
   */
  _updateButtonUI(button, isLiked, baseLikes) {
    // Update the class
    button.classList.toggle('like-btn--liked', isLiked)

    // Update aria-pressed for accessibility
    button.setAttribute('aria-pressed', isLiked.toString())

    // Update the counter
    const counter = button.querySelector('.like-btn__count')
    if (counter) {
      const totalLikes = baseLikes + (isLiked ? 1 : 0)
      counter.textContent = totalLikes
    }
  }

  /**
   * Animates the button after a click.
   *
   * @param {HTMLElement} button - The button to animate.
   * @private
   */
  _animateButton(button) {
    // Add the animation class
    button.classList.add('like-btn--pulse')

    // Remove after animation
    button.addEventListener(
      'animationend',
      () => {
        button.classList.remove('like-btn--pulse')
      },
      { once: true }, // Listener automatically removed after
    )
  }

  /**
   * Emits a custom change event.
   *
   * @param {string} mediaId - The media ID.
   * @param {boolean} isLiked - Whether the media is liked.
   * @private
   */
  _emitChange(mediaId, isLiked) {
    const event = new CustomEvent(LikeManager.CHANGE_EVENT, {
      detail: {
        mediaId,
        isLiked,
        totalLikes: this.getTotalLikes(),
      },
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  /**
   * Toggles the like of a media.
   *
   * @param {string} mediaId - The media ID.
   * @returns {boolean} True if liked after toggle.
   */
  toggle(mediaId) {
    if (this._likes[mediaId]) {
      delete this._likes[mediaId]
      return false
    } else {
      this._likes[mediaId] = true
      return true
    }
  }

  /**
   * Checks if a media is liked.
   *
   * @param {string} mediaId - The media ID.
   * @returns {boolean} True if liked.
   */
  isLiked(mediaId) {
    return !!this._likes[mediaId]
  }

  /**
   * Returns the total number of likes.
   *
   * @returns {number} The total.
   */
  getTotalLikes() {
    return Object.keys(this._likes).length
  }

  /**
   * Returns all liked media.
   *
   * @returns {string[]} The IDs of liked media.
   */
  getLikedMediaIds() {
    return Object.keys(this._likes)
  }

  /**
   * Listens to like changes.
   *
   * @param {Function} callback - The function to call.
   * @returns {Function} Function to stop listening.
   */
  onChange(callback) {
    const handler = (e) => callback(e.detail)
    document.addEventListener(LikeManager.CHANGE_EVENT, handler)
    return () => document.removeEventListener(LikeManager.CHANGE_EVENT, handler)
  }

  /**
   * Creates a like button for a media.
   *
   * @param {Object} media - The media data.
   * @param {string|number} media.id - The media ID.
   * @param {number} media.likes - The base number of likes.
   * @returns {HTMLElement} The created button.
   */
  createLikeButton(media) {
    const isLiked = this.isLiked(String(media.id))
    const totalLikes = media.likes + (isLiked ? 1 : 0)

    const button = document.createElement('button')
    button.type = 'button'
    button.classList.add('like-btn')
    if (isLiked) {
      button.classList.add('like-btn--liked')
    }

    // data-* attributes for Event Delegation
    button.dataset.likeId = media.id
    button.dataset.baseLikes = media.likes

    // Accessibility
    button.setAttribute('aria-label', `Like this media`)
    button.setAttribute('aria-pressed', isLiked.toString())

    // Content
    button.innerHTML = `
      <svg class="like-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span class="like-btn__count">${totalLikes}</span>
    `

    return button
  }
}
