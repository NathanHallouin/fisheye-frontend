/**
 * Gestionnaire de raccourcis clavier.
 *
 * @description
 * Centralise tous les raccourcis clavier de l'application.
 *
 * CONCEPTS CLÉS :
 *
 * 1. KeyboardEvent
 *    - e.key : la touche pressée ('a', 'Enter', 'Escape', etc.)
 *    - e.code : le code physique de la touche ('KeyA', 'Enter', 'Escape')
 *    - e.ctrlKey, e.altKey, e.shiftKey, e.metaKey : modificateurs
 *
 * 2. Modificateurs
 *    - Ctrl (ctrlKey) : raccourcis standards (Ctrl+S, Ctrl+K)
 *    - Meta (metaKey) : Cmd sur Mac, Windows sur Windows
 *    - Alt (altKey) : raccourcis alternatifs
 *    - Shift (shiftKey) : inverser l'action (Shift+Tab)
 *
 * 3. preventDefault()
 *    - Empêche le comportement par défaut du navigateur
 *    - Ex: Ctrl+K ouvre la barre de recherche du navigateur, on le bloque
 *
 * 4. Event Capturing vs Bubbling
 *    - Capturing (capture: true) : descend du parent vers l'enfant
 *    - Bubbling (défaut) : remonte de l'enfant vers le parent
 *    - Pour les raccourcis globaux, on utilise capturing pour les intercepter tôt
 */
class KeyboardShortcutManager {
  /**
   * Instance unique (Singleton).
   * @type {KeyboardShortcutManager|null}
   */
  static _instance = null

  /**
   * Retourne l'instance unique du KeyboardShortcutManager.
   * @returns {KeyboardShortcutManager} L'instance unique.
   */
  static getInstance() {
    if (!KeyboardShortcutManager._instance) {
      KeyboardShortcutManager._instance = new KeyboardShortcutManager()
    }
    return KeyboardShortcutManager._instance
  }

  /**
   * Crée une instance de KeyboardShortcutManager.
   */
  constructor() {
    /**
     * Map des raccourcis enregistrés.
     * Clé: identifiant du raccourci (ex: 'ctrl+k')
     * Valeur: { handler, description, enabled }
     */
    this._shortcuts = new Map()

    /**
     * Contexte actif (permet de grouper les raccourcis).
     * Ex: 'global', 'lightbox', 'modal'
     */
    this._activeContext = 'global'

    /**
     * État de l'overlay d'aide.
     */
    this._helpOverlayVisible = false

    /**
     * Élément DOM de l'overlay d'aide.
     */
    this._helpOverlay = null

    // Initialiser le listener global
    this._init()
  }

  /**
   * Initialise le listener clavier global.
   *
   * @description
   * CONCEPT : Event Capturing
   *
   * On utilise { capture: true } pour intercepter les événements
   * AVANT qu'ils n'atteignent les éléments de la page.
   * Cela permet de capturer Ctrl+K avant que le navigateur
   * n'ouvre sa propre barre de recherche.
   *
   * @private
   */
  _init() {
    /**
     * CONCEPT : keydown vs keyup vs keypress
     *
     * - keydown : déclenché quand la touche est enfoncée (répété si maintenu)
     * - keyup : déclenché quand la touche est relâchée
     * - keypress : OBSOLÈTE, ne pas utiliser
     *
     * On utilise keydown pour les raccourcis car :
     * - Réponse immédiate à l'appui
     * - Supporte les touches de modification
     * - Peut être répété (pratique pour navigation J/K)
     */
    document.addEventListener(
      'keydown',
      (e) => this._handleKeydown(e),
      { capture: true }, // Capturer AVANT le bubbling
    )

    // Enregistrer les raccourcis par défaut
    this._registerDefaultShortcuts()
  }

