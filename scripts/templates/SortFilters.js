/**
 * Classe utilitaire pour stocker et mettre à jour les médias filtrés.
 * Utilise le pattern Singleton via des propriétés statiques.
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
 * Classe pour trier les médias selon différents critères.
 *
 * @description
 * Cette classe implémente plusieurs concepts JavaScript clés :
 * - Array.sort() : Tri de tableaux avec fonction de comparaison
 * - Spread operator : Copie du tableau pour éviter les mutations
 * - Fonctions de comparaison : Logique de tri personnalisée
 * - localeCompare() : Comparaison de chaînes respectant la locale
 */
class SortFilters {
  /**
   * Options de tri disponibles.
   * @static
   * @readonly
   */
  static SORT_OPTIONS = {
    POPULARITY: 'Popularité',
    DATE: 'Date',
    TITLE: 'Titre',
  }

  /**
   * Ordres de tri disponibles.
   * @static
   * @readonly
   */
  static SORT_ORDER = {
    ASC: 'asc',
    DESC: 'desc',
  }

  /**
   * Stocke l'ordre actuel pour chaque type de tri.
   * @static
   * @private
   */
  static _currentOrders = {
    [SortFilters.SORT_OPTIONS.POPULARITY]: SortFilters.SORT_ORDER.DESC,
    [SortFilters.SORT_OPTIONS.DATE]: SortFilters.SORT_ORDER.DESC,
    [SortFilters.SORT_OPTIONS.TITLE]: SortFilters.SORT_ORDER.ASC,
  }

  /**
   * Dernier type de tri utilisé.
   * @static
   * @private
   */
  static _lastSortType = null

  /**
   * Crée une instance de SortFilters et applique le tri.
   * @param {string} typeFilter - Le type de tri ('Popularité', 'Date', 'Titre').
   */
  constructor(typeFilter) {
    this._typeFilter = typeFilter
    this._sortedMedia = []
    this.sortData()
  }

  /**
   * Trie les médias selon le critère choisi.
   *
   * @description
   * CONCEPT CLÉ : Immutabilité avec le spread operator
   * On crée une COPIE du tableau avant de le trier pour ne pas
   * modifier le tableau original. Ceci est une bonne pratique
   * qui facilite le debugging et évite les effets de bord.
   *
   * sort() MODIFIE le tableau sur lequel il est appelé (mutation).
   * En utilisant [...array].sort(), on trie une copie.
   */
  sortData() {
    // Basculer l'ordre si on clique sur le même type de tri
    if (SortFilters._lastSortType === this._typeFilter) {
      this._toggleOrder()
    }
    SortFilters._lastSortType = this._typeFilter

    const order = SortFilters._currentOrders[this._typeFilter]

    // IMPORTANT : Spread operator pour créer une copie
    // Sans [...], sort() modifierait InitData.data directement
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

    // Mettre à jour l'affichage
    if (InitData.update && InitData.update.updateMedia) {
      InitData.update.updateMedia(this._sortedMedia)
    }
  }

  /**
   * Bascule l'ordre de tri pour le type actuel.
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
   * Trie par popularité (nombre de likes).
   *
   * @description
   * CONCEPT CLÉ : Fonction de comparaison pour sort()
   *
   * La fonction de comparaison reçoit deux éléments (a, b) et doit retourner :
   * - Un nombre NÉGATIF si a doit venir AVANT b
   * - Un nombre POSITIF si a doit venir APRÈS b
   * - ZÉRO si l'ordre n'a pas d'importance
   *
   * Pour un tri numérique descendant : b - a
   * Pour un tri numérique ascendant : a - b
   *
   * @param {Array} data - Le tableau à trier.
   * @param {string} order - L'ordre de tri ('asc' ou 'desc').
   * @returns {Array} Le tableau trié.
   * @private
   */
  _sortByPopularity(data, order) {
    return data.sort((a, b) => {
      // Tri numérique : soustraction directe
      // DESC : b - a (plus grand en premier)
      // ASC : a - b (plus petit en premier)
      if (order === SortFilters.SORT_ORDER.DESC) {
        return b._likes - a._likes
      }
      return a._likes - b._likes
    })
  }

