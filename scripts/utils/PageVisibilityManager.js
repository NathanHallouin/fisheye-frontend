/**
 * Gestionnaire de visibilité de page.
 * Pause automatiquement les vidéos quand l'onglet n'est pas visible
 * et les reprend quand l'utilisateur revient.
 *
 * CONCEPT : Page Visibility API
 *
 * L'API Page Visibility permet de détecter quand un onglet devient
 * visible ou caché. Cela permet d'optimiser les ressources :
 * - Pauser les vidéos/animations
 * - Réduire les requêtes réseau
 * - Économiser la batterie sur mobile
 */
class PageVisibilityManager {
  static _instance = null

  /**
   * Retourne l'instance unique du PageVisibilityManager.
   * @returns {PageVisibilityManager} L'instance unique.
   */
  static getInstance() {
    if (!PageVisibilityManager._instance) {
      PageVisibilityManager._instance = new PageVisibilityManager()
    }
    return PageVisibilityManager._instance
  }

  /**
   * Crée une instance de PageVisibilityManager.
   */
  constructor() {
    /**
     * Ensemble des vidéos qui étaient en lecture avant que la page soit cachée.
     * @type {Set<HTMLVideoElement>}
     */
    this._playingVideos = new Set()

    /**
     * Callbacks à exécuter lors des changements de visibilité.
     * @type {Map<string, Function>}
     */
    this._callbacks = new Map()

    /**
     * État de visibilité actuel.
     * @type {boolean}
     */
    this._isVisible = !document.hidden

    this._init()
  }

  /**
   * Initialise le listener de visibilité.
   * @private
   */
  _init() {
    // Vérifier le support de l'API
    if (typeof document.hidden === 'undefined') {
      console.warn('Page Visibility API non supportée')
      return
    }

    document.addEventListener('visibilitychange', () => this._handleVisibilityChange())
  }

  /**
   * Gère les changements de visibilité de la page.
   * @private
   */
  _handleVisibilityChange() {
    this._isVisible = !document.hidden

    if (document.hidden) {
      this._onHidden()
    } else {
      this._onVisible()
    }

    // Exécuter les callbacks enregistrés
    this._callbacks.forEach((callback) => {
      try {
        callback(this._isVisible)
      } catch (error) {
        console.error('Erreur dans le callback de visibilité:', error)
      }
    })
  }

  /**
   * Appelé quand la page devient cachée.
   * @private
   */
  _onHidden() {
    // Trouver toutes les vidéos en lecture
    const videos = document.querySelectorAll('video')

    videos.forEach((video) => {
      if (!video.paused) {
        this._playingVideos.add(video)
        video.pause()
      }
    })
  }

  /**
   * Appelé quand la page devient visible.
   * @private
   */
  _onVisible() {
    // Reprendre les vidéos qui étaient en lecture
    this._playingVideos.forEach((video) => {
      // Vérifier que la vidéo est toujours dans le DOM
      if (document.body.contains(video)) {
        video.play().catch((error) => {
          // Ignorer les erreurs de lecture (autoplay bloqué, etc.)
          console.warn('Impossible de reprendre la vidéo:', error.message)
        })
      }
    })

    this._playingVideos.clear()
  }

  /**
   * Enregistre un callback pour les changements de visibilité.
   * @param {string} id - Identifiant unique du callback.
   * @param {Function} callback - Fonction appelée avec (isVisible: boolean).
   * @returns {Function} Fonction pour désinscrire le callback.
   *
   * @example
   * const unsubscribe = pageVisibility.onVisibilityChange('myComponent', (visible) => {
   *   if (visible) {
   *     startAnimation()
   *   } else {
   *     pauseAnimation()
   *   }
   * })
   */
  onVisibilityChange(id, callback) {
    this._callbacks.set(id, callback)

    return () => this._callbacks.delete(id)
  }

  /**
   * Retire un callback.
   * @param {string} id - Identifiant du callback à retirer.
   */
  offVisibilityChange(id) {
    this._callbacks.delete(id)
  }

  /**
   * Retourne l'état de visibilité actuel.
   * @returns {boolean} True si la page est visible.
   */
  get isVisible() {
    return this._isVisible
  }

  /**
   * Retourne si la page est cachée.
   * @returns {boolean} True si la page est cachée.
   */
  get isHidden() {
    return !this._isVisible
  }

  /**
   * Pause manuellement une vidéo et la mémorise pour reprise.
   * @param {HTMLVideoElement} video - La vidéo à pauser.
   */
  pauseVideo(video) {
    if (!video.paused) {
      this._playingVideos.add(video)
      video.pause()
    }
  }

  /**
   * Reprend manuellement une vidéo mémorisée.
   * @param {HTMLVideoElement} video - La vidéo à reprendre.
   */
  resumeVideo(video) {
    if (this._playingVideos.has(video)) {
      video.play().catch(() => {})
      this._playingVideos.delete(video)
    }
  }

  /**
   * Nettoie les références aux vidéos supprimées du DOM.
   */
  cleanup() {
    this._playingVideos.forEach((video) => {
      if (!document.body.contains(video)) {
        this._playingVideos.delete(video)
      }
    })
  }
}

// Initialiser automatiquement le gestionnaire
document.addEventListener('DOMContentLoaded', () => {
  PageVisibilityManager.getInstance()
})
