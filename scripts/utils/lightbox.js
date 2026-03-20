/**
 * Class representing a lightbox for displaying images and videos in fullscreen.
 * Handles display, navigation, accessibility and closing of the lightbox.
 */
class Lightbox {
  /**
   * Creates an instance of Lightbox.
   */
  constructor() {
    this.$body = document.querySelector('body')
    this.$mainDom = document.querySelector('main')
    this.$wrapper = document.createElement('div')
    this.$wrapper.classList.add('lightbox-container')
    this.keyUpHandler = this.handleKeyPress.bind(this)
    this._index = 0
    this._indexLenght = 0
    this._isFullscreen = false
    this._fullscreenChangeHandler = this._handleFullscreenChange.bind(this)
  }

  /**
   * Static array containing the media data to display in the lightbox.
   * @type {Array<{title: string, picture: string, formatPicture: string}>}
   */
  static data = []

  /**
   * Creates the lightbox and displays it in the DOM.
   * @param {number} index - The index of the media to display in the lightbox.
   */
  createLightbox(index) {
    const lightboxCreate = `
        <div class="lightbox-controls">
          <button onclick="lightbox.toggleFullscreen()" class="lightbox-fullscreen" aria-label="Plein écran">
            <span class="lightbox-fullscreen__icon" aria-hidden="true"></span>
            <span class="sr-only">Activer/désactiver le plein écran</span>
          </button>
          <button onclick="lightbox.closeLightbox()" class="lightbox-close">
            <span class="sr-only">Fermer le caroussel</span>
          </button>
        </div>
        <div class="lightbox">
          <button class="lightbox-prev" onclick="lightbox.prevMedia()">
              <span class="sr-only">Image précédente</span>
          </button>
          <div class="lightbox-media">
              <div class="lightbox-img"></div>
              <h2 class="lightbox-title"></h2>
          </div>
          <button class="lightbox-next" onclick="lightbox.nextMedia()">
              <span class="sr-only">Image suivante</span>
          </button>
        </div>
    `
    this.$wrapper.innerHTML = lightboxCreate
    this.$mainDom.appendChild(this.$wrapper)
    this.createMediaFormat(index)
    this.openLightbox()

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', this._fullscreenChangeHandler)
  }

  /**
   * Opens the lightbox, manages accessibility and focus.
   */
  openLightbox() {
    const $lightbox = document.querySelector('.lightbox-container')
    $lightbox.setAttribute('aria-hidden', 'false')
    this.$mainDom.setAttribute('aria-hidden', 'true')
    this.$body.classList.add('no-scroll')
    const closeBtn = document.querySelector('.lightbox-close')
    closeBtn.focus()
  }

  /**
   * Closes the lightbox, restores the DOM state and removes event listeners.
   */
  async closeLightbox() {
    // Exit fullscreen if active
    if (this._getFullscreenElement()) {
      try {
        await this._exitFullscreen()
      } catch (error) {
        // Ignore the error
      }
    }

    const $lightbox = document.querySelector('.lightbox-container')
    if ($lightbox) {
      $lightbox.remove()
    } else {
      console.error('The element was not found.')
    }
    this.$body.classList.remove('no-scroll')
    this.$mainDom.setAttribute('aria-hidden', 'false')
    document.removeEventListener('keydown', this.keyUpHandler)
    document.removeEventListener('fullscreenchange', this._fullscreenChangeHandler)
  }

