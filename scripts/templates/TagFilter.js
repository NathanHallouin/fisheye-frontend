/**
 * Class representing the tag filtering system.
 *
 * @description
 * This class implements several key JavaScript concepts:
 * - Array.map(): Array transformation
 * - Array.filter(): Array filtering
 * - Array.includes(): Membership verification
 * - Set: Collection of unique values
 * - Spread operator (...): Array decomposition
 * - Event listeners: DOM event handling
 * - Closures: Access to parent scope variables in callbacks
 */
class TagFilter {
  /**
   * Creates a TagFilter instance.
   * @param {Array<Object>} photographers - List of photographers with their tags.
   * @param {Function} onFilterChange - Callback called when filters change.
   */
  constructor(photographers, onFilterChange) {
    this._photographers = photographers
    this._onFilterChange = onFilterChange
    this._activeTags = new Set()
    this._allTags = this._extractAllTags()
    this.$container = null
  }

  /**
   * Extracts all unique tags from the photographers list.
   *
   * @description
   * Uses several JavaScript concepts:
   * - flatMap(): Flattens nested arrays into one
   * - Set: Automatically eliminates duplicates
   * - Spread operator: Converts Set to Array
   *
   * @returns {Array<string>} Sorted list of unique tags.
   * @private
   */
  _extractAllTags() {
    // flatMap combines map() and flat() in a single operation
    // Each photographer has an array of tags, flatMap gathers them all
    const allTags = this._photographers.flatMap(
      (photographer) => photographer.tags,
    )

    // Set automatically eliminates duplicates
    // The spread operator [...] converts the Set to Array
    const uniqueTags = [...new Set(allTags)]

    // sort() sorts alphabetically by default
    return uniqueTags.sort()
  }

  /**
   * Creates the filter HTML container.
   * @returns {HTMLElement} The nav element containing the filters.
   */
  createFilterBar() {
    const nav = document.createElement('nav')
    nav.classList.add('tag-filter')
    nav.setAttribute('aria-label', 'Filter by category')

    // Create the title
    const title = document.createElement('span')
    title.classList.add('tag-filter__title')
    title.textContent = 'Filter by:'
    nav.appendChild(title)

    // Buttons container
    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add('tag-filter__buttons')
    buttonContainer.setAttribute('role', 'group')
    buttonContainer.setAttribute('aria-label', 'Filter buttons')

    // Create a button for each unique tag
    // map() transforms each tag into a button element
    this._allTags.forEach((tag) => {
      const button = this._createTagButton(tag)
      buttonContainer.appendChild(button)
    })

    // Reset button
    const resetButton = this._createResetButton()
    buttonContainer.appendChild(resetButton)

    nav.appendChild(buttonContainer)
    this.$container = nav

    return nav
  }

  /**
   * Creates an individual tag button.
   *
   * @description
   * Demonstrates the use of closures: the 'tag' variable is captured
   * in the event listener callback and remains accessible even after
   * _createTagButton() finishes execution.
   *
   * @param {string} tag - The tag name.
   * @returns {HTMLButtonElement} The created button.
   * @private
   */
  _createTagButton(tag) {
    const button = document.createElement('button')
    button.classList.add('tag-filter__btn')
    button.setAttribute('data-tag', tag)
    button.setAttribute('aria-pressed', 'false')
    button.textContent = this._formatTagName(tag)

    // Closure: 'tag' is captured and accessible in the callback
    // even after _createTagButton() has finished executing
    button.addEventListener('click', () => {
      this._toggleTag(tag, button)
    })

    return button
  }

  /**
   * Creates the filter reset button.
   * @returns {HTMLButtonElement} The reset button.
   * @private
   */
  _createResetButton() {
    const button = document.createElement('button')
    button.classList.add('tag-filter__btn', 'tag-filter__btn--reset')
    button.textContent = 'All'
    button.setAttribute('aria-label', 'Show all photographers')

    button.addEventListener('click', () => {
      this._resetFilters()
    })

    return button
  }

