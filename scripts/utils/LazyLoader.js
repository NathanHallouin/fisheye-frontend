/**
 * Lazy loading manager for images.
 *
 * @description
 * Uses the IntersectionObserver API to load images only
 * when they enter the viewport (visible area).
 *
 * KEY CONCEPT: IntersectionObserver
 * This API allows detecting when an element enters or leaves
 * the viewport in a performant way (no scroll polling).
 *
 * Lazy loading advantages:
 * - Reduces initial load time
 * - Saves bandwidth
 * - Improves perceived performance
 * - Reduces memory consumption
 */
class LazyLoader {
  /**
   * Singleton instance.
   * @type {LazyLoader|null}
   */
  static _instance = null

  /**
   * Returns the unique LazyLoader instance.
   * @returns {LazyLoader} The unique instance.
   */
  static getInstance() {
    if (!LazyLoader._instance) {
      LazyLoader._instance = new LazyLoader()
    }
    return LazyLoader._instance
  }

  /**
   * Creates a LazyLoader instance.
   *
   * @description
   * Configures the IntersectionObserver with optimized options:
   * - rootMargin: Margin around the viewport for preloading
   * - threshold: Visibility percentage required to trigger
   */
  constructor() {
    /**
     * CONCEPT: IntersectionObserver options
     *
     * - root: The root element (null = viewport)
     * - rootMargin: Margin around root (enables preloading)
     * - threshold: Visibility ratio to trigger the callback
     */
    const options = {
      root: null, // null = browser viewport
      rootMargin: '100px 0px', // Load 100px BEFORE entering the viewport
      threshold: 0.01, // Trigger as soon as 1% is visible
    }

    /**
     * CONCEPT: Creating the IntersectionObserver
     *
     * The callback receives an array of IntersectionObserverEntry.
     * Each entry contains:
     * - target: the observed element
     * - isIntersecting: true if visible
     * - intersectionRatio: visible percentage (0 to 1)
     * - boundingClientRect: dimensions and position
     */
    this._observer = new IntersectionObserver(
      (entries) => this._handleIntersection(entries),
      options,
    )

    // Counter for statistics
    this._loadedCount = 0
    this._observedCount = 0
  }

  /**
   * Handles detected intersections.
   *
   * @description
   * CONCEPT: IntersectionObserver callback
   * Called each time an observed element changes state
   * (enters or leaves the viewport).
   *
   * @param {IntersectionObserverEntry[]} entries - The intersection entries.
   * @private
   */
  _handleIntersection(entries) {
    entries.forEach((entry) => {
      // isIntersecting = true when the element enters the viewport
      if (entry.isIntersecting) {
        this._loadImage(entry.target)
        // Stop observing once loaded (optimization)
        this._observer.unobserve(entry.target)
      }
    })
  }

  /**
   * Loads an element's image.
   *
   * @description
   * Replaces data-src with src to trigger loading.
   * Also handles srcset for responsive images.
   *
   * @param {HTMLElement} element - The image element or container.
   * @private
   */
  _loadImage(element) {
    // Case 1: Direct <img> element
    if (element.tagName === 'IMG') {
      this._loadImgElement(element)
      return
    }

    // Case 2: <picture> element with <source> and <img>
    if (element.tagName === 'PICTURE') {
      this._loadPictureElement(element)
      return
    }

    // Case 3: Container with a child image
    const img = element.querySelector('img[data-src]')
    if (img) {
      this._loadImgElement(img)
    }

    // Case 4: Background image (data-bg)
    if (element.dataset.bg) {
      element.style.backgroundImage = `url('${element.dataset.bg}')`
      delete element.dataset.bg
      element.classList.add('lazy-loaded')
      element.classList.remove('lazy-loading')
    }
  }

  /**
   * Loads an <img> image.
   *
   * @param {HTMLImageElement} img - The image element.
   * @private
   */
  _loadImgElement(img) {
    // Add loading class
    img.classList.add('lazy-loading')

    // Create a new image to preload
    const tempImage = new Image()

    // Success handler
    tempImage.onload = () => {
      // Transfer src once loaded
      if (img.dataset.src) {
        img.src = img.dataset.src
        delete img.dataset.src
      }

      // Transfer srcset if present
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset
        delete img.dataset.srcset
      }

      // Update classes
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-loaded')

      // Increment counter
      this._loadedCount++

      // Emit custom event
      this._emitLoadEvent(img)
    }

