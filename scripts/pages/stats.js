/**
 * Contrôleur pour la page des statistiques.
 *
 * @description
 * Charge les données et initialise le dashboard de statistiques.
 * Démontre l'utilisation d'async/await avec le chargement de données
 * et l'intégration de StatsCalculator.
 */
class StatsPage {
  constructor() {
    this._api = new PhotographerApi('./data/photographers.json')
    this.$container = document.querySelector('#stats-container')
  }

  /**
   * Initialise la page.
   *
   * @async
   */
  async init() {
    try {
      // Charger les données
      const data = await this._api.get()

      if (!data) {
        this._showError('Impossible de charger les données.')
        return
      }

      // Créer le calculateur de statistiques
      const statsCalculator = new StatsCalculator(
        data.photographers,
        data.media,
      )

      // Créer le dashboard
      const dashboard = new StatsDashboard(statsCalculator)

      // Afficher le dashboard
      this.$container.innerHTML = ''
      this.$container.appendChild(dashboard.createDashboard())

      // Initialiser le compteur de favoris dans le header
      this._initFavoritesCounter()
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      this._showError('Une erreur est survenue lors du chargement.')
    }
  }

  /**
   * Initialise le compteur de favoris dans le header.
   *
   * @private
   */
  _initFavoritesCounter() {
    const container = document.querySelector('#favorites-counter-container')
    if (container) {
      const counter = new FavoritesCounter()
      container.appendChild(counter.createElement())
    }
  }

  /**
   * Affiche un message d'erreur.
   *
   * @param {string} message - Le message d'erreur.
   * @private
   */
  _showError(message) {
    this.$container.innerHTML = ''

    const error = document.createElement('div')
    error.classList.add('stats-error')

    const errorIcon = document.createElement('span')
    errorIcon.classList.add('stats-error__icon')
    errorIcon.textContent = '⚠️'
    errorIcon.setAttribute('aria-hidden', 'true')

    const errorText = document.createElement('p')
    errorText.classList.add('stats-error__text')
    errorText.textContent = message

    const retryButton = document.createElement('button')
    retryButton.classList.add('stats-error__retry')
    retryButton.textContent = 'Réessayer'
    retryButton.addEventListener('click', () => this.init())

    error.appendChild(errorIcon)
    error.appendChild(errorText)
    error.appendChild(retryButton)
    this.$container.appendChild(error)
  }
}

// Initialiser la page
const statsPage = new StatsPage()
statsPage.init()