  /**
   * Trie par titre (ordre alphabétique).
   *
   * @description
   * CONCEPT CLÉ : localeCompare() pour le tri de chaînes
   *
   * localeCompare() compare deux chaînes selon les règles de la locale.
   * Il gère correctement :
   * - Les accents (é, è, ê...)
   * - Les caractères spéciaux
   * - La casse (majuscules/minuscules)
   *
   * Options utiles :
   * - sensitivity: 'base' ignore les accents et la casse
   * - numeric: true trie "2" avant "10"
   *
   * @param {Array} data - Le tableau à trier.
   * @param {string} order - L'ordre de tri ('asc' ou 'desc').
   * @returns {Array} Le tableau trié.
   * @private
   */
  _sortByTitle(data, order) {
    return data.sort((a, b) => {
      // localeCompare retourne -1, 0, ou 1
      const comparison = a._title.localeCompare(b._title, 'fr', {
        sensitivity: 'base', // Ignore accents et casse
        numeric: true, // "Photo 2" avant "Photo 10"
      })

      // Inverser le résultat pour l'ordre descendant
      return order === SortFilters.SORT_ORDER.DESC ? -comparison : comparison
    })
  }

  /**
   * Trie par date.
   *
   * @description
   * CONCEPT CLÉ : Comparaison de dates
   *
   * Les objets Date peuvent être soustraits directement.
   * JavaScript convertit automatiquement les dates en timestamps (millisecondes).
   *
   * new Date('2020-05-25') - new Date('2019-01-01')
   * = timestamp1 - timestamp2
   * = nombre de millisecondes de différence
   *
   * @param {Array} data - Le tableau à trier.
   * @param {string} order - L'ordre de tri ('asc' ou 'desc').
   * @returns {Array} Le tableau trié.
   * @private
   */
  _sortByDate(data, order) {
    return data.sort((a, b) => {
      // Convertir les chaînes en objets Date
      const dateA = new Date(a._date)
      const dateB = new Date(b._date)

      // Soustraction de dates = différence en millisecondes
      if (order === SortFilters.SORT_ORDER.DESC) {
        return dateB - dateA // Plus récent en premier
      }
      return dateA - dateB // Plus ancien en premier
    })
  }

  /**
   * Retourne l'ordre actuel pour un type de tri.
   * @param {string} sortType - Le type de tri.
   * @returns {string} L'ordre actuel ('asc' ou 'desc').
   * @static
   */
  static getCurrentOrder(sortType) {
    return SortFilters._currentOrders[sortType]
  }
}

/**
 * Fonctions de comparaison utilitaires exportables.
 *
 * @description
 * Ces fonctions peuvent être utilisées indépendamment pour d'autres tris.
 * Elles suivent le pattern de Higher-Order Functions : des fonctions
 * qui retournent d'autres fonctions.
 */
const SortComparators = {
  /**
   * Crée une fonction de comparaison numérique.
   *
   * @description
   * CONCEPT CLÉ : Higher-Order Function
   * Une fonction qui retourne une autre fonction.
   * Permet de créer des comparateurs configurables.
   *
   * @param {string} property - La propriété à comparer.
   * @param {boolean} descending - Si true, tri descendant.
   * @returns {Function} La fonction de comparaison.
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
   * Crée une fonction de comparaison alphabétique.
   * @param {string} property - La propriété à comparer.
   * @param {boolean} descending - Si true, tri descendant.
   * @returns {Function} La fonction de comparaison.
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
   * Crée une fonction de comparaison par date.
   * @param {string} property - La propriété contenant la date.
   * @param {boolean} descending - Si true, tri descendant (récent d'abord).
   * @returns {Function} La fonction de comparaison.
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
