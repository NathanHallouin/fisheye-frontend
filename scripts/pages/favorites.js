/**
 * Class to manage the favorites page.
 *
 * @description
 * This page displays favorite photographers saved in localStorage.
 * It reacts to changes in real-time via Custom Events.
 */
class FavoritesPage {
  constructor() {
    this._favoritesManager = FavoritesManager.getInstance()
    this.$favoritesList = document.querySelector('.favorites-list')
    this.$favoritesEmpty = document.querySelector('.favorites-empty')
    this.$favoritesCount = document.querySelector('.favorites-count')
    this.$clearButton = document.querySelector('.favorites-clear')
  }

  /**
   * Initializes the page.
   */
  init() {
    this._render()
    this._attachEvents()
  }

  /**
   * Attaches events.
   * @private
   */
  _attachEvents() {
    // Delete all button
    this.$clearButton.addEventListener('click', () => {
      this._handleClearAll()
    })

    // Listen for favorites changes
    this._favoritesManager.onChange(() => {
      this._render()
    })
  }

  /**
   * Displays the favorites list.
   * @private
   */
  _render() {
    const favorites = this._favoritesManager.getAll()

    // Update the counter
    this._updateCount(favorites.length)

    // Show/hide the empty message
    if (favorites.length === 0) {
      this.$favoritesList.innerHTML = ''
      this.$favoritesEmpty.hidden = false
      this.$clearButton.hidden = true
      return
    }

    this.$favoritesEmpty.hidden = true
    this.$clearButton.hidden = false

    // Clear the current list
    this.$favoritesList.innerHTML = ''

    // Create a card for each favorite
    favorites.forEach((favoriteData) => {
      // Convert data to format expected by PhotographerProfil
      const photographer = this._createPhotographerFromFavorite(favoriteData)
      const card = new PhotographerCard(photographer)
      this.$favoritesList.appendChild(card.createPhotographerCard())
    })
  }

  /**
   * Creates a compatible photographer object from favorite data.
   *
   * @description
   * Data stored in localStorage is simplified.
   * We need to adapt it to the format expected by PhotographerCard.
   *
   * @param {Object} favoriteData - The favorite data.
   * @returns {Object} An object compatible with PhotographerCard.
   * @private
   */
  _createPhotographerFromFavorite(favoriteData) {
    // Create an object that mimics the PhotographerProfil interface
    return {
      id: favoriteData.id,
      name: favoriteData.name,
      city: favoriteData.city,
      country: favoriteData.country,
      tagline: favoriteData.tagline,
      price: favoriteData.price,
      get portrait() {
        const base = favoriteData.portrait
          ? favoriteData.portrait.replace(/\.[^/.]+$/, '')
          : 'account'
        return `assets/photographers/${base}.webp`
      },
      get url() {
        return `./photographer.html?user=${favoriteData.name}`
      },
    }
  }

  /**
   * Updates the counter text.
   * @param {number} count - The number of favorites.
   * @private
   */
  _updateCount(count) {
    if (count === 0) {
      this.$favoritesCount.textContent = ''
    } else if (count === 1) {
      this.$favoritesCount.textContent = '1 photographe favori'
    } else {
      this.$favoritesCount.textContent = `${count} photographes favoris`
    }
  }

  /**
   * Handles deletion of all favorites.
   * @private
   */
  _handleClearAll() {
    // Ask for confirmation
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer tous vos favoris ?',
    )

    if (confirmed) {
      this._favoritesManager.clear()
    }
  }
}

// Initialize the page
const favoritesPage = new FavoritesPage()
favoritesPage.init()
