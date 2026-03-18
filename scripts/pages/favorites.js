/**
 * Classe pour gérer la page des favoris.
 *
 * @description
 * Cette page affiche les photographes favoris sauvegardés dans localStorage.
 * Elle réagit aux changements en temps réel via les Custom Events.
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
   * Initialise la page.
   */
  init() {
    this._render()
    this._attachEvents()
  }

  /**
   * Attache les événements.
   * @private
   */
  _attachEvents() {
    // Bouton supprimer tout
    this.$clearButton.addEventListener('click', () => {
      this._handleClearAll()
    })

    // Écouter les changements de favoris
    this._favoritesManager.onChange(() => {
      this._render()
    })
  }

  /**
   * Affiche la liste des favoris.
   * @private
   */
  _render() {
    const favorites = this._favoritesManager.getAll()

    // Mettre à jour le compteur
    this._updateCount(favorites.length)

    // Afficher/masquer le message vide
    if (favorites.length === 0) {
      this.$favoritesList.innerHTML = ''
      this.$favoritesEmpty.hidden = false
      this.$clearButton.hidden = true
      return
    }

    this.$favoritesEmpty.hidden = true
    this.$clearButton.hidden = false

    // Vider la liste actuelle
    this.$favoritesList.innerHTML = ''

    // Créer une carte pour chaque favori
    favorites.forEach((favoriteData) => {
      // Convertir les données en format attendu par PhotographerProfil
      const photographer = this._createPhotographerFromFavorite(favoriteData)
      const card = new PhotographerCard(photographer)
      this.$favoritesList.appendChild(card.createPhotographerCard())
    })
  }

  /**
   * Crée un objet photographe compatible depuis les données de favori.
   *
   * @description
   * Les données stockées dans localStorage sont simplifiées.
   * On doit les adapter au format attendu par PhotographerCard.
   *
   * @param {Object} favoriteData - Les données du favori.
   * @returns {Object} Un objet compatible avec PhotographerCard.
   * @private
   */
  _createPhotographerFromFavorite(favoriteData) {
    // Créer un objet qui mime l'interface de PhotographerProfil
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
   * Met à jour le texte du compteur.
   * @param {number} count - Le nombre de favoris.
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
   * Gère la suppression de tous les favoris.
   * @private
   */
  _handleClearAll() {
    // Demander confirmation
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer tous vos favoris ?',
    )

    if (confirmed) {
      this._favoritesManager.clear()
    }
  }
}

// Initialiser la page
const favoritesPage = new FavoritesPage()
favoritesPage.init()