  /**
   * Handles keyboard events in the lightbox (navigation, closing, tabulation).
   * @param {KeyboardEvent} e - The triggered keyboard event.
   */
  handleKeyPress(e) {
    const $lightbox = document.querySelector('.lightbox-container')
    const focusElements = $lightbox.querySelectorAll('button')
    const focusElementsArray = Array.from(focusElements)
    const firstFocusElement = focusElementsArray[0]
    const lastFocusElement = focusElementsArray[focusElementsArray.length - 1]
    if (
      $lightbox.getAttribute('aria-hidden') === 'false' &&
      e.key === 'Escape'
    ) {
      this.closeLightbox()
      e.preventDefault()
    } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
      this.nextMedia()
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.keyCode === 37) {
      this.prevMedia()
      e.preventDefault()
    } else if (e.key === 'Tab' || e.keyCode === 9) {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusElement) {
          e.preventDefault()
          lastFocusElement.focus()
        }
      } else {
        if (document.activeElement === lastFocusElement) {
          e.preventDefault()
          firstFocusElement.focus()
        }
      }
    } else {
      if (e.key === 'Enter') return
      e.preventDefault()
    }
  }

  /**
   * Handles opening the lightbox on a given media.
   * @param {HTMLElement} data - The media element the user clicked on.
   */
  listenerLightbox(data) {
    const allMedia = document.querySelectorAll('.media-card__img')
    const allMediaArray = [...allMedia]
    const searchIndex = allMediaArray.findIndex((e) => e === data)
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    })
    this._indexLenght = allMediaArray.length
    this._index = searchIndex
    this.createLightbox(searchIndex)
    document.addEventListener('keydown', this.keyUpHandler)
  }

  /**
   * Displays the previous media in the lightbox.
   */
  prevMedia() {
    const prevBtn = document.querySelector('.lightbox-prev')
    prevBtn.focus()
    this._index = this._index - 1
    if (this._index < 0) {
      this._index = this._indexLenght - 1
    }
    setTimeout(() => {
      this.createMediaFormat(this._index)
    }, 100)
  }

  /**
   * Displays the next media in the lightbox.
   */
  nextMedia() {
    const nextBtn = document.querySelector('.lightbox-next')
    nextBtn.focus()
    this._index = this._index + 1
    if (this._index > this._indexLenght - 1) {
      this._index = 0
    }
    setTimeout(() => {
      this.createMediaFormat(this._index)
    }, 100)
  }

  /**
   * Creates and displays the media format (image or video) in the lightbox.
   * @param {number} index - The index of the media to display.
   * @throws Logs an error to the console if the format is unknown.
   */
  createMediaFormat(index) {
    const $lightboxTitle = document.querySelector('.lightbox-title')
    $lightboxTitle.textContent = Lightbox.data[index].title
    const $lightboxIMG = document.querySelector('.lightbox-img')
    $lightboxIMG.innerHTML = ''
    let format = Lightbox.data[index].formatPicture
    if (format === 'image') {
      const createPicture = `
        <img
            class="lightbox-picture"
            src="${Lightbox.data[index].picture}"
            alt="Image ${Lightbox.data[index].title}"
        />
      `
      $lightboxIMG.innerHTML = createPicture
    } else if (format === 'video') {
      const createPicture = `
        <video
            class="lightbox-picture"
            src="${Lightbox.data[index].picture}"
            alt="Vidéo ${Lightbox.data[index].title}"
            controls>
        </video>
      `
      $lightboxIMG.innerHTML = createPicture
    } else {
      throw console.log('Unknown format: neither video nor image')
    }
  }

  /**
   * Attaches the lightbox instance to the global window object for global access.
   */
  attachWindow() {
    window.lightbox = this
  }

  // ============================================
  // Fullscreen API
  // ============================================

  /**
   * Checks if the Fullscreen API is supported.
   * @returns {boolean} True if supported.
   */
  _isFullscreenSupported() {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    )
  }

  /**
   * Returns the element currently in fullscreen.
   * @returns {Element|null} The fullscreen element or null.
   */
  _getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
  }

  /**
   * Requests fullscreen mode for an element.
   * @param {Element} element - The element to put in fullscreen.
   * @returns {Promise} Promise resolved when fullscreen is activated.
   */
  _requestFullscreen(element) {
    if (element.requestFullscreen) {
      return element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      return element.webkitRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen()
    } else if (element.msRequestFullscreen) {
      return element.msRequestFullscreen()
    }
    return Promise.reject(new Error('Fullscreen not supported'))
  }

  /**
   * Exits fullscreen mode.
   * @returns {Promise} Promise resolved when fullscreen is deactivated.
   */
  _exitFullscreen() {
    if (document.exitFullscreen) {
      return document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      return document.msExitFullscreen()
    }
    return Promise.reject(new Error('Exit fullscreen not supported'))
  }

  /**
   * Toggles fullscreen mode.
   */
  async toggleFullscreen() {
    if (!this._isFullscreenSupported()) {
      console.warn('Fullscreen API not supported')
      return
    }

    try {
      if (this._getFullscreenElement()) {
        await this._exitFullscreen()
      } else {
        const $lightbox = document.querySelector('.lightbox-container')
        if ($lightbox) {
          await this._requestFullscreen($lightbox)
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  /**
   * Handles fullscreen state changes.
   * @private
   */
  _handleFullscreenChange() {
    this._isFullscreen = !!this._getFullscreenElement()

    const $lightbox = document.querySelector('.lightbox-container')
    const $fullscreenBtn = document.querySelector('.lightbox-fullscreen')

    if ($lightbox) {
      $lightbox.classList.toggle('lightbox-container--fullscreen', this._isFullscreen)
    }

    if ($fullscreenBtn) {
      $fullscreenBtn.setAttribute(
        'aria-label',
        this._isFullscreen ? 'Quitter le plein écran' : 'Plein écran'
      )
    }
  }
}
