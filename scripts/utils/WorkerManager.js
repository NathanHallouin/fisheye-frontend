/**
 * Gestionnaire de Web Workers.
 *
 * CONCEPT : Web Worker Management
 *
 * Cette classe encapsule la complexité des Web Workers:
 * - Création et gestion du cycle de vie
 * - Communication par Promises (plus simple que callbacks)
 * - Gestion des erreurs
 * - Pool de workers pour les tâches parallèles
 */

/**
 * Gestionnaire pour communiquer facilement avec un Web Worker.
 */
class WorkerManager {
  /**
   * Crée un gestionnaire de worker.
   * @param {string} workerPath - Chemin vers le fichier worker.
   */
  constructor(workerPath) {
    /**
     * Chemin vers le fichier worker.
     * @type {string}
     * @private
     */
    this._workerPath = workerPath

    /**
     * Instance du Worker.
     * @type {Worker|null}
     * @private
     */
    this._worker = null

    /**
     * Map des promesses en attente.
     * @type {Map<string, {resolve: Function, reject: Function}>}
     * @private
     */
    this._pending = new Map()

    /**
     * Compteur pour générer des IDs uniques.
     * @type {number}
     * @private
     */
    this._idCounter = 0

    /**
     * État du worker.
     * @type {boolean}
     * @private
     */
    this._isReady = false

    this._initWorker()
  }

  /**
   * Initialise le worker et configure les handlers.
   * @private
   */
  _initWorker() {
    try {
      this._worker = new Worker(this._workerPath)

      this._worker.onmessage = (e) => this._handleMessage(e)
      this._worker.onerror = (e) => this._handleError(e)

      this._isReady = true
    } catch (error) {
      console.error('[WorkerManager] Impossible de créer le worker:', error)
      this._isReady = false
    }
  }

  /**
   * Gère les messages reçus du worker.
   * @param {MessageEvent} e - L'événement message.
   * @private
   */
  _handleMessage(e) {
    const { type, id, result, error } = e.data

    const pending = this._pending.get(id)
    if (!pending) {
      console.warn(
        '[WorkerManager] Message reçu sans requête correspondante:',
        id,
      )
      return
    }

    this._pending.delete(id)

    if (type === 'SUCCESS') {
      pending.resolve(result)
    } else if (type === 'ERROR') {
      pending.reject(new Error(error))
    }
  }

  /**
   * Gère les erreurs du worker.
   * @param {ErrorEvent} e - L'événement erreur.
   * @private
   */
  _handleError(e) {
    console.error('[WorkerManager] Erreur worker:', e.message)

    // Rejeter toutes les promesses en attente
    this._pending.forEach((pending) => {
      pending.reject(new Error(`Erreur worker: ${e.message}`))
    })
    this._pending.clear()
  }

  /**
   * Génère un ID unique pour une requête.
   * @returns {string} L'ID unique.
   * @private
   */
  _generateId() {
    return `req_${++this._idCounter}_${Date.now()}`
  }

  /**
   * Envoie une requête au worker et retourne une Promise.
   * @param {string} type - Le type de l'opération.
   * @param {Object} payload - Les données à envoyer.
   * @param {number} [timeout=30000] - Timeout en ms.
   * @returns {Promise<*>} Le résultat de l'opération.
   * @private
   */
  _send(type, payload, timeout = 30000) {
    if (!this._isReady || !this._worker) {
      return Promise.reject(new Error('Worker non disponible'))
    }

    return new Promise((resolve, reject) => {
      const id = this._generateId()

      // Configurer le timeout
      const timeoutId = setTimeout(() => {
        this._pending.delete(id)
        reject(
          new Error(`Timeout: opération ${type} a pris plus de ${timeout}ms`),
        )
      }, timeout)

      // Stocker la promesse
      this._pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
      })

      // Envoyer au worker
      this._worker.postMessage({ type, payload, id })
    })
  }

  /**
   * Trie les données dans le worker.
   * @param {Array} data - Les données à trier.
   * @param {string} sortBy - La propriété de tri.
   * @param {string} [order='desc'] - L'ordre ('asc' ou 'desc').
   * @returns {Promise<Array>} Les données triées.
   *
   * @example
   * const sorted = await workerManager.sort(media, 'likes', 'desc')
   */
  sort(data, sortBy, order = 'desc') {
    return this._send('SORT', { data, sortBy, order })
  }

  /**
   * Filtre les données dans le worker.
   * @param {Array} data - Les données à filtrer.
   * @param {Object} filters - Les filtres à appliquer.
   * @returns {Promise<Array>} Les données filtrées.
   *
   * @example
   * const filtered = await workerManager.filter(media, { type: 'image' })
   */
  filter(data, filters) {
    return this._send('FILTER', { data, filters })
  }

  /**
   * Trie et filtre les données en une seule opération.
   * @param {Array} data - Les données.
   * @param {Object} filters - Les filtres.
   * @param {string} sortBy - La propriété de tri.
   * @param {string} [order='desc'] - L'ordre de tri.
   * @returns {Promise<Array>} Les données triées et filtrées.
   */
  sortAndFilter(data, filters, sortBy, order = 'desc') {
    return this._send('SORT_AND_FILTER', { data, filters, sortBy, order })
  }

  /**
   * Recherche dans les données.
   * @param {Array} data - Les données où chercher.
   * @param {string} query - La requête de recherche.
   * @param {string[]} fields - Les champs où chercher.
   * @returns {Promise<Array>} Les résultats.
   *
   * @example
   * const results = await workerManager.search(
   *   photographers,
   *   'paris portrait',
   *   ['name', 'city', 'tagline']
   * )
   */
  search(data, query, fields) {
    return this._send('SEARCH', { data, query, fields })
  }

  /**
   * Agrège les données avec groupement.
   * @param {Array} data - Les données à agréger.
   * @param {string} groupBy - La propriété de groupement.
   * @param {Object} aggregations - Les agrégations.
   * @returns {Promise<Object>} Les données agrégées.
   *
   * @example
   * const stats = await workerManager.aggregate(media, 'photographerId', {
   *   totalLikes: { field: 'likes', operation: 'sum' },
   *   mediaCount: { operation: 'count' }
   * })
   */
  aggregate(data, groupBy, aggregations) {
    return this._send('AGGREGATE', { data, groupBy, aggregations })
  }

  /**
   * Vérifie si le worker est disponible.
   * @returns {boolean} True si le worker est prêt.
   */
  get isAvailable() {
    return this._isReady && this._worker !== null
  }

  /**
   * Termine le worker et libère les ressources.
   */
  terminate() {
    if (this._worker) {
      this._worker.terminate()
      this._worker = null
    }

    // Rejeter les promesses en attente
    this._pending.forEach((pending) => {
      pending.reject(new Error('Worker terminé'))
    })
    this._pending.clear()

    this._isReady = false
  }

  /**
   * Redémarre le worker.
   */
  restart() {
    this.terminate()
    this._initWorker()
  }
}

/**
 * Singleton pour le worker de tri/filtrage.
 */
class SortWorker {
  static _instance = null

  /**
   * Retourne l'instance unique du SortWorker.
   * @returns {WorkerManager} L'instance.
   */
  static getInstance() {
    if (!SortWorker._instance) {
      SortWorker._instance = new WorkerManager(
        './scripts/workers/sortWorker.js',
      )
    }
    return SortWorker._instance
  }

  /**
   * Vérifie si les Web Workers sont supportés.
   * @returns {boolean} True si supportés.
   */
  static isSupported() {
    return typeof Worker !== 'undefined'
  }
}
