/**
 * Web Worker for sorting and filtering data.
 *
 * CONCEPT: Web Workers
 *
 * Web Workers execute code in a separate thread,
 * which prevents blocking the main thread (UI).
 *
 * Advantages:
 * - Does not block the user interface
 * - Allows heavy computations without lag
 * - Code isolation (no DOM access)
 *
 * Limitations:
 * - No DOM access
 * - Communication only via messages
 * - Data is copied (no shared references)
 */

/**
 * Listens for messages from the main thread.
 *
 * CONCEPT: postMessage / onmessage
 *
 * Bidirectional communication:
 * - Main -> Worker: worker.postMessage(data)
 * - Worker -> Main: self.postMessage(data)
 *
 * Data is serialized (structured clone algorithm).
 */
self.onmessage = function (e) {
  const { type, payload, id } = e.data

  try {
    let result

    switch (type) {
      case 'SORT':
        result = sortData(payload.data, payload.sortBy, payload.order)
        break

      case 'FILTER':
        result = filterData(payload.data, payload.filters)
        break

      case 'SORT_AND_FILTER':
        let filtered = filterData(payload.data, payload.filters)
        result = sortData(filtered, payload.sortBy, payload.order)
        break

      case 'SEARCH':
        result = searchData(payload.data, payload.query, payload.fields)
        break

      case 'AGGREGATE':
        result = aggregateData(
          payload.data,
          payload.groupBy,
          payload.aggregations,
        )
        break

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }

    // Send the result to the main thread
    self.postMessage({
      type: 'SUCCESS',
      id,
      result,
    })
  } catch (error) {
    // Send the error to the main thread
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message,
    })
  }
}

/**
 * Sorts an array of data.
 * @param {Array} data - The data to sort.
 * @param {string} sortBy - The sort property.
 * @param {string} [order='desc'] - The sort order ('asc' or 'desc').
 * @returns {Array} The sorted array (copy).
 */
function sortData(data, sortBy, order = 'desc') {
  // Create a copy to not modify the original
  const sorted = [...data]

  sorted.sort((a, b) => {
    let valueA = a[sortBy]
    let valueB = b[sortBy]

    // Handle null/undefined values
    if (valueA == null) return order === 'asc' ? -1 : 1
    if (valueB == null) return order === 'asc' ? 1 : -1

    // Comparison based on type
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
      const comparison = valueA.localeCompare(valueB, 'fr')
      return order === 'asc' ? comparison : -comparison
    }

    if (typeof valueA === 'number') {
      return order === 'asc' ? valueA - valueB : valueB - valueA
    }

    // For dates
    if (valueA instanceof Date || !isNaN(Date.parse(valueA))) {
      const dateA = new Date(valueA)
      const dateB = new Date(valueB)
      return order === 'asc' ? dateA - dateB : dateB - dateA
    }

    return 0
  })

  return sorted
}

/**
 * Filters an array of data.
 * @param {Array} data - The data to filter.
 * @param {Object} filters - The filters to apply.
 * @returns {Array} The filtered array.
 *
 * @example
 * filterData(media, {
 *   photographerId: 123,
 *   type: 'image',
 *   minLikes: 100
 * })
 */
function filterData(data, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return data
  }

  return data.filter((item) => {
    for (const [key, filterValue] of Object.entries(filters)) {
      // Ignore empty filters
      if (
        filterValue === null ||
        filterValue === undefined ||
        filterValue === ''
      ) {
        continue
      }

      const itemValue = item[key]

      // Comparison filter (min/max)
      if (key.startsWith('min')) {
        const field = key.replace('min', '').toLowerCase()
        if (item[field] < filterValue) return false
        continue
      }

      if (key.startsWith('max')) {
        const field = key.replace('max', '').toLowerCase()
        if (item[field] > filterValue) return false
        continue
      }

      // Array filter (inclusion)
      if (Array.isArray(filterValue)) {
        if (!filterValue.includes(itemValue)) return false
        continue
      }

      // Function filter
      if (typeof filterValue === 'function') {
        if (!filterValue(itemValue, item)) return false
        continue
      }

      // Strict equality filter
      if (itemValue !== filterValue) return false
    }

    return true
  })
}

/**
 * Searches in an array of data.
 * @param {Array} data - The data to search in.
 * @param {string} query - The search query.
 * @param {string[]} fields - The fields to search in.
 * @returns {Array} The search results.
 */
function searchData(data, query, fields) {
  if (!query || query.trim() === '') {
    return data
  }

  const normalizedQuery = query.toLowerCase().trim()
  const searchTerms = normalizedQuery.split(/\s+/)

  return data.filter((item) => {
    // Check if all search terms are present
    return searchTerms.every((term) => {
      return fields.some((field) => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term)
        }
        if (Array.isArray(value)) {
          return value.some(
            (v) => typeof v === 'string' && v.toLowerCase().includes(term),
          )
        }
        return false
      })
    })
  })
}

/**
 * Aggregates data with grouping.
 * @param {Array} data - The data to aggregate.
 * @param {string} groupBy - The grouping property.
 * @param {Object} aggregations - The aggregations to calculate.
 * @returns {Object} The aggregated data.
 *
 * @example
 * aggregateData(media, 'photographerId', {
 *   totalLikes: { field: 'likes', operation: 'sum' },
 *   avgLikes: { field: 'likes', operation: 'avg' },
 *   count: { operation: 'count' }
 * })
 */
function aggregateData(data, groupBy, aggregations) {
  const groups = {}

  // Group the data
  data.forEach((item) => {
    const key = item[groupBy]
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })

  // Calculate aggregations for each group
  const result = {}

  for (const [key, items] of Object.entries(groups)) {
    result[key] = {}

    for (const [name, config] of Object.entries(aggregations)) {
      const { field, operation } = config

      switch (operation) {
        case 'count':
          result[key][name] = items.length
          break

        case 'sum':
          result[key][name] = items.reduce(
            (sum, item) => sum + (item[field] || 0),
            0,
          )
          break

        case 'avg':
          const sum = items.reduce((s, item) => s + (item[field] || 0), 0)
          result[key][name] = items.length > 0 ? sum / items.length : 0
          break

        case 'min':
          result[key][name] = Math.min(
            ...items.map((item) => item[field] || Infinity),
          )
          break

        case 'max':
          result[key][name] = Math.max(
            ...items.map((item) => item[field] || -Infinity),
          )
          break

        case 'first':
          result[key][name] = items.length > 0 ? items[0][field] : null
          break

        case 'last':
          result[key][name] =
            items.length > 0 ? items[items.length - 1][field] : null
          break

        case 'collect':
          result[key][name] = items.map((item) => item[field])
          break

        default:
          throw new Error(`Unknown aggregation operation: ${operation}`)
      }
    }
  }

  return result
}
