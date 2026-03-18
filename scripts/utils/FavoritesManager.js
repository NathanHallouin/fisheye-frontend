/**
 * Gestionnaire des favoris avec persistance localStorage.
 *
 * @description
 * Cette classe implémente plusieurs concepts JavaScript clés :
 * - localStorage : Stockage persistant côté client
 * - JSON.parse() / JSON.stringify() : Sérialisation/désérialisation
 * - Array.find() : Recherche dans un tableau
 * - Pattern Singleton : Une seule instance partagée
 * - Custom Events : Communication entre composants
 *
 * Le localStorage persiste même après fermeture du navigateur.
 * Capacité : ~5-10 MB selon le navigateur.
 */
class FavoritesManager {
  /**
   * Instance unique (Singleton).
   * @type {FavoritesManager|null}
   * @private
   * @static
   */
  static _instance = null

  /**
   * Clé utilisée dans localStorage.
   * @type {string}
   * @private
   * @static
   */
  static STORAGE_KEY = 'fisheye_favorites'

  /**
   * Nom de l'événement personnalisé émis lors des changements.
   * @type {string}
   * @static
   */
  static CHANGE_EVENT = 'favorites-changed'

  /**
   * Retourne l'instance unique du FavoritesManager (Singleton).
   *
   * @description
   * CONCEPT CLÉ : Pattern Singleton
   * Garantit qu'une seule instance existe dans toute l'application.
   * Utile pour les gestionnaires d'état globaux.
   *
   * @returns {FavoritesManager} L'instance unique.
   * @static
   */
  static getInstance() {
    if (!FavoritesManager._instance) {
      FavoritesManager._instance = new FavoritesManager()
    }
    return FavoritesManager._instance
  }

  /**
   * Crée une instance de FavoritesManager.
   * Utiliser getInstance() plutôt que new FavoritesManager().
   */
  constructor() {
    // Charger les favoris depuis localStorage au démarrage
    this._favorites = this._load()
  }

  /**
   * Charge les favoris depuis localStorage.
   *
   * @description
   * CONCEPT CLÉ : localStorage et JSON.parse()
   *
   * localStorage stocke uniquement des chaînes de caractères.
   * Pour stocker des objets/tableaux, on doit :
   * 1. Sérialiser avec JSON.stringify() lors de la sauvegarde
   * 2. Désérialiser avec JSON.parse() lors de la lecture
   *
   * JSON.parse() peut échouer si les données sont corrompues,
   * d'où le try/catch.
   *
   * @returns {Array<Object>} Les favoris chargés ou un tableau vide.
   * @private
   */
  _load() {
    try {
      // localStorage.getItem retourne null si la clé n'existe pas
      const data = localStorage.getItem(FavoritesManager.STORAGE_KEY)

      if (data === null) {
        return []
      }

      // JSON.parse convertit la chaîne JSON en objet JavaScript
      const parsed = JSON.parse(data)

      // Vérifier que c'est bien un tableau
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      // En cas d'erreur (données corrompues), retourner un tableau vide
      console.error('Erreur lors du chargement des favoris:', error)
      return []
    }
  }

  /**
   * Sauvegarde les favoris dans localStorage.
   *
   * @description
   * CONCEPT CLÉ : JSON.stringify()
   *
   * Convertit un objet JavaScript en chaîne JSON.
   * Attention : les fonctions, undefined, et symboles sont ignorés.
   *
   * @private
   */
  _save() {
    try {
      // JSON.stringify convertit l'objet en chaîne JSON
      const data = JSON.stringify(this._favorites)

      // localStorage.setItem stocke la chaîne
      localStorage.setItem(FavoritesManager.STORAGE_KEY, data)

      // Émettre un événement pour notifier les autres composants
      this._emitChange()
    } catch (error) {
      // Peut échouer si le quota est dépassé
      console.error('Erreur lors de la sauvegarde des favoris:', error)
    }
  }

  /**
   * Émet un événement personnalisé pour notifier les changements.
   *
   * @description
   * CONCEPT CLÉ : Custom Events
   *
   * Permet aux composants de réagir aux changements sans couplage direct.
   * Pattern Observer/Pub-Sub via l'API native du DOM.
   *
   * @private
   */
  _emitChange() {
    const event = new CustomEvent(FavoritesManager.CHANGE_EVENT, {
      detail: {
        favorites: this.getAll(),
        count: this.count(),
      },
    })
    document.dispatchEvent(event)
  }

