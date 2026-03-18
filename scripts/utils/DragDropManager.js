/**
 * Gestionnaire de Drag & Drop (glisser-déposer).
 *
 * @description
 * Permet de réorganiser des éléments par glisser-déposer.
 *
 * CONCEPTS CLÉS : Événements de Drag & Drop
 *
 * Sur l'élément DRAGGABLE (qu'on déplace) :
 * - dragstart : Début du drag (configurer dataTransfer)
 * - drag : Pendant le drag (peu utilisé)
 * - dragend : Fin du drag (nettoyage)
 *
 * Sur la DROP ZONE (où on dépose) :
 * - dragenter : Un élément entre dans la zone
 * - dragover : Un élément survole la zone (DOIT appeler preventDefault!)
 * - dragleave : Un élément quitte la zone
 * - drop : Un élément est déposé
 *
 * CONCEPT : dataTransfer
 * Objet qui transporte les données pendant le drag.
 * Permet de passer des informations de dragstart à drop.
 */
class DragDropManager {
  /**
   * Crée une instance de DragDropManager.
   *
   * @param {Object} options - Options de configuration.
   * @param {HTMLElement} options.container - Le conteneur des éléments.
   * @param {string} options.itemSelector - Sélecteur des éléments draggables.
   * @param {Function} [options.onReorder] - Callback après réorganisation.
   * @param {string} [options.handleSelector] - Sélecteur de la poignée (optionnel).
   */
  constructor(options) {
    this._container = options.container
    this._itemSelector = options.itemSelector
    this._onReorder = options.onReorder || (() => {})
    this._handleSelector = options.handleSelector || null

    this._draggedElement = null
    this._placeholder = null
    this._initialOrder = []

    this._init()
  }

  /**
   * Initialise le drag & drop.
   * @private
   */
  _init() {
    // Rendre les éléments draggables
    this._setupDraggables()

    // Configurer la drop zone (le conteneur)
    this._setupDropZone()
  }

  /**
   * Configure les éléments draggables.
   *
   * @description
   * CONCEPT : attribut draggable="true"
   * Cet attribut HTML5 rend un élément draggable nativement.
   *
   * @private
   */
  _setupDraggables() {
    const items = this._container.querySelectorAll(this._itemSelector)

    items.forEach((item) => {
      this._makeDraggable(item)
    })

    // Observer les nouveaux éléments ajoutés
    this._setupMutationObserver()
  }

  /**
   * Rend un élément draggable.
   *
   * @param {HTMLElement} element - L'élément à rendre draggable.
   * @private
   */
  _makeDraggable(element) {
    // Rendre draggable
    element.setAttribute('draggable', 'true')
    element.classList.add('draggable')

    /**
     * CONCEPT : dragstart event
     *
     * Déclenché quand l'utilisateur commence à faire glisser.
     * C'est ici qu'on configure :
     * - dataTransfer.setData() : les données à transférer
     * - dataTransfer.effectAllowed : le type d'effet (move, copy, link)
     */
    element.addEventListener('dragstart', (e) => {
      this._handleDragStart(e, element)
    })

    /**
     * CONCEPT : dragend event
     *
     * Déclenché quand le drag se termine (drop ou annulation).
     * Utilisé pour nettoyer l'état visuel.
     */
    element.addEventListener('dragend', (e) => {
      this._handleDragEnd(e, element)
    })
  }

  /**
   * Configure la zone de drop (le conteneur).
   *
   * @description
   * IMPORTANT : dragover DOIT appeler preventDefault()
   * Sinon, le drop ne fonctionnera pas !
   *
   * @private
   */
  _setupDropZone() {
    /**
     * CONCEPT : dragover event
     *
     * Déclenché continuellement quand un élément survole la zone.
     * OBLIGATOIRE d'appeler preventDefault() pour permettre le drop.
     */
    this._container.addEventListener('dragover', (e) => {
      e.preventDefault() // CRUCIAL pour permettre le drop !
      this._handleDragOver(e)
    })

    /**
     * CONCEPT : dragenter event
     *
     * Déclenché une fois quand l'élément entre dans la zone.
     */
    this._container.addEventListener('dragenter', (e) => {
      e.preventDefault()
      this._handleDragEnter(e)
    })

    /**
     * CONCEPT : dragleave event
     *
     * Déclenché quand l'élément quitte la zone.
     */
    this._container.addEventListener('dragleave', (e) => {
      this._handleDragLeave(e)
    })

    /**
     * CONCEPT : drop event
     *
     * Déclenché quand l'élément est déposé.
     * On récupère les données avec dataTransfer.getData().
     */
    this._container.addEventListener('drop', (e) => {
      e.preventDefault()
      this._handleDrop(e)
    })
  }

  /**
   * Gère le début du drag.
   *
   * @param {DragEvent} e - L'événement drag.
   * @param {HTMLElement} element - L'élément draggé.
   * @private
   */
  _handleDragStart(e, element) {
    this._draggedElement = element

    // Sauvegarder l'ordre initial pour rollback éventuel
    this._saveInitialOrder()

    /**
     * CONCEPT : dataTransfer.setData()
     *
     * Stocke des données à récupérer lors du drop.
     * Le premier argument est le type MIME (text/plain, text/html, etc.)
     * Le second est la donnée (string uniquement).
     */
    e.dataTransfer.setData('text/plain', element.dataset.id || '')
    e.dataTransfer.effectAllowed = 'move'

    // Feedback visuel
    element.classList.add('draggable--dragging')

    // Créer un placeholder
    this._createPlaceholder(element)

    // Émettre un événement
    this._emit('dragstart', { element })
  }

