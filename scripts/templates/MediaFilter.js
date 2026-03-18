/**
 * Classe pour créer et gérer le filtre média.
 *
 * @description
 * Cette classe crée un composant dropdown accessible permettant
 * de trier les médias selon différents critères.
 */
class MediaFilter {
  constructor() {
    this.$wrapper = document.createElement('div')
    this.$wrapper.classList.add('filter-container')
    this.$addDom = document.querySelector('#main')
    this.$photographerMedia = document.querySelector('.photographer-media')
    this.createMediaFilter()
    this.createFilter()
  }

  /**
   * Crée le HTML du filtre média avec accessibilité améliorée.
   * @returns {HTMLElement}
   */
  createMediaFilter() {
    const filter = `
        <p class="filter-title" id="sort-label">Trier par</p>
        <div class="filter-media" role="presentation">
            <button
                class="filter-button"
                type="button"
                aria-labelledby="sort-label"
                aria-haspopup="listbox"
                aria-expanded="false"
                aria-controls="filter-dropdown">
                    <span class="filter-selected">Popularité</span>
                    <span class="filter-order-indicator" aria-hidden="true"></span>
                    <span class="filter-arrow" aria-hidden="true"></span>
            </button>
            <ul class="filter-dropdown" role="listbox" id="filter-dropdown" tabindex="-1">
                <li role="option" data-value="Popularité" aria-selected="true" tabindex="0">
                    <span class="filter-option">Popularité</span>
                    <span class="filter-option-order" aria-hidden="true">↓</span>
                </li>
                <li role="option" data-value="Date" aria-selected="false" tabindex="0">
                    <span class="filter-option">Date</span>
                    <span class="filter-option-order" aria-hidden="true"></span>
                </li>
                <li role="option" data-value="Titre" aria-selected="false" tabindex="0">
                    <span class="filter-option">Titre</span>
                    <span class="filter-option-order" aria-hidden="true"></span>
                </li>
            </ul>
        </div>`
    this.$wrapper.innerHTML = filter
    return this.$wrapper
  }

  createFilter() {
    this.$photographerMedia.appendChild(this.$wrapper)
    new MediaFilterButton()
  }
}

/**
 * Classe pour gérer le bouton et les interactions du filtre média.
 *
 * @description
 * Gère l'ouverture/fermeture du dropdown et délègue aux autres classes.
 */
class MediaFilterButton {
  constructor() {
    this.$selectBtn = document.querySelector('.filter-button')
    this.$dropdown = document.querySelector('.filter-dropdown')
    this.$filterMedia = document.querySelector('.filter-media')
    this._isOpen = false
    this.attachEvents()
  }

  /**
   * Attache tous les événements nécessaires.
   */
  attachEvents() {
    // Clic sur le bouton
    this.$selectBtn.addEventListener('click', () => {
      this.toggleDropdown()
    })

    // Navigation clavier sur le bouton
    this.$selectBtn.addEventListener('keydown', (e) => {
      this._handleButtonKeydown(e)
    })

    // Fermer si clic en dehors
    document.addEventListener('click', (e) => {
      if (!this.$filterMedia.contains(e.target) && this._isOpen) {
        this.closeDropdown()
      }
    })

    // Initialiser le gestionnaire de dropdown
    new MediaFilterDropdown(this)
  }

  /**
   * Gère les événements clavier sur le bouton.
   * @param {KeyboardEvent} e
   * @private
   */
  _handleButtonKeydown(e) {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault()
        if (!this._isOpen) {
          this.openDropdown()
        }
        break
      case 'Escape':
        if (this._isOpen) {
          this.closeDropdown()
        }
        break
    }
  }

  /**
   * Ouvre ou ferme le dropdown.
   */
  toggleDropdown() {
    if (this._isOpen) {
      this.closeDropdown()
    } else {
      this.openDropdown()
    }
  }

  /**
   * Ouvre le dropdown.
   */
  openDropdown() {
    this._isOpen = true
    this.$filterMedia.classList.add('active')
    this.$selectBtn.setAttribute('aria-expanded', 'true')

    // Focus sur la première option
    const firstOption = this.$dropdown.querySelector('[role="option"]')
    if (firstOption) {
      firstOption.focus()
    }
  }

  /**
   * Ferme le dropdown.
   */
  closeDropdown() {
    this._isOpen = false
    this.$filterMedia.classList.remove('active')
    this.$selectBtn.setAttribute('aria-expanded', 'false')
    this.$selectBtn.focus()
  }

  /**
   * Vérifie si le dropdown est ouvert.
   * @returns {boolean}
   */
  isOpen() {
    return this._isOpen
  }
}

