/**
 * Web Worker pour le tri et le filtrage des données.
 *
 * CONCEPT : Web Workers
 *
 * Les Web Workers exécutent du code dans un thread séparé,
 * ce qui évite de bloquer le thread principal (UI).
 *
 * Avantages:
 * - Ne bloque pas l'interface utilisateur
 * - Permet des calculs lourds sans lag
 * - Isolation du code (pas d'accès au DOM)
 *
 * Limitations:
 * - Pas d'accès au DOM
 * - Communication uniquement par messages
 * - Les données sont copiées (pas de références partagées)
 */

/**
 * Écoute les messages du thread principal.
 *
 * CONCEPT : postMessage / onmessage
 *
 * Communication bidirectionnelle:
 * - Main -> Worker: worker.postMessage(data)
 * - Worker -> Main: self.postMessage(data)
 *
 * Les données sont sérialisées (structured clone algorithm).
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
        throw new Error(`Type d'opération inconnu: ${type}`)
    }

    // Envoyer le résultat au thread principal
    self.postMessage({
      type: 'SUCCESS',
      id,
      result,
    })
  } catch (error) {
    // Envoyer l'erreur au thread principal
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message,
    })
  }
}

/**
 * Trie un tableau de données.
 * @param {Array} data - Les données à trier.
 * @param {string} sortBy - La propriété de tri.
 * @param {string} [order='desc'] - L'ordre de tri ('asc' ou 'desc').
 * @returns {Array} Le tableau trié (copie).
 */
function sortData(data, sortBy, order = 'desc') {
  // Créer une copie pour ne pas modifier l'original
  const sorted = [...data]

  sorted.sort((a, b) => {
    let valueA = a[sortBy]
    let valueB = b[sortBy]

    // Gérer les valeurs nulles/undefined
    if (valueA == null) return order === 'asc' ? -1 : 1
    if (valueB == null) return order === 'asc' ? 1 : -1

    // Comparaison selon le type
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
      const comparison = valueA.localeCompare(valueB, 'fr')
      return order === 'asc' ? comparison : -comparison
    }

    if (typeof valueA === 'number') {
      return order === 'asc' ? valueA - valueB : valueB - valueA
    }

    // Pour les dates
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
 * Filtre un tableau de données.
 * @param {Array} data - Les données à filtrer.
 * @param {Object} filters - Les filtres à appliquer.
 * @returns {Array} Le tableau filtré.
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
      // Ignorer les filtres vides
      if (
        filterValue === null ||
        filterValue === undefined ||
        filterValue === ''
      ) {
        continue
      }

      const itemValue = item[key]

      // Filtre de comparaison (min/max)
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

      // Filtre par tableau (inclusion)
      if (Array.isArray(filterValue)) {
        if (!filterValue.includes(itemValue)) return false
        continue
      }

      // Filtre par fonction
      if (typeof filterValue === 'function') {
        if (!filterValue(itemValue, item)) return false
        continue
      }

      // Filtre d'égalité strict
      if (itemValue !== filterValue) return false
    }

    return true
  })
}

/**
 * Recherche dans un tableau de données.
 * @param {Array} data - Les données où chercher.
 * @param {string} query - La requête de recherche.
 * @param {string[]} fields - Les champs où chercher.
 * @returns {Array} Les résultats de recherche.
 */
function searchData(data, query, fields) {
  if (!query || query.trim() === '') {
    return data
  }

  const normalizedQuery = query.toLowerCase().trim()
  const searchTerms = normalizedQuery.split(/\s+/)

  return data.filter((item) => {
    // Vérifier si tous les termes de recherche sont présents
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
 * Agrège des données avec groupement.
 * @param {Array} data - Les données à agréger.
 * @param {string} groupBy - La propriété de groupement.
 * @param {Object} aggregations - Les agrégations à calculer.
 * @returns {Object} Les données agrégées.
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

  // Grouper les données
  data.forEach((item) => {
    const key = item[groupBy]
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })

  // Calculer les agrégations pour chaque groupe
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
          throw new Error(`Opération d'agrégation inconnue: ${operation}`)
      }
    }
  }

  return result
}
