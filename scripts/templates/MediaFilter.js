/**
 * Class to create and manage the media filter.
 *
 * @description
 * This class creates an accessible dropdown component allowing
 * users to sort media according to different criteria.
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
   * Creates the media filter HTML with enhanced accessibility.
   * @returns {HTMLElement}
   */
  createMediaFilter() {
    const filter = `
        <p class="filter-title" id="sort-label">Sort by</p>
        <div class="filter-media" role="presentation">
            <button
                class="filter-button"
                type="button"
                aria-labelledby="sort-label"
                aria-haspopup="listbox"
                aria-expanded="false"
                aria-controls="filter-dropdown">
                    <span class="filter-selected">Popularity</span>
                    <span class="filter-order-indicator" aria-hidden="true"></span>
                    <span class="filter-arrow" aria-hidden="true"></span>
            </button>
            <ul class="filter-dropdown" role="listbox" id="filter-dropdown" tabindex="-1">
                <li role="option" data-value="Popularity" aria-selected="true" tabindex="0">
                    <span class="filter-option">Popularity</span>
                    <span class="filter-option-order" aria-hidden="true">↓</span>
                </li>
                <li role="option" data-value="Date" aria-selected="false" tabindex="0">
                    <span class="filter-option">Date</span>
                    <span class="filter-option-order" aria-hidden="true"></span>
                </li>
                <li role="option" data-value="Title" aria-selected="false" tabindex="0">
                    <span class="filter-option">Title</span>
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
 * Class to manage the button and interactions of the media filter.
 *
 * @description
 * Handles opening/closing the dropdown and delegates to other classes.
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
   * Attaches all necessary events.
   */
  attachEvents() {
    // Click on the button
    this.$selectBtn.addEventListener('click', () => {
      this.toggleDropdown()
    })

    // Keyboard navigation on the button
    this.$selectBtn.addEventListener('keydown', (e) => {
      this._handleButtonKeydown(e)
    })

    // Close if clicked outside
    document.addEventListener('click', (e) => {
      if (!this.$filterMedia.contains(e.target) && this._isOpen) {
        this.closeDropdown()
      }
    })

    // Initialize the dropdown manager
    new MediaFilterDropdown(this)
  }

  /**
   * Handles keyboard events on the button.
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
   * Opens or closes the dropdown.
   */
  toggleDropdown() {
    if (this._isOpen) {
      this.closeDropdown()
    } else {
      this.openDropdown()
    }
  }

  /**
   * Opens the dropdown.
   */
  openDropdown() {
    this._isOpen = true
    this.$filterMedia.classList.add('active')
    this.$selectBtn.setAttribute('aria-expanded', 'true')

    // Focus on the first option
    const firstOption = this.$dropdown.querySelector('[role="option"]')
    if (firstOption) {
      firstOption.focus()
    }
  }

  /**
   * Closes the dropdown.
   */
  closeDropdown() {
    this._isOpen = false
    this.$filterMedia.classList.remove('active')
    this.$selectBtn.setAttribute('aria-expanded', 'false')
    this.$selectBtn.focus()
  }

  /**
   * Checks if the dropdown is open.
   * @returns {boolean}
   */
  isOpen() {
    return this._isOpen
  }
}

/**
 * Class to manage dropdown interactions.
 *
 * @description
 * Handles option selection and complete keyboard navigation.
 * Implements ARIA patterns for accessibility.
 */
class MediaFilterDropdown {
  /**
   * @param {MediaFilterButton} buttonManager - The parent button manager.
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
   * Applies the initial sort (Popularity descending).
   * @private
   */
  _applyInitialSort() {
    new SortFilters('Popularity')
    this._updateOrderIndicator('Popularity')
  }

  /**
   * Attaches events on the dropdown options.
   */
  attachEvents() {
    this.$options.forEach((option, index) => {
      // Click on an option
      option.addEventListener('click', (e) => {
        e.stopPropagation()
        this._selectOption(option, index)
      })

      // Keyboard navigation
      option.addEventListener('keydown', (e) => {
        this._handleOptionKeydown(e, index)
      })
    })
  }

  /**
   * Handles keyboard navigation in the options.
   *
   * @description
   * KEY CONCEPT: Accessible keyboard navigation
   * - ArrowDown/ArrowUp: Navigate between options
   * - Enter/Space: Select the option
   * - Escape: Close the dropdown
   * - Home/End: Go to beginning/end
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
        // Go to next option, loop back to start if at end
        newIndex = (currentIndex + 1) % optionsArray.length
        optionsArray[newIndex].focus()
        break

      case 'ArrowUp':
        e.preventDefault()
        // Go to previous option, go to end if at start
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
        // Close the dropdown when tabbing out
        this._buttonManager.closeDropdown()
        break
    }
  }

  /**
   * Selects an option and applies the sort.
   * @param {HTMLElement} option - The selected option element.
   * @param {number} index - The option index.
   * @private
   */
  _selectOption(option, index) {
    const value = option.dataset.value

    // Update the button display
    this.$selectedValue.textContent = value

    // Update ARIA attributes
    this.$options.forEach((opt) => {
      opt.setAttribute('aria-selected', 'false')
    })
    option.setAttribute('aria-selected', 'true')

    // Apply the sort
    new SortFilters(value)

    // Update the order indicator
    this._updateOrderIndicator(value)

    // Close the dropdown
    this._buttonManager.closeDropdown()

    this._selectedIndex = index
  }

  /**
   * Updates the sort order indicator.
   * @param {string} sortType - The current sort type.
   * @private
   */
  _updateOrderIndicator(sortType) {
    const order = SortFilters.getCurrentOrder(sortType)
    const arrow = order === 'desc' ? '↓' : '↑'

    // Update the indicator in the button
    if (this.$orderIndicator) {
      this.$orderIndicator.textContent = arrow
    }

    // Update the indicators in the options
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