  /**
   * Enregistre les raccourcis par défaut de l'application.
   * @private
   */
  _registerDefaultShortcuts() {
    // Raccourci d'aide (toujours disponible)
    this.register('?', {
      handler: () => this.toggleHelpOverlay(),
      description: "Afficher/masquer l'aide des raccourcis",
      context: 'global',
    })

    // Recherche
    this.register('ctrl+k', {
      handler: () => this._focusSearch(),
      description: 'Ouvrir la recherche',
      context: 'global',
    })

    // Escape - fermer les modales/lightbox
    this.register('Escape', {
      handler: () => this._handleEscape(),
      description: 'Fermer la modale/lightbox',
      context: 'global',
    })

    // Navigation médias (J/K comme Vim)
    this.register('j', {
      handler: () => this._navigateMedia('next'),
      description: 'Média suivant',
      context: 'gallery',
    })

    this.register('k', {
      handler: () => this._navigateMedia('prev'),
      description: 'Média précédent',
      context: 'gallery',
    })

    // Like
    this.register('l', {
      handler: () => this._likeCurrentMedia(),
      description: 'Liker le média courant',
      context: 'gallery',
    })

    // Lightbox navigation
    this.register('ArrowRight', {
      handler: () => this._lightboxNext(),
      description: 'Image suivante (lightbox)',
      context: 'lightbox',
    })

    this.register('ArrowLeft', {
      handler: () => this._lightboxPrev(),
      description: 'Image précédente (lightbox)',
      context: 'lightbox',
    })
  }

  /**
   * Gère l'événement keydown.
   *
   * @param {KeyboardEvent} e - L'événement clavier.
   * @private
   */
  _handleKeydown(e) {
    // Ignorer si on est dans un champ de saisie (sauf Escape)
    if (this._isInputFocused(e) && e.key !== 'Escape') {
      return
    }

    // Construire l'identifiant du raccourci
    const shortcutKey = this._buildShortcutKey(e)

    // Chercher le raccourci
    const shortcut = this._shortcuts.get(shortcutKey)

    if (shortcut && shortcut.enabled) {
      // Vérifier le contexte
      if (this._isContextActive(shortcut.context)) {
        /**
         * CONCEPT : preventDefault()
         *
         * Empêche le comportement par défaut du navigateur.
         * Ex: Ctrl+K ouvre normalement la barre d'adresse,
         * on veut notre propre comportement.
         */
        e.preventDefault()

        /**
         * CONCEPT : stopPropagation()
         *
         * Arrête la propagation de l'événement.
         * Empêche les autres listeners de recevoir l'événement.
         */
        e.stopPropagation()

        // Exécuter le handler
        shortcut.handler(e)
      }
    }
  }

