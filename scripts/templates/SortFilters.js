/**
 * Utility class to store and update filtered media.
 * Uses the Singleton pattern via static properties.
 */
class InitData {
  static data = []
  static getData() {
    return this.data
  }
  static update = {}
  static getUpdate() {
    return this.update
  }
}

/**
 * Class to sort media according to different criteria.
 *
 * @description
 * This class implements several key JavaScript concepts:
 * - Array.sort(): Array sorting with comparison function
 * - Spread operator: Array copy to avoid mutations
 * - Comparison functions: Custom sorting logic
 * - localeCompare(): String comparison respecting locale
 */
class SortFilters {
  /**
   * Available sort options.
   * @static
   * @readonly
   */
  static SORT_OPTIONS = {
    POPULARITY: 'Popularity',
    DATE: 'Date',
    TITLE: 'Title',
  }

  /**
   * Available sort orders.
   * @static
   * @readonly
   */
  static SORT_ORDER = {
    ASC: 'asc',
    DESC: 'desc',
  }

  /**
   * Stores the current order for each sort type.
   * @static
   * @private
   */
  static _currentOrders = {
    [SortFilters.SORT_OPTIONS.POPULARITY]: SortFilters.SORT_ORDER.DESC,
    [SortFilters.SORT_OPTIONS.DATE]: SortFilters.SORT_ORDER.DESC,
    [SortFilters.SORT_OPTIONS.TITLE]: SortFilters.SORT_ORDER.ASC,
  }

  /**
   * Last sort type used.
   * @static
   * @private
   */
  static _lastSortType = null

  /**
   * Creates a SortFilters instance and applies the sort.
   * @param {string} typeFilter - The sort type ('Popularity', 'Date', 'Title').
   */
  constructor(typeFilter) {
    this._typeFilter = typeFilter
    this._sortedMedia = []
    this.sortData()
  }

  /**
   * Sorts the media according to the chosen criterion.
   *
   * @description
   * KEY CONCEPT: Immutability with the spread operator
   * We create a COPY of the array before sorting to avoid
   * modifying the original array. This is a best practice
   * that facilitates debugging and avoids side effects.
   *
   * sort() MODIFIES the array it's called on (mutation).
   * Using [...array].sort(), we sort a copy.
   */
  sortData() {
    // Toggle order if clicking on the same sort type
    if (SortFilters._lastSortType === this._typeFilter) {
      this._toggleOrder()
    }
    SortFilters._lastSortType = this._typeFilter

    const order = SortFilters._currentOrders[this._typeFilter]

    // IMPORTANT: Spread operator to create a copy
    // Without [...], sort() would modify InitData.data directly
    const dataCopy = [...InitData.data]

    switch (this._typeFilter) {
      case SortFilters.SORT_OPTIONS.POPULARITY:
        this._sortedMedia = this._sortByPopularity(dataCopy, order)
        break
      case SortFilters.SORT_OPTIONS.TITLE:
        this._sortedMedia = this._sortByTitle(dataCopy, order)
        break
      case SortFilters.SORT_OPTIONS.DATE:
        this._sortedMedia = this._sortByDate(dataCopy, order)
        break
      default:
        this._sortedMedia = dataCopy
    }

    // Update the display
    if (InitData.update && InitData.update.updateMedia) {
      InitData.update.updateMedia(this._sortedMedia)
    }
  }

  /**
   * Toggles the sort order for the current type.
   * @private
   */
  _toggleOrder() {
    const currentOrder = SortFilters._currentOrders[this._typeFilter]
    SortFilters._currentOrders[this._typeFilter] =
      currentOrder === SortFilters.SORT_ORDER.ASC
        ? SortFilters.SORT_ORDER.DESC
        : SortFilters.SORT_ORDER.ASC
  }

  /**
   * Sorts by popularity (number of likes).
   *
   * @description
   * KEY CONCEPT: Comparison function for sort()
   *
   * The comparison function receives two elements (a, b) and must return:
   * - A NEGATIVE number if a should come BEFORE b
   * - A POSITIVE number if a should come AFTER b
   * - ZERO if order doesn't matter
   *
   * For descending numeric sort: b - a
   * For ascending numeric sort: a - b
   *
   * @param {Array} data - The array to sort.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @returns {Array} The sorted array.
   * @private
   */
  _sortByPopularity(data, order) {
    return data.sort((a, b) => {
      // Numeric sort: direct subtraction
      // DESC: b - a (largest first)
      // ASC: a - b (smallest first)
      if (order === SortFilters.SORT_ORDER.DESC) {
        return b._likes - a._likes
      }
      return a._likes - b._likes
    })
  }

