/**
 * Gestionnaire d'état URL avec History API.
 *
 * @description
 * Permet de synchroniser l'état de l'application avec l'URL du navigateur.
 * Cela permet :
 * - Des URLs partageables (ex: ?tags=portrait,travel&search=paris)
 * - La navigation arrière/avant du navigateur
 * - La restauration de l'état au chargement de la page
 *
 * CONCEPTS CLÉS :
 *
 * 1. URLSearchParams
 *    API pour manipuler les paramètres de requête d'une URL.
 *    Plus propre que de manipuler les strings manuellement.
 *
 * 2. history.pushState()
 *    Ajoute une entrée dans l'historique du navigateur SANS recharger la page.
 *    Permet de changer l'URL visible tout en restant sur la même page.
 *
 * 3. history.replaceState()
 *    Remplace l'entrée actuelle de l'historique (pas d'ajout).
 *    Utile pour mettre à jour l'URL sans polluer l'historique.
 *
 * 4. popstate event
 *    Déclenché quand l'utilisateur navigue avec les boutons arrière/avant.
 *    Permet de réagir aux changements d'historique.
 */
class UrlStateManager {
  /**
   * Instance unique (Singleton).
   * @type {UrlStateManager|null}
   */
  static _instance = null

  /**
   * Nom de l'événement émis lors des changements d'état.
   * @type {string}
   */
  static STATE_CHANGE_EVENT = 'url-state-changed'

  /**
   * Retourne l'instance unique du UrlStateManager.
   *
   * @returns {UrlStateManager} L'instance unique.
   */
  static getInstance() {
    if (!UrlStateManager._instance) {
      UrlStateManager._instance = new UrlStateManager()
    }
    return UrlStateManager._instance
  }

  /**
   * Crée une instance de UrlStateManager.
   * Initialise l'écoute du popstate.
   */
  constructor() {
    this._state = this._parseCurrentUrl()
    this._initPopStateListener()
  }

  /**
   * Initialise l'écouteur de l'événement popstate.
   *
   * @description
   * CONCEPT : popstate event
   * Cet événement est déclenché quand l'utilisateur clique sur
   * les boutons arrière/avant du navigateur.
   * ATTENTION : popstate n'est PAS déclenché par pushState/replaceState.
   *
   * @private
   */
  _initPopStateListener() {
    window.addEventListener('popstate', (event) => {
      // event.state contient l'objet passé à pushState/replaceState
      // Si null, on parse l'URL actuelle
      this._state = event.state || this._parseCurrentUrl()
      this._emitChange()
    })
  }

  /**
   * Parse l'URL actuelle et extrait les paramètres.
   *
   * @description
   * CONCEPT : URLSearchParams
   * Permet de lire et manipuler les paramètres de l'URL facilement.
   *
   * @example
   * // URL: ?tags=portrait,travel&search=paris
   * // Retourne: { tags: ['portrait', 'travel'], search: 'paris' }
   *
   * @returns {Object} L'état extrait de l'URL.
   * @private
   */
  _parseCurrentUrl() {
    // window.location.search contient la query string (ex: "?tags=portrait")
    const params = new URLSearchParams(window.location.search)

    return {
      tags: this._parseArrayParam(params.get('tags')),
      search: params.get('search') || '',
      sort: params.get('sort') || '',
      order: params.get('order') || 'asc',
    }
  }

  /**
   * Parse un paramètre de type tableau (valeurs séparées par virgules).
   *
   * @param {string|null} value - La valeur du paramètre.
   * @returns {Array<string>} Le tableau de valeurs.
   * @private
   */
  _parseArrayParam(value) {
    if (!value || value.trim() === '') {
      return []
    }
    // "portrait,travel" → ['portrait', 'travel']
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  }

  /**
   * Construit une URL avec les paramètres d'état.
   *
   * @description
   * CONCEPT : URLSearchParams pour construire une URL
   * Plus sûr que la concaténation de strings (encodage automatique).
   *
   * @param {Object} state - L'état à encoder dans l'URL.
   * @returns {string} L'URL construite.
   * @private
   */
  _buildUrl(state) {
    const params = new URLSearchParams()

    // Ajouter les tags s'il y en a
    if (state.tags && state.tags.length > 0) {
      params.set('tags', state.tags.join(','))
    }

    // Ajouter la recherche si non vide
    if (state.search && state.search.trim() !== '') {
      params.set('search', state.search.trim())
    }

    // Ajouter le tri si défini
    if (state.sort && state.sort !== '') {
      params.set('sort', state.sort)
    }

    // Ajouter l'ordre si différent de la valeur par défaut
    if (state.order && state.order !== 'asc') {
      params.set('order', state.order)
    }

    // Construire l'URL finale
    const queryString = params.toString()
    // window.location.pathname = le chemin sans les paramètres (ex: "/index.html")
    return queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname
  }