  /**
   * Formats a tag name for display (capitalize first letter).
   * @param {string} tag - The tag to format.
   * @returns {string} The formatted tag.
   * @private
   */
  _formatTagName(tag) {
    return tag.charAt(0).toUpperCase() + tag.slice(1)
  }

  /**
   * Activates or deactivates a filter tag.
   *
   * @description
   * Uses Set to manage active tags:
   * - Set.has(): Checks if an element exists
   * - Set.delete(): Removes an element
   * - Set.add(): Adds an element
   *
   * @param {string} tag - The tag to toggle.
   * @param {HTMLButtonElement} button - The associated button.
   * @private
   */
  _toggleTag(tag, button) {
    // Set.has() checks membership in O(1)
    if (this._activeTags.has(tag)) {
      this._activeTags.delete(tag)
      button.classList.remove('tag-filter__btn--active')
      button.setAttribute('aria-pressed', 'false')
    } else {
      this._activeTags.add(tag)
      button.classList.add('tag-filter__btn--active')
      button.setAttribute('aria-pressed', 'true')
    }

    this._applyFilters()
  }

  /**
   * Resets all active filters.
   * @private
   */
  _resetFilters() {
    // Set.clear() empties the set
    this._activeTags.clear()

    // Remove active class from all buttons
    const buttons = this.$container.querySelectorAll('.tag-filter__btn--active')
    buttons.forEach((btn) => {
      btn.classList.remove('tag-filter__btn--active')
      btn.setAttribute('aria-pressed', 'false')
    })

    this._applyFilters()
  }

  /**
   * Applies filters and returns filtered photographers.
   *
   * @description
   * Uses Array.filter() to create a new array containing
   * only elements that pass the callback function test.
   *
   * The some() method checks if AT LEAST ONE element of the array
   * satisfies the condition (union of tags).
   *
   * @private
   */
  _applyFilters() {
    // If no active tags, display all photographers
    if (this._activeTags.size === 0) {
      this._onFilterChange(this._photographers)
      return
    }

    // Convert Set to Array to use some()
    const activeTagsArray = [...this._activeTags]

    // filter() creates a new array with elements that pass the test
    const filteredPhotographers = this._photographers.filter((photographer) => {
      // some() returns true if AT LEAST ONE active tag is present
      // This implements an OR logic (union)
      return activeTagsArray.some((tag) => photographer.hasTag(tag))
    })

    // Call the callback with filtered photographers
    this._onFilterChange(filteredPhotographers)
  }

  /**
   * Returns the currently active tags.
   * @returns {Array<string>} List of active tags.
   */
  getActiveTags() {
    return [...this._activeTags]
  }

  /**
   * Sets active tags programmatically (for URL state restoration).
   *
   * @description
   * CONCEPT: Synchronization with external state
   * Allows restoring filter state from an external source
   * like URL parameters or localStorage.
   *
   * @param {Array<string>} tags - The tags to activate.
   * @param {boolean} [triggerCallback=true] - If true, calls the filtering callback.
   */
  setTags(tags, triggerCallback = true) {
    // Clear current tags
    this._activeTags.clear()

    // Reset visual state of all buttons
    if (this.$container) {
      const allButtons = this.$container.querySelectorAll(
        '.tag-filter__btn[data-tag]',
      )
      allButtons.forEach((btn) => {
        btn.classList.remove('tag-filter__btn--active')
        btn.setAttribute('aria-pressed', 'false')
      })
    }

    // Add new tags and update UI
    tags.forEach((tag) => {
      if (this._allTags.includes(tag)) {
        this._activeTags.add(tag)

        // Update the corresponding button
        if (this.$container) {
          const button = this.$container.querySelector(`[data-tag="${tag}"]`)
          if (button) {
            button.classList.add('tag-filter__btn--active')
            button.setAttribute('aria-pressed', 'true')
          }
        }
      }
    })

    // Apply filters if requested
    if (triggerCallback) {
      this._applyFilters()
    }
  }
}
