/**
 * Classe représentant une barre de recherche avec auto-complétion.
 *
 * @description
 * Cette classe implémente plusieurs concepts JavaScript clés :
 * - String.includes() : Recherche de sous-chaîne
 * - String.toLowerCase() : Normalisation pour recherche insensible à la casse
 * - Debounce : Optimisation des appels de fonction
 * - Closures : Variables capturées dans les callbacks
 * - Input events : Gestion des événements de saisie
 * - Keyboard events : Navigation clavier dans les suggestions
 */
class SearchBar {
  /**
   * Crée une instance de SearchBar.
   * @param {Array<Object>} photographers - Liste des photographes à rechercher.
   * @param {Function} onSearch - Callback appelé avec les résultats filtrés.
   * @param {Function} onSelect - Callback appelé quand un photographe est sélectionné.
   */
  constructor(photographers, onSearch, onSelect) {
    this._photographers = photographers
    this._onSearch = onSearch
    this._onSelect = onSelect
    this._suggestions = []
    this._selectedIndex = -1
    this._isOpen = false

    // Éléments DOM (seront créés dans createSearchBar)
    this.$container = null
    this.$input = null
    this.$suggestionsList = null

    // Créer la version debounced de la recherche
    // Le debounce attend 300ms après la dernière frappe avant d'exécuter
    this._debouncedSearch = debounce((query) => {
      this._performSearch(query)
    }, 300)
  }

  /**
   * Crée la barre de recherche HTML.
   * @returns {HTMLElement} Le conteneur de la barre de recherche.
   */
  createSearchBar() {
    // Conteneur principal
    this.$container = document.createElement('div')
    this.$container.classList.add('search-bar')
    this.$container.setAttribute('role', 'combobox')
    this.$container.setAttribute('aria-expanded', 'false')
    this.$container.setAttribute('aria-haspopup', 'listbox')

    // Input de recherche
    this.$input = document.createElement('input')
    this.$input.type = 'text'
    this.$input.classList.add('search-bar__input')
    this.$input.placeholder = 'Rechercher un photographe...'
    this.$input.setAttribute('aria-label', 'Rechercher un photographe')
    this.$input.setAttribute('aria-autocomplete', 'list')
    this.$input.setAttribute('aria-controls', 'search-suggestions')

    // Liste des suggestions
    this.$suggestionsList = document.createElement('ul')
    this.$suggestionsList.classList.add('search-bar__suggestions')
    this.$suggestionsList.id = 'search-suggestions'
    this.$suggestionsList.setAttribute('role', 'listbox')
    this.$suggestionsList.setAttribute('aria-label', 'Suggestions de recherche')

    // Assembler les éléments
    this.$container.appendChild(this.$input)
    this.$container.appendChild(this.$suggestionsList)

    // Attacher les événements
    this._attachEvents()

    return this.$container
  }

  /**
   * Attache tous les événements nécessaires.
   *
   * @description
   * Utilise plusieurs types d'événements :
   * - 'input' : Déclenché à chaque modification du champ
   * - 'keydown' : Pour la navigation clavier
   * - 'focus/blur' : Pour gérer l'affichage des suggestions
   * - 'click' : Pour la sélection d'une suggestion
   *
   * @private
   */
  _attachEvents() {
    // Événement 'input' : déclenché à chaque frappe
    // Utilise le debounce pour éviter trop de recherches
    this.$input.addEventListener('input', (e) => {
      const query = e.target.value
      this._debouncedSearch(query)
    })

    // Événement 'keydown' : navigation clavier
    this.$input.addEventListener('keydown', (e) => {
      this._handleKeydown(e)
    })

    // Événement 'focus' : afficher les suggestions si texte présent
    this.$input.addEventListener('focus', () => {
      if (this.$input.value.length > 0 && this._suggestions.length > 0) {
        this._showSuggestions()
      }
    })

    // Événement 'click' sur le document : fermer les suggestions
    // si clic en dehors de la searchbar
    document.addEventListener('click', (e) => {
      if (!this.$container.contains(e.target)) {
        this._hideSuggestions()
      }
    })
  }

