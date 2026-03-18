/**
 * Gestionnaire de cache pour les données asynchrones.
 *
 * @description
 * Met en cache les résultats des appels API pour éviter les requêtes
 * redondantes. Supporte un TTL (Time To Live) configurable.
 *
 * CONCEPTS CLÉS :
 *
 * 1. Map : Structure de données pour le stockage clé-valeur
 *    Plus performante que Object pour les ajouts/suppressions fréquents
 *
 * 2. Promise caching : On cache la Promise, pas le résultat
 *    Cela évite les requêtes en double même si elles sont simultanées
 *
 * 3. TTL (Time To Live) : Durée de validité du cache
 *    Après expiration, les données sont rechargées
 *
 * 4. Memoization : Réutilisation des résultats de calculs coûteux
 */
class CacheManager {
  /**
   * Instance unique (Singleton).
   * @type {CacheManager|null}
   */
  static _instance = null

  /**
   * Retourne l'instance unique du CacheManager.
   *
   * @param {number} [ttl] - TTL par défaut en millisecondes.
   * @returns {CacheManager} L'instance unique.
   */
  static getInstance(ttl) {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager(ttl)
    }
    return CacheManager._instance
  }

  /**
   * Crée une instance de CacheManager.
   *
   * @param {number} [ttl=300000] - TTL par défaut (5 minutes).
   */
  constructor(ttl = 300000) {
    /**
     * CONCEPT : Map vs Object
     *
     * Map est préféré pour le cache car :
     * - Performances meilleures pour ajouts/suppressions fréquents
     * - Clés de n'importe quel type (pas seulement strings)
     * - Méthode .size intégrée
     * - Itération dans l'ordre d'insertion
     */
    this._cache = new Map()
    this._defaultTTL = ttl
  }

  /**
   * Récupère une valeur du cache ou l'obtient via fetchFn.
   *
   * @description
   * CONCEPT CLÉ : Promise caching
   *
   * On stocke la PROMISE dans le cache, pas le résultat.
   * Ainsi, si deux appels arrivent simultanément :
   * - Le premier crée la Promise et la met en cache
   * - Le second récupère la même Promise
   * - Les deux attendent la même résolution
   * - Une seule requête réseau est effectuée
   *
   * @param {string} key - La clé de cache.
   * @param {Function} fetchFn - Fonction async qui récupère les données.
   * @param {number} [ttl] - TTL spécifique pour cette entrée.
   * @returns {Promise<*>} Les données (depuis le cache ou fetchFn).
   *
   * @example
   * const data = await cache.get('photographers', async () => {
   *   const response = await fetch('/api/photographers')
   *   return response.json()
   * })
   */
  async get(key, fetchFn, ttl = this._defaultTTL) {
    const cached = this._cache.get(key)

    // Vérifier si le cache est valide
    if (cached && this._isValid(cached, ttl)) {
      // Retourner la Promise cachée (peut être en cours ou résolue)
      return cached.promise
    }

    // Créer une nouvelle entrée de cache
    const entry = {
      promise: fetchFn(), // Stocker la Promise, pas le résultat
      timestamp: Date.now(),
    }

    this._cache.set(key, entry)

    // Gérer les erreurs : invalider le cache si l'appel échoue
    entry.promise.catch(() => {
      // Supprimer du cache uniquement si c'est toujours la même entrée
      if (this._cache.get(key) === entry) {
        this._cache.delete(key)
      }
    })

    return entry.promise
  }

  /**
   * Vérifie si une entrée de cache est encore valide.
   *
   * @param {Object} entry - L'entrée de cache.
   * @param {number} ttl - Le TTL à vérifier.
   * @returns {boolean} True si valide.
   * @private
   */
  _isValid(entry, ttl) {
    const age = Date.now() - entry.timestamp
    return age < ttl
  }

  /**
   * Définit une valeur dans le cache.
   *
   * @param {string} key - La clé de cache.
   * @param {*} value - La valeur à mettre en cache.
   */
  set(key, value) {
    this._cache.set(key, {
      promise: Promise.resolve(value),
      timestamp: Date.now(),
    })
  }

  /**
   * Vérifie si une clé existe dans le cache (et est valide).
   *
   * @param {string} key - La clé à vérifier.
   * @param {number} [ttl] - TTL spécifique.
   * @returns {boolean} True si la clé existe et est valide.
   */
  has(key, ttl = this._defaultTTL) {
    const cached = this._cache.get(key)
    return cached && this._isValid(cached, ttl)
  }

  /**
   * Invalide une entrée du cache.
   *
   * @param {string} key - La clé à invalider.
   */
  invalidate(key) {
    this._cache.delete(key)
  }

  /**
   * Invalide les entrées correspondant à un pattern.
   *
   * @param {string|RegExp} pattern - Le pattern à matcher.
   *
   * @example
   * cache.invalidatePattern(/^photographer_/)
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this._cache.keys()) {
      if (regex.test(key)) {
        this._cache.delete(key)
      }
    }
  }

  /**
   * Vide tout le cache.
   */
  clear() {
    this._cache.clear()
  }

  /**
   * Retourne les statistiques du cache.
   *
   * @returns {Object} Les statistiques.
   */
  getStats() {
    let validCount = 0
    let expiredCount = 0

    for (const entry of this._cache.values()) {
      if (this._isValid(entry, this._defaultTTL)) {
        validCount++
      } else {
        expiredCount++
      }
    }

    return {
      size: this._cache.size,
      valid: validCount,
      expired: expiredCount,
      keys: [...this._cache.keys()],
    }
  }

  /**
   * Nettoie les entrées expirées.
   *
   * @description
   * À appeler périodiquement pour libérer la mémoire.
   *
   * @returns {number} Le nombre d'entrées supprimées.
   */
  cleanup() {
    let removed = 0

    for (const [key, entry] of this._cache.entries()) {
      if (!this._isValid(entry, this._defaultTTL)) {
        this._cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Précharge des données dans le cache.
   *
   * @description
   * Utile pour charger des données dont on sait qu'elles seront
   * nécessaires prochainement (prefetching).
   *
   * @param {string} key - La clé de cache.
   * @param {Function} fetchFn - Fonction async qui récupère les données.
   * @returns {Promise<void>}
   */
  async prefetch(key, fetchFn) {
    if (!this.has(key)) {
      await this.get(key, fetchFn)
    }
  }

  /**
   * Wrapper pour créer une fonction memoized.
   *
   * @description
   * CONCEPT : Memoization
   * Transforme une fonction en version memoized qui cache ses résultats.
   *
   * @param {Function} fn - La fonction à memoizer.
   * @param {Function} [keyGenerator] - Fonction pour générer la clé de cache.
   * @param {number} [ttl] - TTL pour les résultats.
   * @returns {Function} La fonction memoized.
   *
   * @example
   * const memoizedFetch = cache.memoize(
   *   (id) => fetch(`/api/user/${id}`).then(r => r.json()),
   *   (id) => `user_${id}`,
   *   60000 // 1 minute
   * )
   */
  memoize(fn, keyGenerator, ttl) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      return this.get(key, () => fn(...args), ttl)
    }
  }
}
