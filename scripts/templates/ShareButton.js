/**
 * Share URL button component.
 *
 * @description
 * Allows sharing the current URL with applied filters.
 * Uses the Clipboard API to copy the URL and displays feedback.
 *
 * CONCEPTS:
 * - navigator.clipboard: API to access the clipboard
 * - async/await with the Clipboard API
 * - Temporary user feedback
 */
class ShareButton {
  /**
   * Creates a ShareButton instance.
   */
  constructor() {
    this._urlState = UrlStateManager.getInstance()
    this.$button = null
    this._feedbackTimeout = null
  }

  /**
   * Creates the share button.
   *
   * @returns {HTMLElement} The share button.
   */
  createElement() {
    this.$button = document.createElement('button')
    this.$button.classList.add('share-btn')
    this.$button.setAttribute('type', 'button')
    this.$button.setAttribute(
      'aria-label',
      'Share this page with current filters',
    )
    this.$button.setAttribute('title', 'Copy link')

    // Share icon (SVG)
    this.$button.innerHTML = `
      <svg class="share-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
      <span class="share-btn__text">Share</span>
    `

    // Click event
    this.$button.addEventListener('click', () => {
      this._handleShare()
    })

    return this.$button
  }

  /**
   * Handles the click on the share button.
   *
   * @description
   * CONCEPT: Clipboard API
   * navigator.clipboard.writeText() copies text to the clipboard.
   * It's an asynchronous API that returns a Promise.
   *
   * @private
   */
  async _handleShare() {
    const success = await this._urlState.copyShareableUrl()

    if (success) {
      this._showFeedback('Link copied!')
    } else {
      // Fallback: display URL for manual copy
      this._showFallback()
    }
  }

  /**
   * Displays temporary feedback.
   *
   * @param {string} message - The message to display.
   * @private
   */
  _showFeedback(message) {
    // Cancel previous timeout if exists
    if (this._feedbackTimeout) {
      clearTimeout(this._feedbackTimeout)
    }

    // Add feedback class
    this.$button.classList.add('share-btn--success')

    // Temporarily change the text
    const textSpan = this.$button.querySelector('.share-btn__text')
    const originalText = textSpan.textContent
    textSpan.textContent = message

    // Restore after 2 seconds
    this._feedbackTimeout = setTimeout(() => {
      this.$button.classList.remove('share-btn--success')
      textSpan.textContent = originalText
    }, 2000)
  }

  /**
   * Displays a fallback if the Clipboard API is not available.
   *
   * @private
   */
  _showFallback() {
    const url = this._urlState.getShareableUrl()

    // Create an alert with the URL
    window.prompt('Copy this link to share:', url)
  }
}