  /**
   * Sorts by title (alphabetical order).
   *
   * @description
   * KEY CONCEPT: localeCompare() for string sorting
   *
   * localeCompare() compares two strings according to locale rules.
   * It correctly handles:
   * - Accents (e, e, e...)
   * - Special characters
   * - Case (uppercase/lowercase)
   *
   * Useful options:
   * - sensitivity: 'base' ignores accents and case
   * - numeric: true sorts "2" before "10"
   *
   * @param {Array} data - The array to sort.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @returns {Array} The sorted array.
   * @private
   */
  _sortByTitle(data, order) {
    return data.sort((a, b) => {
      // localeCompare returns -1, 0, or 1
      const comparison = a._title.localeCompare(b._title, 'fr', {
        sensitivity: 'base', // Ignores accents and case
        numeric: true, // "Photo 2" before "Photo 10"
      })

      // Reverse the result for descending order
      return order === SortFilters.SORT_ORDER.DESC ? -comparison : comparison
    })
  }

  /**
   * Sorts by date.
   *
   * @description
   * KEY CONCEPT: Date comparison
   *
   * Date objects can be subtracted directly.
   * JavaScript automatically converts dates to timestamps (milliseconds).
   *
   * new Date('2020-05-25') - new Date('2019-01-01')
   * = timestamp1 - timestamp2
   * = number of milliseconds difference
   *
   * @param {Array} data - The array to sort.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @returns {Array} The sorted array.
   * @private
   */
  _sortByDate(data, order) {
    return data.sort((a, b) => {
      // Convert strings to Date objects
      const dateA = new Date(a._date)
      const dateB = new Date(b._date)

      // Date subtraction = difference in milliseconds
      if (order === SortFilters.SORT_ORDER.DESC) {
        return dateB - dateA // Most recent first
      }
      return dateA - dateB // Oldest first
    })
  }

  /**
   * Returns the current order for a sort type.
   * @param {string} sortType - The sort type.
   * @returns {string} The current order ('asc' or 'desc').
   * @static
   */
  static getCurrentOrder(sortType) {
    return SortFilters._currentOrders[sortType]
  }
}

/**
 * Exportable utility comparison functions.
 *
 * @description
 * These functions can be used independently for other sorts.
 * They follow the Higher-Order Functions pattern: functions
 * that return other functions.
 */
const SortComparators = {
  /**
   * Creates a numeric comparison function.
   *
   * @description
   * KEY CONCEPT: Higher-Order Function
   * A function that returns another function.
   * Allows creating configurable comparators.
   *
   * @param {string} property - The property to compare.
   * @param {boolean} descending - If true, descending sort.
   * @returns {Function} The comparison function.
   *
   * @example
   * const sortByLikes = SortComparators.numeric('_likes', true)
   * array.sort(sortByLikes)
   */
  numeric: (property, descending = false) => {
    return (a, b) => {
      const diff = a[property] - b[property]
      return descending ? -diff : diff
    }
  },

  /**
   * Creates an alphabetic comparison function.
   * @param {string} property - The property to compare.
   * @param {boolean} descending - If true, descending sort.
   * @returns {Function} The comparison function.
   */
  alphabetic: (property, descending = false) => {
    return (a, b) => {
      const comparison = a[property].localeCompare(b[property], 'fr', {
        sensitivity: 'base',
        numeric: true,
      })
      return descending ? -comparison : comparison
    }
  },

  /**
   * Creates a date comparison function.
   * @param {string} property - The property containing the date.
   * @param {boolean} descending - If true, descending sort (recent first).
   * @returns {Function} The comparison function.
   */
  date: (property, descending = true) => {
    return (a, b) => {
      const dateA = new Date(a[property])
      const dateB = new Date(b[property])
      const diff = dateA - dateB
      return descending ? -diff : diff
    }
  },
}
