/**
 * Composant bouton de partage d'URL.
 *
 * @description
 * Permet de partager l'URL actuelle avec les filtres appliqués.
 * Utilise l'API Clipboard pour copier l'URL et affiche un feedback.
 *
 * CONCEPTS :
 * - navigator.clipboard : API pour accéder au presse-papiers
 * - async/await avec l'API Clipboard
 * - Feedback utilisateur temporaire
 */
class ShareButton {
  /**
   * Crée une instance de ShareButton.
   */
  constructor() {
    this._urlState = UrlStateManager.getInstance()
    this.$button = null
    this._feedbackTimeout = null
  }

  /**
   * Crée le bouton de partage.
   *
   * @returns {HTMLElement} Le bouton de partage.
   */
  createElement() {
    this.$button = document.createElement('button')
    this.$button.classList.add('share-btn')
    this.$button.setAttribute('type', 'button')
    this.$button.setAttribute(
      'aria-label',
      'Partager cette page avec les filtres actuels',
    )
    this.$button.setAttribute('title', 'Copier le lien')

    // Icône de partage (SVG)
    this.$button.innerHTML = `
      <svg class="share-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
      <span class="share-btn__text">Partager</span>
    `

    // Événement click
    this.$button.addEventListener('click', () => {
      this._handleShare()
    })

    return this.$button
  }

  /**
   * Gère le clic sur le bouton de partage.
   *
   * @description
   * CONCEPT : Clipboard API
   * navigator.clipboard.writeText() copie du texte dans le presse-papiers.
   * C'est une API asynchrone qui retourne une Promise.
   *
   * @private
   */
  async _handleShare() {
    const success = await this._urlState.copyShareableUrl()

    if (success) {
      this._showFeedback('Lien copié !')
    } else {
      // Fallback : afficher l'URL pour copie manuelle
      this._showFallback()
    }
  }

  /**
   * Affiche un feedback temporaire.
   *
   * @param {string} message - Le message à afficher.
   * @private
   */
  _showFeedback(message) {
    // Annuler le timeout précédent si existant
    if (this._feedbackTimeout) {
      clearTimeout(this._feedbackTimeout)
    }

    // Ajouter la classe de feedback
    this.$button.classList.add('share-btn--success')

    // Changer temporairement le texte
    const textSpan = this.$button.querySelector('.share-btn__text')
    const originalText = textSpan.textContent
    textSpan.textContent = message

    // Restaurer après 2 secondes
    this._feedbackTimeout = setTimeout(() => {
      this.$button.classList.remove('share-btn--success')
      textSpan.textContent = originalText
    }, 2000)
  }

  /**
   * Affiche un fallback si l'API Clipboard n'est pas disponible.
   *
   * @private
   */
  _showFallback() {
    const url = this._urlState.getShareableUrl()

    // Créer une alerte avec l'URL
    window.prompt('Copiez ce lien pour le partager :', url)
  }
}