  /**
   * Ajoute un photographe aux favoris.
   *
   * @param {Object} photographer - Les données du photographe.
   * @param {number} photographer.id - L'identifiant unique.
   * @param {string} photographer.name - Le nom.
   * @returns {boolean} True si ajouté, false si déjà présent.
   */
  add(photographer) {
    // Vérifier si déjà en favori
    if (this.isFavorite(photographer.id)) {
      return false
    }

    // Stocker uniquement les données essentielles
    const favoriteData = {
      id: photographer.id,
      name: photographer.name,
      city: photographer.city,
      country: photographer.country,
      tagline: photographer.tagline,
      price: photographer.price,
      portrait: photographer.portrait,
      addedAt: new Date().toISOString(),
    }

    this._favorites.push(favoriteData)
    this._save()
    return true
  }

  /**
   * Retire un photographe des favoris.
   *
   * @description
   * CONCEPT CLÉ : Array.findIndex() et Array.splice()
   *
   * findIndex() trouve l'index de l'élément correspondant.
   * splice() modifie le tableau en place (suppression).
   *
   * @param {number} photographerId - L'identifiant du photographe.
   * @returns {boolean} True si retiré, false si non trouvé.
   */
  remove(photographerId) {
    // findIndex retourne -1 si non trouvé
    const index = this._favorites.findIndex((fav) => fav.id === photographerId)

    if (index === -1) {
      return false
    }

    // splice(index, 1) supprime 1 élément à l'index donné
    this._favorites.splice(index, 1)
    this._save()
    return true
  }

  /**
   * Ajoute ou retire un photographe des favoris.
   *
   * @param {Object} photographer - Les données du photographe.
   * @returns {boolean} True si maintenant en favori, false sinon.
   */
  toggle(photographer) {
    if (this.isFavorite(photographer.id)) {
      this.remove(photographer.id)
      return false
    } else {
      this.add(photographer)
      return true
    }
  }

  /**
   * Vérifie si un photographe est en favori.
   *
   * @description
   * CONCEPT CLÉ : Array.some()
   *
   * some() retourne true si AU MOINS UN élément satisfait la condition.
   * Plus efficace que find() quand on veut juste un booléen.
   *
   * @param {number} photographerId - L'identifiant du photographe.
   * @returns {boolean} True si en favori.
   */
  isFavorite(photographerId) {
    return this._favorites.some((fav) => fav.id === photographerId)
  }

  /**
   * Retourne tous les favoris.
   *
   * @description
   * Retourne une COPIE pour éviter les modifications externes.
   *
   * @returns {Array<Object>} Copie des favoris.
   */
  getAll() {
    // Spread pour retourner une copie
    return [...this._favorites]
  }

  /**
   * Retourne un favori par son ID.
   *
   * @description
   * CONCEPT CLÉ : Array.find()
   *
   * find() retourne le PREMIER élément qui satisfait la condition,
   * ou undefined si aucun ne correspond.
   *
   * @param {number} photographerId - L'identifiant du photographe.
   * @returns {Object|undefined} Le favori ou undefined.
   */
  getById(photographerId) {
    return this._favorites.find((fav) => fav.id === photographerId)
  }

  /**
   * Retourne le nombre de favoris.
   * @returns {number}
   */
  count() {
    return this._favorites.length
  }

  /**
   * Supprime tous les favoris.
   */
  clear() {
    this._favorites = []
    this._save()
  }

  /**
   * Écoute les changements de favoris.
   *
   * @param {Function} callback - Fonction appelée lors des changements.
   * @returns {Function} Fonction pour arrêter l'écoute.
   *
   * @example
   * const unsubscribe = FavoritesManager.getInstance().onChange((data) => {
   *   console.log('Favoris:', data.favorites)
   *   console.log('Total:', data.count)
   * })
   *
   * // Plus tard, pour arrêter l'écoute :
   * unsubscribe()
   */
  onChange(callback) {
    const handler = (event) => callback(event.detail)
    document.addEventListener(FavoritesManager.CHANGE_EVENT, handler)

    // Retourner une fonction de nettoyage (unsubscribe)
    return () => {
      document.removeEventListener(FavoritesManager.CHANGE_EVENT, handler)
    }
  }

  /**
   * Exporte les favoris au format JSON.
   * Utile pour la sauvegarde ou le partage.
   *
   * @returns {string} Les favoris en JSON.
   */
  export() {
    return JSON.stringify(this._favorites, null, 2)
  }

  /**
   * Importe des favoris depuis une chaîne JSON.
   *
   * @param {string} jsonString - Les favoris en JSON.
   * @param {boolean} merge - Si true, fusionne avec les existants.
   * @returns {boolean} True si l'import a réussi.
   */
  import(jsonString, merge = false) {
    try {
      const imported = JSON.parse(jsonString)

      if (!Array.isArray(imported)) {
        return false
      }

      if (merge) {
        // Fusionner en évitant les doublons
        imported.forEach((item) => {
          if (!this.isFavorite(item.id)) {
            this._favorites.push(item)
          }
        })
      } else {
        this._favorites = imported
      }

      this._save()
      return true
    } catch (error) {
      console.error("Erreur lors de l'import:", error)
      return false
    }
  }
}
