/**
 * Page visibility manager.
 * Automatically pauses videos when the tab is not visible
 * and resumes them when the user returns.
 *
 * CONCEPT: Page Visibility API
 *
 * The Page Visibility API allows detecting when a tab becomes
 * visible or hidden. This enables resource optimization:
 * - Pause videos/animations
 * - Reduce network requests
 * - Save battery on mobile
 */
class PageVisibilityManager {
  static _instance = null

  /**
   * Returns the unique PageVisibilityManager instance.
   * @returns {PageVisibilityManager} The unique instance.
   */
  static getInstance() {
    if (!PageVisibilityManager._instance) {
      PageVisibilityManager._instance = new PageVisibilityManager()
    }
    return PageVisibilityManager._instance
  }

  /**
   * Creates a PageVisibilityManager instance.
   */
  constructor() {
    /**
     * Set of videos that were playing before the page was hidden.
     * @type {Set<HTMLVideoElement>}
     */
    this._playingVideos = new Set()

    /**
     * Callbacks to execute on visibility changes.
     * @type {Map<string, Function>}
     */
    this._callbacks = new Map()

    /**
     * Current visibility state.
     * @type {boolean}
     */
    this._isVisible = !document.hidden

    this._init()
  }

  /**
   * Initializes the visibility listener.
   * @private
   */
  _init() {
    // Check API support
    if (typeof document.hidden === 'undefined') {
      console.warn('Page Visibility API not supported')
      return
    }

    document.addEventListener('visibilitychange', () => this._handleVisibilityChange())
  }

  /**
   * Handles page visibility changes.
   * @private
   */
  _handleVisibilityChange() {
    this._isVisible = !document.hidden

    if (document.hidden) {
      this._onHidden()
    } else {
      this._onVisible()
    }

    // Execute registered callbacks
    this._callbacks.forEach((callback) => {
      try {
        callback(this._isVisible)
      } catch (error) {
        console.error('Error in visibility callback:', error)
      }
    })
  }

  /**
   * Called when the page becomes hidden.
   * @private
   */
  _onHidden() {
    // Find all playing videos
    const videos = document.querySelectorAll('video')

    videos.forEach((video) => {
      if (!video.paused) {
        this._playingVideos.add(video)
        video.pause()
      }
    })
  }

  /**
   * Called when the page becomes visible.
   * @private
   */
  _onVisible() {
    // Resume videos that were playing
    this._playingVideos.forEach((video) => {
      // Check that the video is still in the DOM
      if (document.body.contains(video)) {
        video.play().catch((error) => {
          // Ignore playback errors (autoplay blocked, etc.)
          console.warn('Unable to resume video:', error.message)
        })
      }
    })

    this._playingVideos.clear()
  }

  /**
   * Registers a callback for visibility changes.
   * @param {string} id - Unique callback identifier.
   * @param {Function} callback - Function called with (isVisible: boolean).
   * @returns {Function} Function to unregister the callback.
   *
   * @example
   * const unsubscribe = pageVisibility.onVisibilityChange('myComponent', (visible) => {
   *   if (visible) {
   *     startAnimation()
   *   } else {
   *     pauseAnimation()
   *   }
   * })
   */
  onVisibilityChange(id, callback) {
    this._callbacks.set(id, callback)

    return () => this._callbacks.delete(id)
  }

  /**
   * Removes a callback.
   * @param {string} id - Identifier of the callback to remove.
   */
  offVisibilityChange(id) {
    this._callbacks.delete(id)
  }

  /**
   * Returns the current visibility state.
   * @returns {boolean} True if the page is visible.
   */
  get isVisible() {
    return this._isVisible
  }

  /**
   * Returns whether the page is hidden.
   * @returns {boolean} True if the page is hidden.
   */
  get isHidden() {
    return !this._isVisible
  }

  /**
   * Manually pauses a video and remembers it for resumption.
   * @param {HTMLVideoElement} video - The video to pause.
   */
  pauseVideo(video) {
    if (!video.paused) {
      this._playingVideos.add(video)
      video.pause()
    }
  }

  /**
   * Manually resumes a remembered video.
   * @param {HTMLVideoElement} video - The video to resume.
   */
  resumeVideo(video) {
    if (this._playingVideos.has(video)) {
      video.play().catch(() => {})
      this._playingVideos.delete(video)
    }
  }

  /**
   * Cleans up references to videos removed from the DOM.
   */
  cleanup() {
    this._playingVideos.forEach((video) => {
      if (!document.body.contains(video)) {
        this._playingVideos.delete(video)
      }
    })
  }
}

// Automatically initialize the manager
document.addEventListener('DOMContentLoaded', () => {
  PageVisibilityManager.getInstance()
})
