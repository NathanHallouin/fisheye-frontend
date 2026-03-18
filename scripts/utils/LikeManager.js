/**
 * Gestionnaire de likes avec délégation d'événements.
 *
 * @description
 * Gère les likes sur les médias avec :
 * - Event Delegation : un seul listener pour tous les boutons
 * - Optimistic UI : mise à jour immédiate avant confirmation
 * - Persistance localStorage
 * - Animation de feedback
 *
 * CONCEPT CLÉ : Event Delegation
 * Au lieu d'attacher un listener à CHAQUE bouton like,
 * on attache UN SEUL listener au conteneur parent.
 * Le listener identifie ensuite quel bouton a été cliqué.
 *
 * Avantages :
 * - Performance : moins de listeners = moins de mémoire
 * - Dynamique : fonctionne avec les éléments ajoutés après
 * - Simplicité : un seul endroit pour gérer la logique
 */
class LikeManager {
  /**
   * Instance unique (Singleton).
   * @type {LikeManager|null}
   */
  static _instance = null

  /**
   * Clé de stockage localStorage.
   * @type {string}
   */
  static STORAGE_KEY = 'fisheye_likes'

  /**
   * Nom de l'événement émis lors des changements.
   * @type {string}
   */
  static CHANGE_EVENT = 'likes-changed'

  /**
   * Retourne l'instance unique du LikeManager.
   * @returns {LikeManager} L'instance unique.
   */
  static getInstance() {
    if (!LikeManager._instance) {
      LikeManager._instance = new LikeManager()
    }
    return LikeManager._instance
  }

  /**
   * Crée une instance de LikeManager.
   */
  constructor() {
    this._likes = this._load()
    this._containers = new Set()
  }