  /**
   * Émet un événement personnalisé pour notifier les changements d'état.
   *
   * @private
   */
  _emitChange() {
    const event = new CustomEvent(UrlStateManager.STATE_CHANGE_EVENT, {
      detail: { ...this._state },
    })
    document.dispatchEvent(event)
  }

  /**
   * Met à jour l'état et l'URL.
   *
   * @description
   * CONCEPT : history.pushState(state, title, url)
   * - state : Un objet JavaScript associé à cette entrée d'historique
   * - title : Ignoré par la plupart des navigateurs (passer '')
   * - url : La nouvelle URL à afficher
   *
   * pushState AJOUTE une entrée à l'historique.
   * L'utilisateur pourra revenir en arrière.
   *
   * @param {Object} newState - Le nouvel état partiel.
   * @param {boolean} [replace=false] - Si true, utilise replaceState au lieu de pushState.
   */
  setState(newState, replace = false) {
    // Fusionner avec l'état actuel
    this._state = {
      ...this._state,
      ...newState,
    }

    const url = this._buildUrl(this._state)

    if (replace) {
      // replaceState remplace l'entrée actuelle (pas de nouvelle entrée)
      // Utile pour les mises à jour fréquentes (ex: pendant la frappe)
      history.replaceState(this._state, '', url)
    } else {
      // pushState ajoute une nouvelle entrée
      // L'utilisateur pourra revenir en arrière
      history.pushState(this._state, '', url)
    }
  }

  /**
   * Met à jour un seul paramètre de l'état.
   *
   * @param {string} key - La clé du paramètre.
   * @param {*} value - La nouvelle valeur.
   * @param {boolean} [replace=false] - Si true, utilise replaceState.
   */
  setParam(key, value, replace = false) {
    this.setState({ [key]: value }, replace)
  }

  /**
   * Retourne l'état actuel.
   *
   * @returns {Object} Une copie de l'état actuel.
   */
  getState() {
    return { ...this._state }
  }

  /**
   * Retourne un paramètre spécifique de l'état.
   *
   * @param {string} key - La clé du paramètre.
   * @returns {*} La valeur du paramètre.
   */
  getParam(key) {
    return this._state[key]
  }

  /**
   * Vérifie si un tag est actif.
   *
   * @param {string} tag - Le tag à vérifier.
   * @returns {boolean} True si le tag est actif.
   */
  hasTag(tag) {
    return this._state.tags.includes(tag)
  }

  /**
   * Ajoute un tag à l'état.
   *
   * @param {string} tag - Le tag à ajouter.
   */
  addTag(tag) {
    if (!this.hasTag(tag)) {
      this.setState({
        tags: [...this._state.tags, tag],
      })
    }
  }

  /**
   * Retire un tag de l'état.
   *
   * @param {string} tag - Le tag à retirer.
   */
  removeTag(tag) {
    this.setState({
      tags: this._state.tags.filter((t) => t !== tag),
    })
  }

  /**
   * Inverse l'état d'un tag (ajoute si absent, retire si présent).
   *
   * @param {string} tag - Le tag à inverser.
   */
  toggleTag(tag) {
    if (this.hasTag(tag)) {
      this.removeTag(tag)
    } else {
      this.addTag(tag)
    }
  }

  /**
   * Réinitialise tous les filtres.
   */
  clearFilters() {
    this.setState({
      tags: [],
      search: '',
      sort: '',
      order: 'asc',
    })
  }

  /**
   * Écoute les changements d'état URL.
   *
   * @param {Function} callback - La fonction à appeler lors des changements.
   * @returns {Function} Une fonction pour arrêter l'écoute.
   */
  onChange(callback) {
    const handler = (event) => callback(event.detail)
    document.addEventListener(UrlStateManager.STATE_CHANGE_EVENT, handler)

    // Retourner une fonction de nettoyage
    return () => {
      document.removeEventListener(UrlStateManager.STATE_CHANGE_EVENT, handler)
    }
  }

  /**
   * Génère une URL partageable avec l'état actuel.
   *
   * @returns {string} L'URL complète partageable.
   */
  getShareableUrl() {
    return window.location.origin + this._buildUrl(this._state)
  }

  /**
   * Copie l'URL partageable dans le presse-papiers.
   *
   * @async
   * @returns {Promise<boolean>} True si la copie a réussi.
   */
  async copyShareableUrl() {
    try {
      await navigator.clipboard.writeText(this.getShareableUrl())
      return true
    } catch (error) {
      console.error("Impossible de copier l'URL:", error)
      return false
    }
  }
}
