/**
 * Drag & Drop Manager.
 *
 * @description
 * Allows reorganizing elements by drag and drop.
 *
 * KEY CONCEPTS: Drag & Drop Events
 *
 * On the DRAGGABLE element (what we move):
 * - dragstart: Start of drag (configure dataTransfer)
 * - drag: During drag (rarely used)
 * - dragend: End of drag (cleanup)
 *
 * On the DROP ZONE (where we drop):
 * - dragenter: An element enters the zone
 * - dragover: An element hovers over the zone (MUST call preventDefault!)
 * - dragleave: An element leaves the zone
 * - drop: An element is dropped
 *
 * CONCEPT: dataTransfer
 * Object that carries data during drag.
 * Allows passing information from dragstart to drop.
 */
class DragDropManager {
  /**
   * Creates a DragDropManager instance.
   *
   * @param {Object} options - Configuration options.
   * @param {HTMLElement} options.container - The element container.
   * @param {string} options.itemSelector - Selector for draggable elements.
   * @param {Function} [options.onReorder] - Callback after reordering.
   * @param {string} [options.handleSelector] - Handle selector (optional).
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
   * Initializes drag & drop.
   * @private
   */
  _init() {
    // Make elements draggable
    this._setupDraggables()

    // Configure the drop zone (the container)
    this._setupDropZone()
  }

  /**
   * Configures draggable elements.
   *
   * @description
   * CONCEPT: draggable="true" attribute
   * This HTML5 attribute makes an element natively draggable.
   *
   * @private
   */
  _setupDraggables() {
    const items = this._container.querySelectorAll(this._itemSelector)

    items.forEach((item) => {
      this._makeDraggable(item)
    })

    // Observe new elements added
    this._setupMutationObserver()
  }

  /**
   * Makes an element draggable.
   *
   * @param {HTMLElement} element - The element to make draggable.
   * @private
   */
  _makeDraggable(element) {
    // Make draggable
    element.setAttribute('draggable', 'true')
    element.classList.add('draggable')

    /**
     * CONCEPT: dragstart event
     *
     * Triggered when the user starts dragging.
     * This is where we configure:
     * - dataTransfer.setData(): the data to transfer
     * - dataTransfer.effectAllowed: the effect type (move, copy, link)
     */
    element.addEventListener('dragstart', (e) => {
      this._handleDragStart(e, element)
    })

    /**
     * CONCEPT: dragend event
     *
     * Triggered when the drag ends (drop or cancellation).
     * Used to clean up the visual state.
     */
    element.addEventListener('dragend', (e) => {
      this._handleDragEnd(e, element)
    })
  }

  /**
   * Configures the drop zone (the container).
   *
   * @description
   * IMPORTANT: dragover MUST call preventDefault()
   * Otherwise, drop won't work!
   *
   * @private
   */
  _setupDropZone() {
    /**
     * CONCEPT: dragover event
     *
     * Triggered continuously when an element hovers over the zone.
     * MANDATORY to call preventDefault() to allow drop.
     */
    this._container.addEventListener('dragover', (e) => {
      e.preventDefault() // CRUCIAL to allow drop!
      this._handleDragOver(e)
    })

    /**
     * CONCEPT: dragenter event
     *
     * Triggered once when the element enters the zone.
     */
    this._container.addEventListener('dragenter', (e) => {
      e.preventDefault()
      this._handleDragEnter(e)
    })

    /**
     * CONCEPT: dragleave event
     *
     * Triggered when the element leaves the zone.
     */
    this._container.addEventListener('dragleave', (e) => {
      this._handleDragLeave(e)
    })

    /**
     * CONCEPT: drop event
     *
     * Triggered when the element is dropped.
     * We retrieve the data with dataTransfer.getData().
     */
    this._container.addEventListener('drop', (e) => {
      e.preventDefault()
      this._handleDrop(e)
    })
  }

  /**
   * Handles drag start.
   *
   * @param {DragEvent} e - The drag event.
   * @param {HTMLElement} element - The dragged element.
   * @private
   */
  _handleDragStart(e, element) {
    this._draggedElement = element

    // Save initial order for potential rollback
    this._saveInitialOrder()

    /**
     * CONCEPT: dataTransfer.setData()
     *
     * Stores data to retrieve during drop.
     * First argument is the MIME type (text/plain, text/html, etc.)
     * Second is the data (string only).
     */
    e.dataTransfer.setData('text/plain', element.dataset.id || '')
    e.dataTransfer.effectAllowed = 'move'

    // Visual feedback
    element.classList.add('draggable--dragging')

    // Create a placeholder
    this._createPlaceholder(element)

    // Emit an event
    this._emit('dragstart', { element })
  }

