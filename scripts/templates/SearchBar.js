/**
 * Class representing a search bar with auto-completion.
 *
 * @description
 * This class implements several key JavaScript concepts:
 * - String.includes(): Substring search
 * - String.toLowerCase(): Normalization for case-insensitive search
 * - Debounce: Function call optimization
 * - Closures: Variables captured in callbacks
 * - Input events: Input event handling
 * - Keyboard events: Keyboard navigation in suggestions
 */
class SearchBar {
  /**
   * Creates a SearchBar instance.
   * @param {Array<Object>} photographers - List of photographers to search.
   * @param {Function} onSearch - Callback called with filtered results.
   * @param {Function} onSelect - Callback called when a photographer is selected.
   */
  constructor(photographers, onSearch, onSelect) {
    this._photographers = photographers
    this._onSearch = onSearch
    this._onSelect = onSelect
    this._suggestions = []
    this._selectedIndex = -1
    this._isOpen = false

    // DOM elements (will be created in createSearchBar)
    this.$container = null
    this.$input = null
    this.$suggestionsList = null

    // Create the debounced version of search
    // Debounce waits 300ms after the last keystroke before executing
    this._debouncedSearch = debounce((query) => {
      this._performSearch(query)
    }, 300)
  }

  /**
   * Creates the search bar HTML.
   * @returns {HTMLElement} The search bar container.
   */
  createSearchBar() {
    // Main container
    this.$container = document.createElement('div')
    this.$container.classList.add('search-bar')
    this.$container.setAttribute('role', 'combobox')
    this.$container.setAttribute('aria-expanded', 'false')
    this.$container.setAttribute('aria-haspopup', 'listbox')

    // Search input
    this.$input = document.createElement('input')
    this.$input.type = 'text'
    this.$input.classList.add('search-bar__input')
    this.$input.placeholder = 'Search for a photographer...'
    this.$input.setAttribute('aria-label', 'Search for a photographer')
    this.$input.setAttribute('aria-autocomplete', 'list')
    this.$input.setAttribute('aria-controls', 'search-suggestions')

    // Suggestions list
    this.$suggestionsList = document.createElement('ul')
    this.$suggestionsList.classList.add('search-bar__suggestions')
    this.$suggestionsList.id = 'search-suggestions'
    this.$suggestionsList.setAttribute('role', 'listbox')
    this.$suggestionsList.setAttribute('aria-label', 'Search suggestions')

    // Assemble elements
    this.$container.appendChild(this.$input)
    this.$container.appendChild(this.$suggestionsList)

    // Attach events
    this._attachEvents()

    return this.$container
  }

  /**
   * Attaches all necessary events.
   *
   * @description
   * Uses several event types:
   * - 'input': Triggered on each field modification
   * - 'keydown': For keyboard navigation
   * - 'focus/blur': To manage suggestions display
   * - 'click': For selecting a suggestion
   *
   * @private
   */
  _attachEvents() {
    // 'input' event: triggered on each keystroke
    // Uses debounce to avoid too many searches
    this.$input.addEventListener('input', (e) => {
      const query = e.target.value
      this._debouncedSearch(query)
    })

    // 'keydown' event: keyboard navigation
    this.$input.addEventListener('keydown', (e) => {
      this._handleKeydown(e)
    })

    // 'focus' event: show suggestions if text is present
    this.$input.addEventListener('focus', () => {
      if (this.$input.value.length > 0 && this._suggestions.length > 0) {
        this._showSuggestions()
      }
    })

    // 'click' event on document: close suggestions
    // if clicked outside the searchbar
    document.addEventListener('click', (e) => {
      if (!this.$container.contains(e.target)) {
        this._hideSuggestions()
      }
    })
  }

  /**
   * Performs the search in the photographers list.
   *
   * @description
   * KEY CONCEPTS:
   * - String.toLowerCase(): Converts to lowercase for case-insensitive comparison
   * - String.includes(): Checks if a string contains a substring
   * - String.trim(): Removes spaces at the beginning and end
   * - Array.filter(): Filters elements based on a criterion
   *
   * @param {string} query - The search text.
   * @private
   */
  _performSearch(query) {
    // trim() removes unnecessary spaces
    // toLowerCase() normalizes case for insensitive search
    const normalizedQuery = query.trim().toLowerCase()

    // If search is empty, display all photographers
    if (normalizedQuery.length === 0) {
      this._suggestions = []
      this._hideSuggestions()
      this._onSearch(this._photographers)
      return
    }

    // filter() with includes() to find matches
    this._suggestions = this._photographers.filter((photographer) => {
      // Normalize all properties to compare
      const name = photographer.name.toLowerCase()
      const city = photographer.city.toLowerCase()
      const tagline = photographer.tagline.toLowerCase()

      // includes() checks if the string contains the substring
      // Returns true if found in name, city OR tagline
      return (
        name.includes(normalizedQuery) ||
        city.includes(normalizedQuery) ||
        tagline.includes(normalizedQuery)
      )
    })

    // Update the display
    if (this._suggestions.length > 0) {
      this._renderSuggestions()
      this._showSuggestions()
    } else {
      this._hideSuggestions()
    }

    // Call the callback with filtered results
    this._onSearch(this._suggestions)
  }

