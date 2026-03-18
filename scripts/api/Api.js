class Api {
  /**
   * @param {string} url - L'URL de l'API.
   * @param {Object} [options] - Options de configuration.
   * @param {boolean} [options.useCache=true] - Utiliser le cache.
   * @param {number} [options.cacheTTL=300000] - TTL du cache (5 min par défaut).
   */
  constructor(url, options = {}) {
    this._url = url
    this._useCache = options.useCache !== false
    this._cacheTTL = options.cacheTTL || 300000
    this._cache =
      typeof CacheManager !== 'undefined' ? CacheManager.getInstance() : null
  }

  /**
   * Effectue une requête GET pour récupérer les données.
   *
   * @description
   * CONCEPT : Cache de Promises
   * Si le cache est activé, on utilise le CacheManager pour éviter
   * les requêtes redondantes. Le cache stocke la Promise elle-même,
   * ce qui évite les requêtes en double même si elles sont simultanées.
   *
   * @async
   * @returns {Promise<Object|null>} Les données JSON ou null en cas d'erreur.
   */
  async get() {
    // Si le cache est activé et disponible
    if (this._useCache && this._cache) {
      return this._cache.get(this._url, () => this._fetch(), this._cacheTTL)
    }

    // Sinon, requête directe
    return this._fetch()
  }

  /**
   * Effectue la requête fetch.
   *
   * @async
   * @returns {Promise<Object|null>} Les données JSON ou null en cas d'erreur.
   * @private
   */
  async _fetch() {
    try {
      const res = await fetch(this._url)
      return await res.json()
    } catch (err) {
      console.error('Une erreur est survenue', err)
      return null
    }
  }

  /**
   * Force le rechargement des données (ignore le cache).
   *
   * @async
   * @returns {Promise<Object|null>} Les données JSON ou null en cas d'erreur.
   */
  async refresh() {
    if (this._cache) {
      this._cache.invalidate(this._url)
    }
    return this.get()
  }

  /**
   * Invalide le cache pour cette URL.
   */
  invalidateCache() {
    if (this._cache) {
      this._cache.invalidate(this._url)
    }
  }
}

/**
 * Classe pour récupérer les données des photographes via l'API.
 * @extends Api
 */
class PhotographerApi extends Api {
  /**
   * @param {string} url - L'URL de l'API des photographes.
   */
  constructor(url) {
    super(url)
  }
  /**
   * Récupère les données des photographes.
   * @async
   * @returns {Promise<Object|null>} Les données JSON ou null en cas d'erreur.
   */
  async getPhotographers() {
    return await this.get()
  }
}
