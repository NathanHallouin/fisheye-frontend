/**
 * Controller for the statistics page.
 *
 * @description
 * Loads data and initializes the statistics dashboard.
 * Demonstrates the use of async/await with data loading
 * and StatsCalculator integration.
 */
class StatsPage {
  constructor() {
    this._api = new PhotographerApi('./data/photographers.json')
    this.$container = document.querySelector('#stats-container')
  }

  /**
   * Initializes the page.
   *
   * @async
   */
  async init() {
    try {
      // Load data
      const data = await this._api.get()

      if (!data) {
        this._showError('Impossible de charger les données.')
        return
      }

      // Create the statistics calculator
      const statsCalculator = new StatsCalculator(
        data.photographers,
        data.media,
      )

      // Create the dashboard
      const dashboard = new StatsDashboard(statsCalculator)

      // Display the dashboard
      this.$container.innerHTML = ''
      this.$container.appendChild(dashboard.createDashboard())

      // Initialize the favorites counter in the header
      this._initFavoritesCounter()
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      this._showError('Une erreur est survenue lors du chargement.')
    }
  }

  /**
   * Initializes the favorites counter in the header.
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
   * Displays an error message.
   *
   * @param {string} message - The error message.
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

// Initialize the page
const statsPage = new StatsPage()
statsPage.init()
