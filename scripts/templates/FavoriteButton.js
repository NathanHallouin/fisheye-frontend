/**
 * Classe représentant un bouton favori (coeur).
 *
 * @description
 * Ce composant utilise :
 * - Event delegation : Un seul gestionnaire pour tous les boutons
 * - Data attributes : Stocker l'ID du photographe sur l'élément
 * - ARIA : Accessibilité avec aria-pressed et aria-label
 */
class FavoriteButton {
  /**
   * Crée un bouton favori pour un photographe.
   * @param {Object} photographer - Les données du photographe.
   */
  constructor(photographer) {
    this._photographer = photographer
    this._favoritesManager = FavoritesManager.getInstance()
    this.$button = null
  }

  /**
   * Crée l'élément bouton.
   * @returns {HTMLButtonElement} Le bouton créé.
   */
  createButton() {
    this.$button = document.createElement('button')
    this.$button.classList.add('favorite-btn')
    this.$button.setAttribute('type', 'button')
    this.$button.setAttribute('data-photographer-id', this._photographer.id)

    // État initial
    this._updateState()

    // Event listener avec arrow function pour préserver this
    this.$button.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation() // Empêcher la navigation vers la page photographe
      this._handleClick()
    })

    // Écouter les changements globaux (si modifié depuis une autre page)
    this._favoritesManager.onChange(() => {
      this._updateState()
    })

    return this.$button
  }

  /**
   * Gère le clic sur le bouton.
   * @private
   */
  _handleClick() {
    const isNowFavorite = this._favoritesManager.toggle(this._photographer)
    this._updateState()

    // Animation de feedback
    this._animatePulse()
  }

  /**
   * Met à jour l'état visuel du bouton.
   * @private
   */
  _updateState() {
    if (!this.$button) return

    const isFavorite = this._favoritesManager.isFavorite(this._photographer.id)

    // Mettre à jour les classes
    this.$button.classList.toggle('favorite-btn--active', isFavorite)

    // Mettre à jour ARIA
    this.$button.setAttribute('aria-pressed', isFavorite.toString())
    this.$button.setAttribute(
      'aria-label',
      isFavorite
        ? `Retirer ${this._photographer.name} des favoris`
        : `Ajouter ${this._photographer.name} aux favoris`,
    )

    // Mettre à jour le contenu (icône coeur)
    this.$button.innerHTML = `
      <svg class="favorite-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="${isFavorite ? this._getFilledHeartPath() : this._getOutlineHeartPath()}"/>
      </svg>
      <span class="sr-only">${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
    `
  }

  /**
   * Animation de pulsation au clic.
   * @private
   */
  _animatePulse() {
    this.$button.classList.add('favorite-btn--pulse')
    setTimeout(() => {
      this.$button.classList.remove('favorite-btn--pulse')
    }, 300)
  }

  /**
   * Retourne le path SVG du coeur rempli.
   * @returns {string}
   * @private
   */
  _getFilledHeartPath() {
    return 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
  }

  /**
   * Retourne le path SVG du coeur vide (outline).
   * @returns {string}
   * @private
   */
  _getOutlineHeartPath() {
    return 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
  }
}

/**
 * Compteur de favoris pour l'affichage dans le header.
 */
class FavoritesCounter {
  constructor() {
    this._favoritesManager = FavoritesManager.getInstance()
    this.$counter = null
  }

  /**
   * Crée l'élément compteur.
   * @returns {HTMLElement}
   */
  createElement() {
    this.$counter = document.createElement('a')
    this.$counter.href = './favorites.html'
    this.$counter.classList.add('favorites-counter')
    this.$counter.setAttribute('aria-label', 'Voir mes favoris')

    this._updateCount()

    // Écouter les changements
    this._favoritesManager.onChange(() => {
      this._updateCount()
    })

    return this.$counter
  }

  /**
   * Met à jour le compteur.
   * @private
   */
  _updateCount() {
    if (!this.$counter) return

    const count = this._favoritesManager.count()

    this.$counter.innerHTML = `
      <svg class="favorites-counter__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span class="favorites-counter__count ${count > 0 ? 'favorites-counter__count--visible' : ''}">${count}</span>
      <span class="sr-only">${count} favori${count > 1 ? 's' : ''}</span>
    `

    this.$counter.setAttribute(
      'aria-label',
      `Voir mes favoris (${count} photographe${count > 1 ? 's' : ''})`,
    )
  }
}
