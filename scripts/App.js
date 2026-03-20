class App {
  /**
   * Initializes the API and DOM container for photographers.
   *
   * @description
   * Demonstrates instance property initialization.
   * Properties prefixed with _ are considered private by convention.
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
   * Main asynchronous method to load and display photographers.
   *
   * @description
   * Uses async/await to handle asynchronous operations in a
   * readable and sequential manner. Errors can be handled with try/catch.
   *
   * CONCEPT: History API integration
   * The initial state is restored from the URL, enabling shareable URLs.
   *
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    const photographersData = await this.photographersApi.get()

    // Store all photographers for filtering
    this._allPhotographers = new PhotographersFactory(
      photographersData,
      'photographers',
    )

    // Initialize filters as "all photographers"
    this._filteredByTags = [...this._allPhotographers]
    this._filteredBySearch = [...this._allPhotographers]

    // Initialize favorites counter in the header
    this._initFavoritesCounter()

    // Initialize the share button
    this._initShareButton()

    // Create and insert filtering controls
    this._initSearchBar()
    this._initTagFilter()

    // Listen for URL state changes (back/forward button)
    this._initUrlStateListener()

    // Restore state from URL (if parameters present)
    this._restoreStateFromUrl()
  }

  /**
   * Initializes listening for URL state changes.
   *
   * @description
   * CONCEPT: popstate event
   * When the user clicks the browser's Back/Forward button,
   * the popstate event is triggered and the corresponding state is restored.
   *
   * @private
   */
  _initUrlStateListener() {
    this._urlState.onChange((state) => {
      // Restore filters without pushing to history again
      this._restoreFiltersFromState(state, false)
    })
  }

  /**
   * Restores the initial state from URL parameters.
   *
   * @description
   * CONCEPT: Shareable URLs
   * Allows sharing a link with pre-applied filters.
   * E.g.: ?tags=portrait,travel&search=paris
   *
   * @private
   */
  _restoreStateFromUrl() {
    const state = this._urlState.getState()
    const hasTags = state.tags && state.tags.length > 0
    const hasSearch = state.search && state.search.trim() !== ''

    // If no filters in URL, display all photographers
    if (!hasTags && !hasSearch) {
      this._renderPhotographers(this._allPhotographers)
      return
    }

    // Restore filters from URL state
    this._restoreFiltersFromState(state, false)
  }

  /**
   * Restores filters from a state object.
   *
   * @param {Object} state - The state to restore.
   * @param {boolean} updateUrl - If true, updates the URL.
   * @private
   */
  _restoreFiltersFromState(state, updateUrl = true) {
    // Restore tags
    if (state.tags) {
      this._tagFilter.setTags(state.tags, false)
      // Manually update _filteredByTags
      if (state.tags.length === 0) {
        this._filteredByTags = [...this._allPhotographers]
      } else {
        this._filteredByTags = this._allPhotographers.filter((photographer) =>
          state.tags.some((tag) => photographer.hasTag(tag)),
        )
      }
    }

    // Restore search
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

    // Apply combined filters
    this._applyCombinedFilters()
  }

  /**
   * Initializes the favorites counter in the header.
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
   * Initializes the share button in the header.
   *
   * @description
   * Allows sharing the URL with current filters.
   *
   * @private
   */
  _initShareButton() {
    const navLinks = document.querySelector('.main-nav__links')
    if (navLinks) {
      const shareButton = new ShareButton()
      // Insert before the favorites counter
      navLinks.insertBefore(shareButton.createElement(), navLinks.firstChild)
    }
  }

  /**
   * Initializes the search bar.
   *
   * @description
   * The SearchBar uses debounce to limit calls during typing.
   * Results are combined with tag filters (intersection).
   *
   * CONCEPT: History API - replaceState for search
   * We use replaceState (not pushState) during typing to
   * avoid polluting history with each typed character.
   *
   * @private
   */
  _initSearchBar() {
    this._searchBar = new SearchBar(
      this._allPhotographers,
      // Search callback: updates search filters and URL
      (searchResults) => {
        this._filteredBySearch = searchResults
        this._applyCombinedFilters()

        // Update URL with replaceState (no new history entry)
        const searchValue = this._searchBar.getValue()
        this._urlState.setParam('search', searchValue, true) // true = replaceState
      },
      // Selection callback: navigates to the photographer
      (photographer) => {
        window.location.href = photographer.url
      },
    )

    const searchBar = this._searchBar.createSearchBar()

    // Insert the search bar at the beginning of main
    this.$main.insertBefore(searchBar, this.$main.firstChild)
  }

  /**
   * Initializes the tag filtering system.
   *
   * @description
   * Uses a callback function (closure) to handle filter changes.
   * The bind() method or arrow functions preserve the 'this' context.
   *
   * CONCEPT: History API - pushState for tag filters
   * Each tag change creates a new history entry,
   * allowing navigation back with the browser button.
   *
   * @private
   */
  _initTagFilter() {
    // Arrow function automatically preserves the 'this' context
    // This is an alternative to .bind(this)
    this._tagFilter = new TagFilter(
      this._allPhotographers,
      // Filter callback: updates tag filters and URL
      (filteredPhotographers) => {
        this._filteredByTags = filteredPhotographers
        this._applyCombinedFilters()

        // Update URL with pushState (new history entry)
        const activeTags = this._tagFilter.getActiveTags()
        this._urlState.setParam('tags', activeTags, false) // false = pushState
      },
    )

    const filterBar = this._tagFilter.createFilterBar()

    // Insert the filter bar before the photographers section
    this.$main.insertBefore(filterBar, this.$photographerSection.parentElement)
  }

  /**
   * Applies the combination of filters (tags AND search).
   *
   * @description
   * KEY CONCEPT: Array intersection
   * Uses filter() and includes() to find elements
   * present in both filtered arrays.
   *
   * @private
   */
  _applyCombinedFilters() {
    // Intersection: keep only photographers present
    // in BOTH filtered lists (by tags AND by search)
    const combined = this._filteredByTags.filter((photographer) =>
      this._filteredBySearch.includes(photographer),
    )

    this._renderPhotographers(combined)
  }

  /**
   * Displays a list of photographers in the DOM.
   *
   * @description
   * Demonstrates DOM manipulation:
   * - innerHTML = '' to empty a container (faster than removeChild in a loop)
   * - forEach() to iterate over an array
   * - appendChild() to add elements
   *
   * @param {Array<PhotographerProfil>} photographers - List of photographers to display.
   * @private
   */
  _renderPhotographers(photographers) {
    // Empty the container before re-rendering
    // innerHTML = '' is more performant for completely emptying a container
    this.$photographerSection.innerHTML = ''

    // Display a message if no results
    if (photographers.length === 0) {
      const noResult = document.createElement('p')
      noResult.classList.add('no-result')
      noResult.textContent = 'Aucun photographe ne correspond à ces critères.'
      this.$photographerSection.appendChild(noResult)
      return
    }

    // forEach() executes a function for each element in the array
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
