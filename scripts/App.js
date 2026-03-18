class App {
  /**
   * Initialise l'API et le conteneur DOM pour les photographes.
   *
   * @description
   * Démontre l'initialisation des propriétés d'instance.
   * Les propriétés préfixées par _ sont considérées comme privées par convention.
   */
  constructor() {
    this.photographersApi = new PhotographerApi('./data/photographers.json')
    this.$photographerSection = document.querySelector('.photographer_section')
    this.$main = document.querySelector('#main')
    this._allPhotographers = []
    this._filteredByTags = []
    this._filteredBySearch = []
    this._tagFilter = null
    this._searchBar = null
    this._urlState = UrlStateManager.getInstance()
    this._shortcuts = KeyboardShortcutManager.getInstance()
  }

  /**
   * Méthode principale asynchrone pour charger et afficher les photographes.
   *
   * @description
   * Utilise async/await pour gérer les opérations asynchrones de manière
   * lisible et séquentielle. Les erreurs peuvent être gérées avec try/catch.
   *
   * CONCEPT : History API integration
   * L'état initial est restauré depuis l'URL, permettant des URLs partageables.
   *
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    const photographersData = await this.photographersApi.get()

    // Stocker tous les photographes pour le filtrage
    this._allPhotographers = new PhotographersFactory(
      photographersData,
      'photographers',
    )

    // Initialiser les filtres comme "tous les photographes"
    this._filteredByTags = [...this._allPhotographers]
    this._filteredBySearch = [...this._allPhotographers]

    // Initialiser le compteur de favoris dans le header
    this._initFavoritesCounter()

    // Initialiser le bouton de partage
    this._initShareButton()

    // Créer et insérer les contrôles de filtrage
    this._initSearchBar()
    this._initTagFilter()

    // Écouter les changements d'état URL (bouton retour/avant)
    this._initUrlStateListener()

    // Restaurer l'état depuis l'URL (si paramètres présents)
    this._restoreStateFromUrl()
  }

  /**
   * Initialise l'écoute des changements d'état URL.
   *
   * @description
   * CONCEPT : popstate event
   * Quand l'utilisateur clique sur Retour/Avant du navigateur,
   * l'événement popstate est déclenché et on restaure l'état correspondant.
   *
   * @private
   */
  _initUrlStateListener() {
    this._urlState.onChange((state) => {
      // Restaurer les filtres sans re-pousser dans l'historique
      this._restoreFiltersFromState(state, false)
    })
  }

  /**
   * Restaure l'état initial depuis les paramètres URL.
   *
   * @description
   * CONCEPT : URLs partageables
   * Permet de partager un lien avec des filtres pré-appliqués.
   * Ex: ?tags=portrait,travel&search=paris
   *
   * @private
   */
  _restoreStateFromUrl() {
    const state = this._urlState.getState()
    const hasTags = state.tags && state.tags.length > 0
    const hasSearch = state.search && state.search.trim() !== ''

    // Si pas de filtres dans l'URL, afficher tous les photographes
    if (!hasTags && !hasSearch) {
      this._renderPhotographers(this._allPhotographers)
      return
    }

    // Restaurer les filtres depuis l'état URL
    this._restoreFiltersFromState(state, false)
  }

  /**
   * Restaure les filtres depuis un objet d'état.
   *
   * @param {Object} state - L'état à restaurer.
   * @param {boolean} updateUrl - Si true, met à jour l'URL.
   * @private
   */
  _restoreFiltersFromState(state, updateUrl = true) {
    // Restaurer les tags
    if (state.tags) {
      this._tagFilter.setTags(state.tags, false)
      // Mettre à jour _filteredByTags manuellement
      if (state.tags.length === 0) {
        this._filteredByTags = [...this._allPhotographers]
      } else {
        this._filteredByTags = this._allPhotographers.filter((photographer) =>
          state.tags.some((tag) => photographer.hasTag(tag)),
        )
      }
    }

    // Restaurer la recherche
    if (this._searchBar) {
      const searchValue = state.search || ''
      this._searchBar.setValue(searchValue, false)

      if (searchValue.trim() === '') {
        this._filteredBySearch = [...this._allPhotographers]
      } else {
        const normalizedQuery = searchValue.trim().toLowerCase()
        this._filteredBySearch = this._allPhotographers.filter(
          (photographer) => {
            const name = photographer.name.toLowerCase()
            const city = photographer.city.toLowerCase()
            const tagline = photographer.tagline.toLowerCase()
            return (
              name.includes(normalizedQuery) ||
              city.includes(normalizedQuery) ||
              tagline.includes(normalizedQuery)
            )
          },
        )
      }
    }

    // Appliquer les filtres combinés
    this._applyCombinedFilters()
  }

  /**
   * Initialise le compteur de favoris dans le header.
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
   * Initialise le bouton de partage dans le header.
   *
   * @description
   * Permet de partager l'URL avec les filtres actuels.
   *
   * @private
   */
  _initShareButton() {
    const navLinks = document.querySelector('.main-nav__links')
    if (navLinks) {
      const shareButton = new ShareButton()
      // Insérer avant le compteur de favoris
      navLinks.insertBefore(shareButton.createElement(), navLinks.firstChild)
    }
  }

  /**
   * Initialise la barre de recherche.
   *
   * @description
   * La SearchBar utilise le debounce pour limiter les appels pendant la frappe.
   * Les résultats sont combinés avec les filtres de tags (intersection).
   *
   * CONCEPT : History API - replaceState pour recherche
   * On utilise replaceState (pas pushState) pendant la frappe pour
   * ne pas polluer l'historique avec chaque caractère tapé.
   *
   * @private
   */
  _initSearchBar() {
    this._searchBar = new SearchBar(
      this._allPhotographers,
      // Callback de recherche : met à jour les filtres de recherche et l'URL
      (searchResults) => {
        this._filteredBySearch = searchResults
        this._applyCombinedFilters()

        // Mettre à jour l'URL avec replaceState (pas de nouvelle entrée historique)
        const searchValue = this._searchBar.getValue()
        this._urlState.setParam('search', searchValue, true) // true = replaceState
      },
      // Callback de sélection : navigue vers le photographe
      (photographer) => {
        window.location.href = photographer.url
      },
    )

    const searchBar = this._searchBar.createSearchBar()

    // Insérer la barre de recherche au début du main
    this.$main.insertBefore(searchBar, this.$main.firstChild)
  }

  /**
   * Initialise le système de filtrage par tags.
   *
   * @description
   * Utilise une fonction callback (closure) pour gérer les changements de filtres.
   * La méthode bind() ou les arrow functions préservent le contexte 'this'.
   *
   * CONCEPT : History API - pushState pour filtres de tags
   * Chaque changement de tag crée une nouvelle entrée dans l'historique,
   * permettant de revenir en arrière avec le bouton du navigateur.
   *
   * @private
   */
  _initTagFilter() {
    // Arrow function préserve automatiquement le contexte 'this'
    // C'est une alternative à .bind(this)
    this._tagFilter = new TagFilter(
      this._allPhotographers,
      // Callback de filtrage : met à jour les filtres de tags et l'URL
      (filteredPhotographers) => {
        this._filteredByTags = filteredPhotographers
        this._applyCombinedFilters()

        // Mettre à jour l'URL avec pushState (nouvelle entrée historique)
        const activeTags = this._tagFilter.getActiveTags()
        this._urlState.setParam('tags', activeTags, false) // false = pushState
      },
    )

    const filterBar = this._tagFilter.createFilterBar()

    // Insérer la barre de filtres avant la section des photographes
    this.$main.insertBefore(filterBar, this.$photographerSection.parentElement)
  }

  /**
   * Applique la combinaison des filtres (tags ET recherche).
   *
   * @description
   * CONCEPT CLÉ : Intersection de tableaux
   * Utilise filter() et includes() pour trouver les éléments
   * présents dans les deux tableaux filtrés.
   *
   * @private
   */
  _applyCombinedFilters() {
    // Intersection : garder uniquement les photographes présents
    // dans les DEUX listes filtrées (par tags ET par recherche)
    const combined = this._filteredByTags.filter((photographer) =>
      this._filteredBySearch.includes(photographer),
    )

    this._renderPhotographers(combined)
  }

  /**
   * Affiche une liste de photographes dans le DOM.
   *
   * @description
   * Démontre la manipulation du DOM :
   * - innerHTML = '' pour vider un conteneur (plus rapide que removeChild en boucle)
   * - forEach() pour itérer sur un tableau
   * - appendChild() pour ajouter des éléments
   *
   * @param {Array<PhotographerProfil>} photographers - Liste des photographes à afficher.
   * @private
   */
  _renderPhotographers(photographers) {
    // Vider le conteneur avant de réafficher
    // innerHTML = '' est plus performant pour vider complètement un conteneur
    this.$photographerSection.innerHTML = ''

    // Afficher un message si aucun résultat
    if (photographers.length === 0) {
      const noResult = document.createElement('p')
      noResult.classList.add('no-result')
      noResult.textContent = 'Aucun photographe ne correspond à ces critères.'
      this.$photographerSection.appendChild(noResult)
      return
    }

    // forEach() exécute une fonction pour chaque élément du tableau
    photographers.forEach((photographer) => {
      const templateCard = new PhotographerCard(photographer)
      this.$photographerSection.appendChild(
        templateCard.createPhotographerCard(),
      )
    })
  }
}

const app = new App()
app.main()
