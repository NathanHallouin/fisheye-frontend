/**
 * Gestionnaire d'infinite scroll (défilement infini).
 *
 * @description
 * Charge plus de contenu automatiquement quand l'utilisateur
 * approche de la fin de la page, sans pagination traditionnelle.
 *
 * CONCEPTS CLÉS :
 * - IntersectionObserver : Détection de l'élément sentinelle
 * - Throttle : Limitation des appels de chargement
 * - État de chargement : Gestion async du loading state
 * - Promises : Chargement asynchrone des données
 */
class InfiniteScroll {
  /**
   * Crée une instance d'InfiniteScroll.
   *
   * @param {Object} options - Les options de configuration.
   * @param {HTMLElement} options.container - Le conteneur des éléments.
   * @param {Function} options.loadMore - Fonction async qui charge plus d'éléments.
   * @param {number} [options.pageSize=6] - Nombre d'éléments par page.
   * @param {number} [options.threshold=100] - Distance en px avant le bas pour déclencher.
   * @param {boolean} [options.hasMore=true] - S'il reste des éléments à charger.
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
   * Initialise l'infinite scroll.
   * @private
   */
  _init() {
    // Créer l'élément sentinelle (détecte quand on approche du bas)
    this._createSentinel()

    // Créer l'indicateur de chargement
    this._createLoadingIndicator()

    // Configurer l'IntersectionObserver
    this._setupObserver()
  }

  /**
   * Crée l'élément sentinelle.
   *
   * @description
   * La sentinelle est un élément invisible placé à la fin du contenu.
   * Quand elle devient visible, on charge plus de contenu.
   *
   * @private
   */
  _createSentinel() {
    this._sentinel = document.createElement('div')
    this._sentinel.classList.add('infinite-scroll__sentinel')
    this._sentinel.setAttribute('aria-hidden', 'true')

    // Insérer après le conteneur
    this._container.parentNode.insertBefore(
      this._sentinel,
      this._container.nextSibling,
    )
  }

  /**
   * Crée l'indicateur de chargement.
   * @private
   */
  _createLoadingIndicator() {
    this._loadingIndicator = document.createElement('div')
    this._loadingIndicator.classList.add('infinite-scroll__loader')
    this._loadingIndicator.setAttribute('aria-live', 'polite')
    this._loadingIndicator.innerHTML = `
      <div class="infinite-scroll__spinner" aria-hidden="true"></div>
      <span class="infinite-scroll__text">Chargement...</span>
    `
    this._loadingIndicator.hidden = true

    // Insérer avant la sentinelle
    this._sentinel.parentNode.insertBefore(
      this._loadingIndicator,
      this._sentinel,
    )
  }

  /**
   * Configure l'IntersectionObserver pour la sentinelle.
   *
   * @description
   * CONCEPT : rootMargin pour pré-chargement
   * En utilisant rootMargin avec une valeur positive en bas,
   * on déclenche le chargement AVANT que la sentinelle soit visible.
   *
   * @private
   */
  _setupObserver() {
    const options = {
      root: null,
      rootMargin: `0px 0px ${this._threshold}px 0px`, // Déclencher X px avant
      threshold: 0,
    }

    this._observer = new IntersectionObserver(
      (entries) => this._handleIntersection(entries),
      options,
    )

    // Commencer à observer la sentinelle
    this._observer.observe(this._sentinel)
  }

  /**
   * Gère l'intersection de la sentinelle.
   *
   * @param {IntersectionObserverEntry[]} entries - Les entrées d'intersection.
   * @private
   */
  _handleIntersection(entries) {
    const entry = entries[0]

    // Si la sentinelle est visible et qu'on n'est pas en train de charger
    if (entry.isIntersecting && !this._isLoading && this._hasMore) {
      this._loadNextPage()
    }
  }

  /**
   * Charge la page suivante.
   *
   * @description
   * CONCEPT : Gestion de l'état de chargement
   * On utilise un flag isLoading pour éviter les chargements multiples
   * simultanés (debounce naturel).
   *
   * @private
   */
  async _loadNextPage() {
    if (this._isLoading || !this._hasMore) return

    this._isLoading = true
    this._showLoader()

    try {
      // Appeler la fonction de chargement fournie
      // Elle doit retourner { items: [], hasMore: boolean }
      const result = await this._loadMore(this._currentPage, this._pageSize)

      if (result) {
        // Mettre à jour l'état
        this._hasMore = result.hasMore !== false
        this._currentPage++

        // Émettre un événement avec les nouveaux éléments
        this._emitLoadEvent(result.items)
      }
    } catch (error) {
      console.error('InfiniteScroll: Erreur de chargement', error)
      this._emitErrorEvent(error)
    } finally {
      this._isLoading = false
      this._hideLoader()

      // Si plus rien à charger, arrêter d'observer
      if (!this._hasMore) {
        this._showEndMessage()
        this._observer.disconnect()
      }
    }
  }

  /**
   * Affiche le loader.
   * @private
   */
  _showLoader() {
    this._loadingIndicator.hidden = false
  }

  /**
   * Cache le loader.
   * @private
   */
  _hideLoader() {
    this._loadingIndicator.hidden = true
  }

  /**
   * Affiche un message de fin.
   * @private
   */
  _showEndMessage() {
    const endMessage = document.createElement('p')
    endMessage.classList.add('infinite-scroll__end')
    endMessage.textContent = 'Tous les éléments ont été chargés.'
    endMessage.setAttribute('role', 'status')

    this._loadingIndicator.replaceWith(endMessage)
  }

  /**
   * Émet un événement de chargement réussi.
   *
   * @param {Array} items - Les éléments chargés.
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
   * Émet un événement d'erreur.
   *
   * @param {Error} error - L'erreur survenue.
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
   * Recharge depuis le début.
   */
  reset() {
    this._currentPage = 1
    this._hasMore = true
    this._isLoading = false

    // Réactiver l'observer si déconnecté
    if (this._sentinel && !this._observer) {
      this._setupObserver()
    }
  }

  /**
   * Met à jour l'état hasMore.
   *
   * @param {boolean} hasMore - S'il reste des éléments.
   */
  setHasMore(hasMore) {
    this._hasMore = hasMore

    if (!hasMore) {
      this._showEndMessage()
      this._observer.disconnect()
    }
  }

  /**
   * Détruit l'instance et nettoie les ressources.
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
   * Retourne les informations de pagination.
   *
   * @returns {Object} Les infos de pagination.
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