  /**
   * Handles hovering during drag.
   *
   * @param {DragEvent} e - The drag event.
   * @private
   */
  _handleDragOver(e) {
    if (!this._draggedElement) return

    // Find the hovered element
    const target = this._getDropTarget(e)

    if (target && target !== this._draggedElement) {
      // Determine if we insert before or after
      const rect = target.getBoundingClientRect()
      const midY = rect.top + rect.height / 2

      if (e.clientY < midY) {
        // Insert BEFORE
        target.parentNode.insertBefore(this._placeholder, target)
      } else {
        // Insert AFTER
        target.parentNode.insertBefore(this._placeholder, target.nextSibling)
      }
    }
  }

  /**
   * Handles entering the drop zone.
   *
   * @param {DragEvent} e - The drag event.
   * @private
   */
  _handleDragEnter(e) {
    this._container.classList.add('drop-zone--active')
  }

  /**
   * Handles leaving the drop zone.
   *
   * @param {DragEvent} e - The drag event.
   * @private
   */
  _handleDragLeave(e) {
    // Verify we're actually leaving the container (not a child)
    if (!this._container.contains(e.relatedTarget)) {
      this._container.classList.remove('drop-zone--active')
    }
  }

  /**
   * Handles drop.
   *
   * @param {DragEvent} e - The drag event.
   * @private
   */
  _handleDrop(e) {
    if (!this._draggedElement || !this._placeholder) return

    /**
     * CONCEPT: dataTransfer.getData()
     *
     * Retrieves the data defined in dragstart.
     */
    const data = e.dataTransfer.getData('text/plain')

    // Insert the element at the placeholder's position
    this._placeholder.parentNode.insertBefore(
      this._draggedElement,
      this._placeholder,
    )

    // Cleanup
    this._cleanup()

    // Get the new order
    const newOrder = this._getCurrentOrder()

    // Callback with the new order
    this._onReorder(newOrder, this._initialOrder)

    // Emit an event
    this._emit('drop', { element: this._draggedElement, order: newOrder })
  }

  /**
   * Handles drag end.
   *
   * @param {DragEvent} e - The drag event.
   * @param {HTMLElement} element - The dragged element.
   * @private
   */
  _handleDragEnd(e, element) {
    element.classList.remove('draggable--dragging')
    this._container.classList.remove('drop-zone--active')

    // Cleanup if drop didn't occur
    if (this._placeholder) {
      this._cleanup()
    }

    this._emit('dragend', { element })
  }

  /**
   * Finds the target element under the cursor.
   *
   * @param {DragEvent} e - The drag event.
   * @returns {HTMLElement|null} The target element.
   * @private
   */
  _getDropTarget(e) {
    // Use elementFromPoint to find the element
    const elements = document.elementsFromPoint(e.clientX, e.clientY)

    // Find the first element that matches the selector
    for (const el of elements) {
      if (el.matches(this._itemSelector) && el !== this._draggedElement) {
        return el
      }
    }

    return null
  }

  /**
   * Creates a placeholder to visualize the drop position.
   *
   * @param {HTMLElement} element - The dragged element.
   * @private
   */
  _createPlaceholder(element) {
    this._placeholder = document.createElement('div')
    this._placeholder.classList.add('drag-placeholder')
    this._placeholder.style.width = `${element.offsetWidth}px`
    this._placeholder.style.height = `${element.offsetHeight}px`

    // Insert after the element
    element.parentNode.insertBefore(this._placeholder, element.nextSibling)
  }

  /**
   * Saves the initial order of elements.
   * @private
   */
  _saveInitialOrder() {
    this._initialOrder = this._getCurrentOrder()
  }

  /**
   * Returns the current order of elements.
   *
   * @returns {string[]} The IDs in current order.
   * @private
   */
  _getCurrentOrder() {
    const items = this._container.querySelectorAll(this._itemSelector)
    return Array.from(items).map((item) => item.dataset.id || '')
  }

  /**
   * Cleans up state after a drag.
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
   * Configures a MutationObserver for new elements.
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
   * Emits a custom event.
   *
   * @param {string} name - Event name.
   * @param {Object} detail - Event details.
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
   * Disables drag & drop.
   */
  disable() {
    const items = this._container.querySelectorAll(this._itemSelector)
    items.forEach((item) => {
      item.setAttribute('draggable', 'false')
      item.classList.remove('draggable')
    })
  }

  /**
   * Re-enables drag & drop.
   */
  enable() {
    this._setupDraggables()
  }

  /**
   * Sets the order of elements programmatically.
   *
   * @param {string[]} order - The IDs in desired order.
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