  /**
   * Effectue la recherche dans la liste des photographes.
   *
   * @description
   * CONCEPTS CLÉ :
   * - String.toLowerCase() : Convertit en minuscules pour comparaison insensible à la casse
   * - String.includes() : Vérifie si une chaîne contient une sous-chaîne
   * - String.trim() : Supprime les espaces au début et à la fin
   * - Array.filter() : Filtre les éléments selon un critère
   *
   * @param {string} query - Le texte recherché.
   * @private
   */
  _performSearch(query) {
    // trim() supprime les espaces inutiles
    // toLowerCase() normalise la casse pour une recherche insensible
    const normalizedQuery = query.trim().toLowerCase()

    // Si la recherche est vide, afficher tous les photographes
    if (normalizedQuery.length === 0) {
      this._suggestions = []
      this._hideSuggestions()
      this._onSearch(this._photographers)
      return
    }

    // filter() avec includes() pour trouver les correspondances
    this._suggestions = this._photographers.filter((photographer) => {
      // Normaliser toutes les propriétés à comparer
      const name = photographer.name.toLowerCase()
      const city = photographer.city.toLowerCase()
      const tagline = photographer.tagline.toLowerCase()

      // includes() vérifie si la chaîne contient la sous-chaîne
      // Retourne true si trouvé dans name, city OU tagline
      return (
        name.includes(normalizedQuery) ||
        city.includes(normalizedQuery) ||
        tagline.includes(normalizedQuery)
      )
    })

    // Mettre à jour l'affichage
    if (this._suggestions.length > 0) {
      this._renderSuggestions()
      this._showSuggestions()
    } else {
      this._hideSuggestions()
    }

    // Appeler le callback avec les résultats filtrés
    this._onSearch(this._suggestions)
  }

  /**
   * Génère le HTML des suggestions.
   *
   * @description
   * Utilise la délégation d'événements : un seul listener sur le parent
   * au lieu d'un listener par élément.
   *
   * @private
   */
  _renderSuggestions() {
    // Vider la liste existante
    this.$suggestionsList.innerHTML = ''

    // Réinitialiser la sélection
    this._selectedIndex = -1

    // Créer un élément pour chaque suggestion
    this._suggestions.forEach((photographer, index) => {
      const li = document.createElement('li')
      li.classList.add('search-bar__suggestion')
      li.setAttribute('role', 'option')
      li.setAttribute('data-index', index)
      li.id = `suggestion-${index}`

      // Mettre en évidence le texte correspondant
      const highlightedName = this._highlightMatch(
        photographer.name,
        this.$input.value,
      )

      li.innerHTML = `
        <span class="search-bar__suggestion-name">${highlightedName}</span>
        <span class="search-bar__suggestion-location">${photographer.city}, ${photographer.country}</span>
      `

      // Click sur une suggestion
      li.addEventListener('click', () => {
        this._selectSuggestion(index)
      })

      // Hover pour mettre à jour la sélection visuelle
      li.addEventListener('mouseenter', () => {
        this._updateSelectedIndex(index)
      })

      this.$suggestionsList.appendChild(li)
    })
  }

  /**
   * Met en évidence la partie du texte qui correspond à la recherche.
   *
   * @description
   * CONCEPTS CLÉ :
   * - RegExp : Expressions régulières pour recherche/remplacement
   * - String.replace() : Remplacement avec capture de groupe
   * - 'gi' flags : g = global (toutes les occurrences), i = insensible à la casse
   *
   * @param {string} text - Le texte original.
   * @param {string} query - La recherche à mettre en évidence.
   * @returns {string} Le texte avec la correspondance en gras.
   * @private
   */
  _highlightMatch(text, query) {
    if (!query.trim()) return text

    // Échapper les caractères spéciaux des regex pour éviter les erreurs
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Créer une expression régulière avec les flags :
    // - 'g' : global - trouve toutes les occurrences
    // - 'i' : insensible à la casse
    const regex = new RegExp(`(${escapedQuery})`, 'gi')

    // replace() avec $1 référence le groupe capturé (la correspondance)
    return text.replace(regex, '<strong>$1</strong>')
  }