  /**
   * Charge les likes depuis localStorage.
   *
   * @returns {Object} Les likes { mediaId: likeCount }.
   * @private
   */
  _load() {
    try {
      const data = localStorage.getItem(LikeManager.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('LikeManager: Erreur de chargement', error)
      return {}
    }
  }

  /**
   * Sauvegarde les likes dans localStorage.
   * @private
   */
  _save() {
    try {
      localStorage.setItem(LikeManager.STORAGE_KEY, JSON.stringify(this._likes))
    } catch (error) {
      console.error('LikeManager: Erreur de sauvegarde', error)
    }
  }

  /**
   * Attache la délégation d'événements à un conteneur.
   *
   * @description
   * CONCEPT : Event Delegation
   *
   * On attache le listener au CONTENEUR, pas aux boutons.
   * Quand un clic se produit, l'événement "bubble" (remonte)
   * jusqu'au conteneur où on le capture.
   *
   * e.target = l'élément cliqué (peut être le bouton ou un enfant)
   * e.target.closest() = trouve l'ancêtre correspondant au sélecteur
   *
   * @param {HTMLElement} container - Le conteneur à observer.
   */
  attachToContainer(container) {
    if (this._containers.has(container)) return

    /**
     * CONCEPT : Event Delegation avec closest()
     *
     * closest() remonte le DOM pour trouver l'ancêtre qui match.
     * Si le clic est sur l'icône SVG à l'intérieur du bouton,
     * closest('[data-like-id]') trouve le bouton parent.
     */
    container.addEventListener('click', (e) => {
      // Trouver le bouton like le plus proche (ou null si clic ailleurs)
      const likeBtn = e.target.closest('[data-like-id]')

      if (likeBtn) {
        e.preventDefault()
        this._handleLikeClick(likeBtn)
      }
    })

    this._containers.add(container)
  }

  /**
   * Gère le clic sur un bouton like.
   *
   * @description
   * CONCEPT : Optimistic UI
   *
   * On met à jour l'interface IMMÉDIATEMENT, avant même
   * de sauvegarder. L'utilisateur voit le feedback instantanément.
   *
   * Si la sauvegarde échoue, on pourrait rollback (non implémenté ici).
   *
   * @param {HTMLElement} button - Le bouton cliqué.
   * @private
   */
  _handleLikeClick(button) {
    /**
     * CONCEPT : data-* attributes
     *
     * Les attributs data-* permettent de stocker des données
     * directement dans le HTML, accessibles via dataset.
     *
     * <button data-like-id="123" data-base-likes="42">
     * button.dataset.likeId = "123"
     * button.dataset.baseLikes = "42"
     */
    const mediaId = button.dataset.likeId
    const baseLikes = parseInt(button.dataset.baseLikes, 10) || 0

    // Toggle le like
    const isLiked = this.toggle(mediaId)

    // Mise à jour OPTIMISTE de l'UI (avant sauvegarde)
    this._updateButtonUI(button, isLiked, baseLikes)

    // Animation de feedback
    this._animateButton(button)

    // Sauvegarder (async en arrière-plan)
    this._save()

    // Émettre l'événement de changement
    this._emitChange(mediaId, isLiked)
  }

  /**
   * Met à jour l'apparence du bouton.
   *
   * @param {HTMLElement} button - Le bouton à mettre à jour.
   * @param {boolean} isLiked - Si le média est liké.
   * @param {number} baseLikes - Nombre de likes de base.
   * @private
   */
  _updateButtonUI(button, isLiked, baseLikes) {
    // Mettre à jour la classe
    button.classList.toggle('like-btn--liked', isLiked)

    // Mettre à jour aria-pressed pour l'accessibilité
    button.setAttribute('aria-pressed', isLiked.toString())

    // Mettre à jour le compteur
    const counter = button.querySelector('.like-btn__count')
    if (counter) {
      const totalLikes = baseLikes + (isLiked ? 1 : 0)
      counter.textContent = totalLikes
    }
  }

  /**
   * Anime le bouton après un clic.
   *
   * @param {HTMLElement} button - Le bouton à animer.
   * @private
   */
  _animateButton(button) {
    // Ajouter la classe d'animation
    button.classList.add('like-btn--pulse')

    // Retirer après l'animation
    button.addEventListener(
      'animationend',
      () => {
        button.classList.remove('like-btn--pulse')
      },
      { once: true }, // Listener supprimé automatiquement après
    )
  }

  /**
   * Émet un événement personnalisé de changement.
   *
   * @param {string} mediaId - L'ID du média.
   * @param {boolean} isLiked - Si le média est liké.
   * @private
   */
  _emitChange(mediaId, isLiked) {
    const event = new CustomEvent(LikeManager.CHANGE_EVENT, {
      detail: {
        mediaId,
        isLiked,
        totalLikes: this.getTotalLikes(),
      },
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  /**
   * Toggle le like d'un média.
   *
   * @param {string} mediaId - L'ID du média.
   * @returns {boolean} True si liké après le toggle.
   */
  toggle(mediaId) {
    if (this._likes[mediaId]) {
      delete this._likes[mediaId]
      return false
    } else {
      this._likes[mediaId] = true
      return true
    }
  }

  /**
   * Vérifie si un média est liké.
   *
   * @param {string} mediaId - L'ID du média.
   * @returns {boolean} True si liké.
   */
  isLiked(mediaId) {
    return !!this._likes[mediaId]
  }

  /**
   * Retourne le nombre total de likes.
   *
   * @returns {number} Le total.
   */
  getTotalLikes() {
    return Object.keys(this._likes).length
  }

  /**
   * Retourne tous les médias likés.
   *
   * @returns {string[]} Les IDs des médias likés.
   */
  getLikedMediaIds() {
    return Object.keys(this._likes)
  }

  /**
   * Écoute les changements de likes.
   *
   * @param {Function} callback - La fonction à appeler.
   * @returns {Function} Fonction pour arrêter l'écoute.
   */
  onChange(callback) {
    const handler = (e) => callback(e.detail)
    document.addEventListener(LikeManager.CHANGE_EVENT, handler)
    return () => document.removeEventListener(LikeManager.CHANGE_EVENT, handler)
  }

  /**
   * Crée un bouton like pour un média.
   *
   * @param {Object} media - Les données du média.
   * @param {string|number} media.id - L'ID du média.
   * @param {number} media.likes - Le nombre de likes de base.
   * @returns {HTMLElement} Le bouton créé.
   */
  createLikeButton(media) {
    const isLiked = this.isLiked(String(media.id))
    const totalLikes = media.likes + (isLiked ? 1 : 0)

    const button = document.createElement('button')
    button.type = 'button'
    button.classList.add('like-btn')
    if (isLiked) {
      button.classList.add('like-btn--liked')
    }

    // data-* attributes pour Event Delegation
    button.dataset.likeId = media.id
    button.dataset.baseLikes = media.likes

    // Accessibilité
    button.setAttribute('aria-label', `Liker ce média`)
    button.setAttribute('aria-pressed', isLiked.toString())

    // Contenu
    button.innerHTML = `
      <svg class="like-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span class="like-btn__count">${totalLikes}</span>
    `

    return button
  }
}