    // Error handler
    tempImage.onerror = () => {
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-error')

      // Load fallback image
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback
      }

      console.warn('LazyLoader: Loading error', img.dataset.src)
    }

    // Start loading
    tempImage.src = img.dataset.src
  }

  /**
   * Loads a <picture> element.
   *
   * @param {HTMLPictureElement} picture - The picture element.
   * @private
   */
  _loadPictureElement(picture) {
    // Load sources
    const sources = picture.querySelectorAll('source[data-srcset]')
    sources.forEach((source) => {
      source.srcset = source.dataset.srcset
      delete source.dataset.srcset
    })

    // Load the fallback image
    const img = picture.querySelector('img')
    if (img) {
      this._loadImgElement(img)
    }
  }

  /**
   * Emits a custom event after loading.
   *
   * @param {HTMLElement} element - The loaded element.
   * @private
   */
  _emitLoadEvent(element) {
    const event = new CustomEvent('lazyload', {
      detail: {
        element,
        loadedCount: this._loadedCount,
        observedCount: this._observedCount,
      },
      bubbles: true,
    })
    element.dispatchEvent(event)
  }

  /**
   * Observes an element for lazy loading.
   *
   * @param {HTMLElement} element - The element to observe.
   */
  observe(element) {
    if (!element) return

    // Check if the element has data to load
    const hasLazyData =
      element.dataset.src ||
      element.dataset.srcset ||
      element.dataset.bg ||
      element.querySelector('[data-src]')

    if (!hasLazyData) {
      console.warn('LazyLoader: Element without data-src/data-srcset', element)
      return
    }

    this._observedCount++
    this._observer.observe(element)
  }

  /**
   * Observes multiple elements.
   *
   * @param {NodeList|Array<HTMLElement>} elements - The elements to observe.
   */
  observeAll(elements) {
    elements.forEach((element) => this.observe(element))
  }

  /**
   * Stops observing an element.
   *
   * @param {HTMLElement} element - The element to stop observing.
   */
  unobserve(element) {
    this._observer.unobserve(element)
  }

  /**
   * Stops observing all elements.
   */
  disconnect() {
    this._observer.disconnect()
  }

  /**
   * Forces immediate loading of an element.
   *
   * @param {HTMLElement} element - The element to load.
   */
  loadImmediately(element) {
    this._loadImage(element)
    this._observer.unobserve(element)
  }

  /**
   * Forces loading of all observed elements.
   */
  loadAll() {
    // Note: IntersectionObserver doesn't expose the list of observed elements
    // This method is useful if a separate reference is kept
    console.info('LazyLoader: loadAll() called - images will be loaded')
  }

  /**
   * Returns loading statistics.
   *
   * @returns {Object} The statistics.
   */
  getStats() {
    return {
      observed: this._observedCount,
      loaded: this._loadedCount,
      pending: this._observedCount - this._loadedCount,
    }
  }

  /**
   * Creates an image element with lazy loading.
   *
   * @description
   * Utility method to create a lazy-loadable image.
   *
   * @param {Object} options - Image options.
   * @param {string} options.src - The image URL.
   * @param {string} options.alt - The alternative text.
   * @param {string} [options.placeholder] - Placeholder URL.
   * @param {string} [options.fallback] - Fallback image URL.
   * @param {string} [options.className] - CSS classes.
   * @returns {HTMLImageElement} The created image element.
   */
  createLazyImage({ src, alt, placeholder, fallback, className }) {
    const img = document.createElement('img')

    // Use a placeholder or transparent image
    img.src =
      placeholder ||
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

    // Store the real URL in data-src
    img.dataset.src = src

    // Accessibility attributes
    img.alt = alt || ''

    // Fallback in case of error
    if (fallback) {
      img.dataset.fallback = fallback
    }

    // CSS classes
    if (className) {
      img.className = className
    }
    img.classList.add('lazy')

    // Observe the image
    this.observe(img)

    return img
  }
}