  /**
   * Gère la navigation au clavier dans les suggestions.
   *
   * @description
   * CONCEPT CLÉ : Keyboard events
   * - e.key : Nom de la touche ('ArrowDown', 'Enter', etc.)
   * - e.preventDefault() : Empêche le comportement par défaut
   *
   * @param {KeyboardEvent} e - L'événement clavier.
   * @private
   */
  _handleKeydown(e) {
    // Si les suggestions ne sont pas affichées, ignorer
    if (!this._isOpen) {
      // Sauf pour Escape qui efface la recherche
      if (e.key === 'Escape') {
        this.$input.value = ''
        this._onSearch(this._photographers)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        // Empêcher le curseur de bouger dans l'input
        e.preventDefault()
        // Incrémenter l'index, revenir au début si à la fin
        this._updateSelectedIndex(
          (this._selectedIndex + 1) % this._suggestions.length,
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        // Décrémenter l'index, aller à la fin si au début
        this._updateSelectedIndex(
          this._selectedIndex <= 0
            ? this._suggestions.length - 1
            : this._selectedIndex - 1,
        )
        break

      case 'Enter':
        e.preventDefault()
        if (this._selectedIndex >= 0) {
          this._selectSuggestion(this._selectedIndex)
        }
        break

      case 'Escape':
        this._hideSuggestions()
        break

      case 'Tab':
        // Permettre la navigation normale au Tab
        this._hideSuggestions()
        break
    }
  }

  /**
   * Met à jour l'index de la suggestion sélectionnée.
   * @param {number} index - Le nouvel index.
   * @private
   */
  _updateSelectedIndex(index) {
    // Retirer la sélection précédente
    const previousSelected = this.$suggestionsList.querySelector(
      '.search-bar__suggestion--selected',
    )
    if (previousSelected) {
      previousSelected.classList.remove('search-bar__suggestion--selected')
      previousSelected.setAttribute('aria-selected', 'false')
    }

    // Appliquer la nouvelle sélection
    this._selectedIndex = index
    const newSelected = this.$suggestionsList.querySelector(
      `[data-index="${index}"]`,
    )
    if (newSelected) {
      newSelected.classList.add('search-bar__suggestion--selected')
      newSelected.setAttribute('aria-selected', 'true')

      // Mettre à jour l'attribut aria-activedescendant pour l'accessibilité
      this.$input.setAttribute('aria-activedescendant', newSelected.id)

      // Scroll pour garder l'élément visible si nécessaire
      newSelected.scrollIntoView({ block: 'nearest' })
    }
  }

  /**
   * Sélectionne une suggestion.
   * @param {number} index - L'index de la suggestion.
   * @private
   */
  _selectSuggestion(index) {
    const photographer = this._suggestions[index]
    if (photographer) {
      // Mettre à jour l'input avec le nom sélectionné
      this.$input.value = photographer.name

      // Fermer les suggestions
      this._hideSuggestions()

      // Appeler le callback de sélection
      if (this._onSelect) {
        this._onSelect(photographer)
      }

      // Filtrer pour ne montrer que ce photographe
      this._onSearch([photographer])
    }
  }

  /**
   * Affiche la liste des suggestions.
   * @private
   */
  _showSuggestions() {
    this._isOpen = true
    this.$suggestionsList.classList.add('search-bar__suggestions--visible')
    this.$container.setAttribute('aria-expanded', 'true')
  }

  /**
   * Masque la liste des suggestions.
   * @private
   */
  _hideSuggestions() {
    this._isOpen = false
    this._selectedIndex = -1
    this.$suggestionsList.classList.remove('search-bar__suggestions--visible')
    this.$container.setAttribute('aria-expanded', 'false')
    this.$input.removeAttribute('aria-activedescendant')
  }

  /**
   * Efface la recherche et réinitialise l'affichage.
   */
  clear() {
    this.$input.value = ''
    this._suggestions = []
    this._hideSuggestions()
    this._onSearch(this._photographers)
  }

  /**
   * Définit la valeur de recherche programmatiquement (pour restauration d'état URL).
   *
   * @description
   * CONCEPT : Synchronisation avec l'état externe
   * Permet de restaurer l'état de recherche depuis une source externe
   * comme les paramètres URL ou localStorage.
   *
   * @param {string} value - La valeur de recherche.
   * @param {boolean} [triggerCallback=true] - Si true, déclenche la recherche.
   */
  setValue(value, triggerCallback = true) {
    this.$input.value = value

    if (triggerCallback && value.trim().length > 0) {
      // Effectuer la recherche immédiatement (sans debounce)
      this._performSearch(value)
    } else if (!value.trim()) {
      // Si valeur vide, réinitialiser
      this._suggestions = []
      this._hideSuggestions()
      if (triggerCallback) {
        this._onSearch(this._photographers)
      }
    }
  }

  /**
   * Retourne la valeur actuelle de la recherche.
   * @returns {string} La valeur de recherche.
   */
  getValue() {
    return this.$input ? this.$input.value : ''
  }
}