  /**
   * Generates the suggestions HTML.
   *
   * @description
   * Uses event delegation: a single listener on the parent
   * instead of one listener per element.
   *
   * @private
   */
  _renderSuggestions() {
    // Clear the existing list
    this.$suggestionsList.innerHTML = ''

    // Reset the selection
    this._selectedIndex = -1

    // Create an element for each suggestion
    this._suggestions.forEach((photographer, index) => {
      const li = document.createElement('li')
      li.classList.add('search-bar__suggestion')
      li.setAttribute('role', 'option')
      li.setAttribute('data-index', index)
      li.id = `suggestion-${index}`

      // Highlight the matching text
      const highlightedName = this._highlightMatch(
        photographer.name,
        this.$input.value,
      )

      li.innerHTML = `
        <span class="search-bar__suggestion-name">${highlightedName}</span>
        <span class="search-bar__suggestion-location">${photographer.city}, ${photographer.country}</span>
      `

      // Click on a suggestion
      li.addEventListener('click', () => {
        this._selectSuggestion(index)
      })

      // Hover to update visual selection
      li.addEventListener('mouseenter', () => {
        this._updateSelectedIndex(index)
      })

      this.$suggestionsList.appendChild(li)
    })
  }

  /**
   * Highlights the part of the text that matches the search.
   *
   * @description
   * KEY CONCEPTS:
   * - RegExp: Regular expressions for search/replace
   * - String.replace(): Replacement with capture group
   * - 'gi' flags: g = global (all occurrences), i = case insensitive
   *
   * @param {string} text - The original text.
   * @param {string} query - The search to highlight.
   * @returns {string} The text with the match in bold.
   * @private
   */
  _highlightMatch(text, query) {
    if (!query.trim()) return text

    // Escape regex special characters to avoid errors
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Create a regular expression with flags:
    // - 'g': global - finds all occurrences
    // - 'i': case insensitive
    const regex = new RegExp(`(${escapedQuery})`, 'gi')

    // replace() with $1 references the captured group (the match)
    return text.replace(regex, '<strong>$1</strong>')
  }

  /**
   * Handles keyboard navigation in the suggestions.
   *
   * @description
   * KEY CONCEPT: Keyboard events
   * - e.key: Key name ('ArrowDown', 'Enter', etc.)
   * - e.preventDefault(): Prevents default behavior
   *
   * @param {KeyboardEvent} e - The keyboard event.
   * @private
   */
  _handleKeydown(e) {
    // If suggestions are not displayed, ignore
    if (!this._isOpen) {
      // Except for Escape which clears the search
      if (e.key === 'Escape') {
        this.$input.value = ''
        this._onSearch(this._photographers)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        // Prevent cursor from moving in the input
        e.preventDefault()
        // Increment index, loop back to start if at end
        this._updateSelectedIndex(
          (this._selectedIndex + 1) % this._suggestions.length,
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        // Decrement index, go to end if at start
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
        // Allow normal Tab navigation
        this._hideSuggestions()
        break
    }
  }

  /**
   * Updates the index of the selected suggestion.
   * @param {number} index - The new index.
   * @private
   */
  _updateSelectedIndex(index) {
    // Remove previous selection
    const previousSelected = this.$suggestionsList.querySelector(
      '.search-bar__suggestion--selected',
    )
    if (previousSelected) {
      previousSelected.classList.remove('search-bar__suggestion--selected')
      previousSelected.setAttribute('aria-selected', 'false')
    }

    // Apply new selection
    this._selectedIndex = index
    const newSelected = this.$suggestionsList.querySelector(
      `[data-index="${index}"]`,
    )
    if (newSelected) {
      newSelected.classList.add('search-bar__suggestion--selected')
      newSelected.setAttribute('aria-selected', 'true')

      // Update aria-activedescendant attribute for accessibility
      this.$input.setAttribute('aria-activedescendant', newSelected.id)

      // Scroll to keep element visible if necessary
      newSelected.scrollIntoView({ block: 'nearest' })
    }
  }

  /**
   * Selects a suggestion.
   * @param {number} index - The suggestion index.
   * @private
   */
  _selectSuggestion(index) {
    const photographer = this._suggestions[index]
    if (photographer) {
      // Update input with selected name
      this.$input.value = photographer.name

      // Close suggestions
      this._hideSuggestions()

      // Call selection callback
      if (this._onSelect) {
        this._onSelect(photographer)
      }

      // Filter to show only this photographer
      this._onSearch([photographer])
    }
  }

  /**
   * Shows the suggestions list.
   * @private
   */
  _showSuggestions() {
    this._isOpen = true
    this.$suggestionsList.classList.add('search-bar__suggestions--visible')
    this.$container.setAttribute('aria-expanded', 'true')
  }

  /**
   * Hides the suggestions list.
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
   * Clears the search and resets the display.
   */
  clear() {
    this.$input.value = ''
    this._suggestions = []
    this._hideSuggestions()
    this._onSearch(this._photographers)
  }

  /**
   * Sets the search value programmatically (for URL state restoration).
   *
   * @description
   * CONCEPT: Synchronization with external state
   * Allows restoring the search state from an external source
   * like URL parameters or localStorage.
   *
   * @param {string} value - The search value.
   * @param {boolean} [triggerCallback=true] - If true, triggers the search.
   */
  setValue(value, triggerCallback = true) {
    this.$input.value = value

    if (triggerCallback && value.trim().length > 0) {
      // Perform search immediately (without debounce)
      this._performSearch(value)
    } else if (!value.trim()) {
      // If empty value, reset
      this._suggestions = []
      this._hideSuggestions()
      if (triggerCallback) {
        this._onSearch(this._photographers)
      }
    }
  }

  /**
   * Returns the current search value.
   * @returns {string} The search value.
   */
  getValue() {
    return this.$input ? this.$input.value : ''
  }
}