  /**
   * Gère le survol pendant le drag.
   *
   * @param {DragEvent} e - L'événement drag.
   * @private
   */
  _handleDragOver(e) {
    if (!this._draggedElement) return

    // Trouver l'élément survolé
    const target = this._getDropTarget(e)

    if (target && target !== this._draggedElement) {
      // Déterminer si on insère avant ou après
      const rect = target.getBoundingClientRect()
      const midY = rect.top + rect.height / 2

      if (e.clientY < midY) {
        // Insérer AVANT
        target.parentNode.insertBefore(this._placeholder, target)
      } else {
        // Insérer APRÈS
        target.parentNode.insertBefore(this._placeholder, target.nextSibling)
      }
    }
  }

  /**
   * Gère l'entrée dans la drop zone.
   *
   * @param {DragEvent} e - L'événement drag.
   * @private
   */
  _handleDragEnter(e) {
    this._container.classList.add('drop-zone--active')
  }

  /**
   * Gère la sortie de la drop zone.
   *
   * @param {DragEvent} e - L'événement drag.
   * @private
   */
  _handleDragLeave(e) {
    // Vérifier qu'on quitte vraiment le conteneur (pas un enfant)
    if (!this._container.contains(e.relatedTarget)) {
      this._container.classList.remove('drop-zone--active')
    }
  }

  /**
   * Gère le drop (dépôt).
   *
   * @param {DragEvent} e - L'événement drag.
   * @private
   */
  _handleDrop(e) {
    if (!this._draggedElement || !this._placeholder) return

    /**
     * CONCEPT : dataTransfer.getData()
     *
     * Récupère les données définies dans dragstart.
     */
    const data = e.dataTransfer.getData('text/plain')

    // Insérer l'élément à la place du placeholder
    this._placeholder.parentNode.insertBefore(
      this._draggedElement,
      this._placeholder,
    )

    // Nettoyer
    this._cleanup()

    // Récupérer le nouvel ordre
    const newOrder = this._getCurrentOrder()

    // Callback avec le nouvel ordre
    this._onReorder(newOrder, this._initialOrder)

    // Émettre un événement
    this._emit('drop', { element: this._draggedElement, order: newOrder })
  }

  /**
   * Gère la fin du drag.
   *
   * @param {DragEvent} e - L'événement drag.
   * @param {HTMLElement} element - L'élément draggé.
   * @private
   */
  _handleDragEnd(e, element) {
    element.classList.remove('draggable--dragging')
    this._container.classList.remove('drop-zone--active')

    // Nettoyer si le drop n'a pas eu lieu
    if (this._placeholder) {
      this._cleanup()
    }

    this._emit('dragend', { element })
  }

  /**
   * Trouve l'élément cible sous le curseur.
   *
   * @param {DragEvent} e - L'événement drag.
   * @returns {HTMLElement|null} L'élément cible.
   * @private
   */
  _getDropTarget(e) {
    // Utiliser elementFromPoint pour trouver l'élément
    const elements = document.elementsFromPoint(e.clientX, e.clientY)

    // Trouver le premier élément qui match le sélecteur
    for (const el of elements) {
      if (el.matches(this._itemSelector) && el !== this._draggedElement) {
        return el
      }
    }

    return null
  }

  /**
   * Crée un placeholder pour visualiser la position de drop.
   *
   * @param {HTMLElement} element - L'élément draggé.
   * @private
   */
  _createPlaceholder(element) {
    this._placeholder = document.createElement('div')
    this._placeholder.classList.add('drag-placeholder')
    this._placeholder.style.width = `${element.offsetWidth}px`
    this._placeholder.style.height = `${element.offsetHeight}px`

    // Insérer après l'élément
    element.parentNode.insertBefore(this._placeholder, element.nextSibling)
  }

  /**
   * Sauvegarde l'ordre initial des éléments.
   * @private
   */
  _saveInitialOrder() {
    this._initialOrder = this._getCurrentOrder()
  }

  /**
   * Retourne l'ordre actuel des éléments.
   *
   * @returns {string[]} Les IDs dans l'ordre actuel.
   * @private
   */
  _getCurrentOrder() {
    const items = this._container.querySelectorAll(this._itemSelector)
    return Array.from(items).map((item) => item.dataset.id || '')
  }

  /**
   * Nettoie l'état après un drag.
   * @private
   */
  _cleanup() {
    if (this._placeholder) {
      this._placeholder.remove()
      this._placeholder = null
    }
    this._draggedElement = null
  }

  /**
   * Configure un MutationObserver pour les nouveaux éléments.
   * @private
   */
  _setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches(this._itemSelector)) {
            this._makeDraggable(node)
          }
        })
      })
    })

    observer.observe(this._container, { childList: true })
  }

  /**
   * Émet un événement personnalisé.
   *
   * @param {string} name - Nom de l'événement.
   * @param {Object} detail - Détails de l'événement.
   * @private
   */
  _emit(name, detail) {
    const event = new CustomEvent(`dragdrop-${name}`, {
      detail,
      bubbles: true,
    })
    this._container.dispatchEvent(event)
  }

  /**
   * Désactive le drag & drop.
   */
  disable() {
    const items = this._container.querySelectorAll(this._itemSelector)
    items.forEach((item) => {
      item.setAttribute('draggable', 'false')
      item.classList.remove('draggable')
    })
  }

  /**
   * Réactive le drag & drop.
   */
  enable() {
    this._setupDraggables()
  }

  /**
   * Définit l'ordre des éléments programmatiquement.
   *
   * @param {string[]} order - Les IDs dans l'ordre voulu.
   */
  setOrder(order) {
    order.forEach((id) => {
      const element = this._container.querySelector(`[data-id="${id}"]`)
      if (element) {
        this._container.appendChild(element)
      }
    })
  }
}