  /**
   * Vérifie si un champ de saisie a le focus.
   *
   * @param {KeyboardEvent} e - L'événement clavier.
   * @returns {boolean} True si un input a le focus.
   * @private
   */
  _isInputFocused(e) {
    const target = e.target
    const tagName = target.tagName.toLowerCase()

    // Inputs, textareas, et éléments contenteditable
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    )
  }

  /**
   * Construit l'identifiant du raccourci à partir de l'événement.
   *
   * @description
   * CONCEPT : Normalisation des raccourcis
   *
   * On construit une chaîne normalisée comme 'ctrl+shift+k'
   * pour pouvoir la comparer avec les raccourcis enregistrés.
   *
   * @param {KeyboardEvent} e - L'événement clavier.
   * @returns {string} L'identifiant du raccourci.
   * @private
   */
  _buildShortcutKey(e) {
    const parts = []

    // Ajouter les modificateurs dans l'ordre
    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.altKey) parts.push('alt')
    if (e.shiftKey) parts.push('shift')

    // Ajouter la touche principale (en minuscule sauf touches spéciales)
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    parts.push(key)

    return parts.join('+')
  }

  /**
   * Vérifie si un contexte est actif.
   *
   * @param {string} context - Le contexte à vérifier.
   * @returns {boolean} True si le contexte est actif.
   * @private
   */
  _isContextActive(context) {
    // 'global' est toujours actif
    if (context === 'global') return true

    // Vérifier le contexte actif
    return context === this._activeContext
  }

  /**
   * Enregistre un nouveau raccourci.
   *
   * @param {string} key - L'identifiant du raccourci (ex: 'ctrl+k', 'Escape').
   * @param {Object} options - Options du raccourci.
   * @param {Function} options.handler - Fonction à exécuter.
   * @param {string} options.description - Description pour l'aide.
   * @param {string} [options.context='global'] - Contexte du raccourci.
   * @returns {Function} Fonction pour désinscrire le raccourci.
   *
   * @example
   * const unregister = shortcuts.register('ctrl+s', {
   *   handler: () => console.log('Save!'),
   *   description: 'Sauvegarder',
   *   context: 'editor'
   * })
   */
  register(key, options) {
    const normalizedKey = key.toLowerCase()

    this._shortcuts.set(normalizedKey, {
      handler: options.handler,
      description: options.description,
      context: options.context || 'global',
      enabled: true,
    })

    // Retourner une fonction de désinscription
    return () => this.unregister(normalizedKey)
  }

  /**
   * Désinscrit un raccourci.
   *
   * @param {string} key - L'identifiant du raccourci.
   */
  unregister(key) {
    this._shortcuts.delete(key.toLowerCase())
  }

  /**
   * Active ou désactive un raccourci.
   *
   * @param {string} key - L'identifiant du raccourci.
   * @param {boolean} enabled - État souhaité.
   */
  setEnabled(key, enabled) {
    const shortcut = this._shortcuts.get(key.toLowerCase())
    if (shortcut) {
      shortcut.enabled = enabled
    }
  }

  /**
   * Change le contexte actif.
   *
   * @param {string} context - Le nouveau contexte.
   */
  setContext(context) {
    this._activeContext = context
  }

  /**
   * Retourne au contexte global.
   */
  resetContext() {
    this._activeContext = 'global'
  }

  // ============================================
  // Handlers des raccourcis par défaut
  // ============================================

  /**
   * Focus le champ de recherche.
   * @private
   */
  _focusSearch() {
    const searchInput = document.querySelector('.search-bar__input')
    if (searchInput) {
      searchInput.focus()
      searchInput.select() // Sélectionner le texte existant
    }
  }

  /**
   * Gère la touche Escape.
   * @private
   */
  _handleEscape() {
    // Fermer l'overlay d'aide en premier
    if (this._helpOverlayVisible) {
      this.hideHelpOverlay()
      return
    }

    // Fermer la lightbox si ouverte
    if (window.lightbox && window.lightbox.close) {
      window.lightbox.close()
      return
    }

    // Fermer le modal de contact si ouvert
    const contactModal = document.querySelector('.contact-modal')
    if (contactModal && contactModal.style.display !== 'none') {
      // Chercher la fonction de fermeture
      const closeBtn = contactModal.querySelector('.contact-modal__close')
      if (closeBtn) closeBtn.click()
      return
    }

    // Défocus l'élément actif
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur()
    }
  }

  /**
   * Navigue entre les médias.
   *
   * @param {string} direction - 'next' ou 'prev'.
   * @private
   */
  _navigateMedia(direction) {
    const mediaCards = document.querySelectorAll('.media-card')
    if (mediaCards.length === 0) return

    // Trouver la carte actuellement focusée ou highlighted
    const currentIndex = this._getCurrentMediaIndex(mediaCards)

    let newIndex
    if (direction === 'next') {
      newIndex = currentIndex < mediaCards.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : mediaCards.length - 1
    }

    // Focus la nouvelle carte
    const newCard = mediaCards[newIndex]
    newCard.focus()
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Ajouter une classe pour le highlight visuel
    mediaCards.forEach((card) => card.classList.remove('media-card--focused'))
    newCard.classList.add('media-card--focused')
  }

  /**
   * Retourne l'index du média actuellement sélectionné.
   *
   * @param {NodeList} mediaCards - Liste des cartes média.
   * @returns {number} L'index courant.
   * @private
   */
  _getCurrentMediaIndex(mediaCards) {
    const focused = document.querySelector('.media-card--focused')
    if (focused) {
      return Array.from(mediaCards).indexOf(focused)
    }

    // Si aucun n'est focusé, retourner -1 pour commencer au début
    return -1
  }

  /**
   * Like le média actuellement sélectionné.
   * @private
   */
  _likeCurrentMedia() {
    const focusedCard = document.querySelector('.media-card--focused')
    if (focusedCard) {
      const likeBtn = focusedCard.querySelector('[data-like-id]')
      if (likeBtn) {
        likeBtn.click()
      }
    }
  }

  /**
   * Image suivante dans la lightbox.
   * @private
   */
  _lightboxNext() {
    if (window.lightbox && window.lightbox.next) {
      window.lightbox.next()
    }
  }

  /**
   * Image précédente dans la lightbox.
   * @private
   */
  _lightboxPrev() {
    if (window.lightbox && window.lightbox.prev) {
      window.lightbox.prev()
    }
  }

  // ============================================
  // Overlay d'aide
  // ============================================

  /**
   * Toggle l'affichage de l'overlay d'aide.
   */
  toggleHelpOverlay() {
    if (this._helpOverlayVisible) {
      this.hideHelpOverlay()
    } else {
      this.showHelpOverlay()
    }
  }

  /**
   * Affiche l'overlay d'aide avec tous les raccourcis.
   */
  showHelpOverlay() {
    if (!this._helpOverlay) {
      this._createHelpOverlay()
    }

    this._updateHelpContent()
    this._helpOverlay.classList.add('shortcut-help--visible')
    this._helpOverlayVisible = true

    // Focus l'overlay pour l'accessibilité
    this._helpOverlay.focus()
  }

  /**
   * Masque l'overlay d'aide.
   */
  hideHelpOverlay() {
    if (this._helpOverlay) {
      this._helpOverlay.classList.remove('shortcut-help--visible')
      this._helpOverlayVisible = false
    }
  }

  /**
   * Crée l'élément DOM de l'overlay d'aide.
   * @private
   */
  _createHelpOverlay() {
    this._helpOverlay = document.createElement('div')
    this._helpOverlay.classList.add('shortcut-help')
    this._helpOverlay.setAttribute('role', 'dialog')
    this._helpOverlay.setAttribute('aria-label', 'Raccourcis clavier')
    this._helpOverlay.setAttribute('tabindex', '-1')

    // Fermer en cliquant sur l'overlay
    this._helpOverlay.addEventListener('click', (e) => {
      if (e.target === this._helpOverlay) {
        this.hideHelpOverlay()
      }
    })

    document.body.appendChild(this._helpOverlay)
  }

  /**
   * Met à jour le contenu de l'overlay d'aide.
   * @private
   */
  _updateHelpContent() {
    // Grouper les raccourcis par contexte
    const byContext = new Map()

    this._shortcuts.forEach((shortcut, key) => {
      if (!byContext.has(shortcut.context)) {
        byContext.set(shortcut.context, [])
      }
      byContext.get(shortcut.context).push({ key, ...shortcut })
    })

    // Générer le HTML
    let html = `
      <div class="shortcut-help__content">
        <h2 class="shortcut-help__title">Raccourcis clavier</h2>
        <button class="shortcut-help__close" aria-label="Fermer">&times;</button>
    `

    const contextNames = {
      global: 'Global',
      gallery: 'Galerie',
      lightbox: 'Lightbox',
    }

    byContext.forEach((shortcuts, context) => {
      html += `
        <section class="shortcut-help__section">
          <h3 class="shortcut-help__section-title">${contextNames[context] || context}</h3>
          <dl class="shortcut-help__list">
      `

      shortcuts.forEach((shortcut) => {
        const keyDisplay = this._formatKeyForDisplay(shortcut.key)
        html += `
          <div class="shortcut-help__item">
            <dt class="shortcut-help__key">${keyDisplay}</dt>
            <dd class="shortcut-help__description">${shortcut.description}</dd>
          </div>
        `
      })

      html += `
          </dl>
        </section>
      `
    })

    html += `
        <p class="shortcut-help__hint">Appuyez sur <kbd>?</kbd> pour fermer</p>
      </div>
    `

    this._helpOverlay.innerHTML = html

    // Attacher le listener de fermeture
    const closeBtn = this._helpOverlay.querySelector('.shortcut-help__close')
    closeBtn.addEventListener('click', () => this.hideHelpOverlay())
  }

  /**
   * Formate une touche pour l'affichage.
   *
   * @param {string} key - L'identifiant du raccourci.
   * @returns {string} HTML formaté pour affichage.
   * @private
   */
  _formatKeyForDisplay(key) {
    const parts = key.split('+')

    return parts
      .map((part) => {
        // Remplacer les noms par des symboles ou noms lisibles
        const displayMap = {
          ctrl: 'Ctrl',
          alt: 'Alt',
          shift: 'Shift',
          arrowright: '→',
          arrowleft: '←',
          arrowup: '↑',
          arrowdown: '↓',
          escape: 'Esc',
          enter: '↵',
          ' ': 'Espace',
        }
        const display = displayMap[part] || part.toUpperCase()
        return `<kbd>${display}</kbd>`
      })
      .join(' + ')
  }

  /**
   * Retourne tous les raccourcis enregistrés.
   *
   * @returns {Map} Map des raccourcis.
   */
  getShortcuts() {
    return new Map(this._shortcuts)
  }
}