/**
 * Classe pour gérer les interactions du dropdown.
 *
 * @description
 * Gère la sélection des options et la navigation clavier complète.
 * Implémente les patterns ARIA pour l'accessibilité.
 */
class MediaFilterDropdown {
  /**
   * @param {MediaFilterButton} buttonManager - Le gestionnaire du bouton parent.
   */
  constructor(buttonManager) {
    this._buttonManager = buttonManager
    this.$selectedValue = document.querySelector('.filter-selected')
    this.$orderIndicator = document.querySelector('.filter-order-indicator')
    this.$dropdown = document.querySelector('.filter-dropdown')
    this.$options = document.querySelectorAll(
      '.filter-dropdown [role="option"]',
    )
    this._selectedIndex = 0
    this.attachEvents()
    this._applyInitialSort()
  }

  /**
   * Applique le tri initial (Popularité descendant).
   * @private
   */
  _applyInitialSort() {
    new SortFilters('Popularité')
    this._updateOrderIndicator('Popularité')
  }

  /**
   * Attache les événements sur les options du dropdown.
   */
  attachEvents() {
    this.$options.forEach((option, index) => {
      // Clic sur une option
      option.addEventListener('click', (e) => {
        e.stopPropagation()
        this._selectOption(option, index)
      })

      // Navigation clavier
      option.addEventListener('keydown', (e) => {
        this._handleOptionKeydown(e, index)
      })
    })
  }

  /**
   * Gère la navigation clavier dans les options.
   *
   * @description
   * CONCEPT CLÉ : Navigation clavier accessible
   * - ArrowDown/ArrowUp : Naviguer entre les options
   * - Enter/Space : Sélectionner l'option
   * - Escape : Fermer le dropdown
   * - Home/End : Aller au début/fin
   *
   * @param {KeyboardEvent} e
   * @param {number} currentIndex
   * @private
   */
  _handleOptionKeydown(e, currentIndex) {
    const optionsArray = [...this.$options]
    let newIndex = currentIndex

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        // Aller à l'option suivante, revenir au début si à la fin
        newIndex = (currentIndex + 1) % optionsArray.length
        optionsArray[newIndex].focus()
        break

      case 'ArrowUp':
        e.preventDefault()
        // Aller à l'option précédente, aller à la fin si au début
        newIndex =
          currentIndex === 0 ? optionsArray.length - 1 : currentIndex - 1
        optionsArray[newIndex].focus()
        break

      case 'Home':
        e.preventDefault()
        optionsArray[0].focus()
        break

      case 'End':
        e.preventDefault()
        optionsArray[optionsArray.length - 1].focus()
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        this._selectOption(optionsArray[currentIndex], currentIndex)
        break

      case 'Escape':
        e.preventDefault()
        this._buttonManager.closeDropdown()
        break

      case 'Tab':
        // Fermer le dropdown quand on tab en dehors
        this._buttonManager.closeDropdown()
        break
    }
  }

  /**
   * Sélectionne une option et applique le tri.
   * @param {HTMLElement} option - L'élément option sélectionné.
   * @param {number} index - L'index de l'option.
   * @private
   */
  _selectOption(option, index) {
    const value = option.dataset.value

    // Mettre à jour l'affichage du bouton
    this.$selectedValue.textContent = value

    // Mettre à jour les attributs ARIA
    this.$options.forEach((opt) => {
      opt.setAttribute('aria-selected', 'false')
    })
    option.setAttribute('aria-selected', 'true')

    // Appliquer le tri
    new SortFilters(value)

    // Mettre à jour l'indicateur d'ordre
    this._updateOrderIndicator(value)

    // Fermer le dropdown
    this._buttonManager.closeDropdown()

    this._selectedIndex = index
  }

  /**
   * Met à jour l'indicateur d'ordre de tri.
   * @param {string} sortType - Le type de tri actuel.
   * @private
   */
  _updateOrderIndicator(sortType) {
    const order = SortFilters.getCurrentOrder(sortType)
    const arrow = order === 'desc' ? '↓' : '↑'

    // Mettre à jour l'indicateur dans le bouton
    if (this.$orderIndicator) {
      this.$orderIndicator.textContent = arrow
    }

    // Mettre à jour les indicateurs dans les options
    this.$options.forEach((opt) => {
      const orderSpan = opt.querySelector('.filter-option-order')
      if (opt.dataset.value === sortType) {
        orderSpan.textContent = arrow
      } else {
        orderSpan.textContent = ''
      }
    })
  }
}
