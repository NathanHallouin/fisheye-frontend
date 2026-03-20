/**
 * Infinite scroll manager.
 *
 * @description
 * Automatically loads more content when the user
 * approaches the end of the page, without traditional pagination.
 *
 * KEY CONCEPTS:
 * - IntersectionObserver: Sentinel element detection
 * - Throttle: Limiting load calls
 * - Loading state: Async loading state management
 * - Promises: Asynchronous data loading
 */
class InfiniteScroll {
  /**
   * Creates an InfiniteScroll instance.
   *
   * @param {Object} options - Configuration options.
   * @param {HTMLElement} options.container - The element container.
   * @param {Function} options.loadMore - Async function that loads more elements.
   * @param {number} [options.pageSize=6] - Number of elements per page.
   * @param {number} [options.threshold=100] - Distance in px before bottom to trigger.
   * @param {boolean} [options.hasMore=true] - Whether there are more elements to load.
   */
  constructor(options) {
    this._container = options.container
    this._loadMore = options.loadMore
    this._pageSize = options.pageSize || 6
    this._threshold = options.threshold || 100
    this._hasMore = options.hasMore !== false

    this._isLoading = false
    this._currentPage = 1
    this._observer = null
    this._sentinel = null
    this._loadingIndicator = null

    this._init()
  }

  /**
   * Initializes infinite scroll.
   * @private
   */
  _init() {
    // Create the sentinel element (detects when approaching the bottom)
    this._createSentinel()

    // Create the loading indicator
    this._createLoadingIndicator()

    // Configure the IntersectionObserver
    this._setupObserver()
  }

  /**
   * Creates the sentinel element.
   *
   * @description
   * The sentinel is an invisible element placed at the end of content.
   * When it becomes visible, we load more content.
   *
   * @private
   */
  _createSentinel() {
    this._sentinel = document.createElement('div')
    this._sentinel.classList.add('infinite-scroll__sentinel')
    this._sentinel.setAttribute('aria-hidden', 'true')

    // Insert after the container
    this._container.parentNode.insertBefore(
      this._sentinel,
      this._container.nextSibling,
    )
  }

  /**
   * Creates the loading indicator.
   * @private
   */
  _createLoadingIndicator() {
    this._loadingIndicator = document.createElement('div')
    this._loadingIndicator.classList.add('infinite-scroll__loader')
    this._loadingIndicator.setAttribute('aria-live', 'polite')
    this._loadingIndicator.innerHTML = `
      <div class="infinite-scroll__spinner" aria-hidden="true"></div>
      <span class="infinite-scroll__text">Loading...</span>
    `
    this._loadingIndicator.hidden = true

    // Insert before the sentinel
    this._sentinel.parentNode.insertBefore(
      this._loadingIndicator,
      this._sentinel,
    )
  }

  /**
   * Configures the IntersectionObserver for the sentinel.
   *
   * @description
   * CONCEPT: rootMargin for preloading
   * By using rootMargin with a positive value at the bottom,
   * we trigger loading BEFORE the sentinel is visible.
   *
   * @private
   */
  _setupObserver() {
    const options = {
      root: null,
      rootMargin: `0px 0px ${this._threshold}px 0px`, // Trigger X px before
      threshold: 0,
    }

    this._observer = new IntersectionObserver(
      (entries) => this._handleIntersection(entries),
      options,
    )

    // Start observing the sentinel
    this._observer.observe(this._sentinel)
  }

  /**
   * Handles sentinel intersection.
   *
   * @param {IntersectionObserverEntry[]} entries - The intersection entries.
   * @private
   */
  _handleIntersection(entries) {
    const entry = entries[0]

    // If the sentinel is visible and we're not loading
    if (entry.isIntersecting && !this._isLoading && this._hasMore) {
      this._loadNextPage()
    }
  }

  /**
   * Loads the next page.
   *
   * @description
   * CONCEPT: Loading state management
   * We use an isLoading flag to avoid multiple simultaneous loads
   * (natural debounce).
   *
   * @private
   */
  async _loadNextPage() {
    if (this._isLoading || !this._hasMore) return

    this._isLoading = true
    this._showLoader()

    try {
      // Call the provided load function
      // It should return { items: [], hasMore: boolean }
      const result = await this._loadMore(this._currentPage, this._pageSize)

      if (result) {
        // Update state
        this._hasMore = result.hasMore !== false
        this._currentPage++

        // Emit an event with the new elements
        this._emitLoadEvent(result.items)
      }
    } catch (error) {
      console.error('InfiniteScroll: Loading error', error)
      this._emitErrorEvent(error)
    } finally {
      this._isLoading = false
      this._hideLoader()

      // If nothing left to load, stop observing
      if (!this._hasMore) {
        this._showEndMessage()
        this._observer.disconnect()
      }
    }
  }

  /**
   * Shows the loader.
   * @private
   */
  _showLoader() {
    this._loadingIndicator.hidden = false
  }

  /**
   * Hides the loader.
   * @private
   */
  _hideLoader() {
    this._loadingIndicator.hidden = true
  }

  /**
   * Shows an end message.
   * @private
   */
  _showEndMessage() {
    const endMessage = document.createElement('p')
    endMessage.classList.add('infinite-scroll__end')
    endMessage.textContent = 'All items have been loaded.'
    endMessage.setAttribute('role', 'status')

    this._loadingIndicator.replaceWith(endMessage)
  }

  /**
   * Emits a successful load event.
   *
   * @param {Array} items - The loaded items.
   * @private
   */
  _emitLoadEvent(items) {
    const event = new CustomEvent('infinite-scroll-load', {
      detail: {
        items,
        page: this._currentPage,
        hasMore: this._hasMore,
      },
      bubbles: true,
    })
    this._container.dispatchEvent(event)
  }

  /**
   * Emits an error event.
   *
   * @param {Error} error - The error that occurred.
   * @private
   */
  _emitErrorEvent(error) {
    const event = new CustomEvent('infinite-scroll-error', {
      detail: { error },
      bubbles: true,
    })
    this._container.dispatchEvent(event)
  }

  /**
   * Reloads from the beginning.
   */
  reset() {
    this._currentPage = 1
    this._hasMore = true
    this._isLoading = false

    // Reactivate observer if disconnected
    if (this._sentinel && !this._observer) {
      this._setupObserver()
    }
  }

  /**
   * Updates the hasMore state.
   *
   * @param {boolean} hasMore - Whether there are more elements.
   */
  setHasMore(hasMore) {
    this._hasMore = hasMore

    if (!hasMore) {
      this._showEndMessage()
      this._observer.disconnect()
    }
  }

  /**
   * Destroys the instance and cleans up resources.
   */
  destroy() {
    if (this._observer) {
      this._observer.disconnect()
      this._observer = null
    }

    if (this._sentinel) {
      this._sentinel.remove()
      this._sentinel = null
    }

    if (this._loadingIndicator) {
      this._loadingIndicator.remove()
      this._loadingIndicator = null
    }
  }

  /**
   * Returns pagination information.
   *
   * @returns {Object} The pagination info.
   */
  getInfo() {
    return {
      currentPage: this._currentPage,
      pageSize: this._pageSize,
      hasMore: this._hasMore,
      isLoading: this._isLoading,
    }
  }
}
