/**
 * Class for automatic form saving in sessionStorage.
 * Allows restoring data in case of page reload.
 */
class FormAutoSave {
  /**
   * Creates an instance of FormAutoSave.
   * @param {string} formId - Unique identifier for the form.
   * @param {Object} [options] - Configuration options.
   * @param {number} [options.debounceDelay=500] - Debounce delay in ms.
   * @param {Function} [options.onRestore] - Callback called after restoration.
   * @param {Function} [options.onSave] - Callback called after saving.
   */
  constructor(formId, options = {}) {
    this._formId = formId
    this._storageKey = `fisheye_form_${formId}`
    this._debounceDelay = options.debounceDelay || 500
    this._onRestore = options.onRestore || null
    this._onSave = options.onSave || null
    this._timeoutId = null
    this._fields = new Map()
    this._$indicator = null
  }

  /**
   * Registers a form field for auto-save.
   * @param {HTMLInputElement|HTMLTextAreaElement} $field - The field element.
   * @param {string} [name] - Field name (uses id or name by default).
   */
  registerField($field, name = null) {
    const fieldName = name || $field.id || $field.name
    if (!fieldName) return

    this._fields.set(fieldName, $field)

    // Listen for changes
    $field.addEventListener('input', () => this._debouncedSave())
    $field.addEventListener('blur', () => this._save())
  }

  /**
   * Registers all fields of a form.
   * @param {HTMLFormElement} $form - The form.
   */
  registerForm($form) {
    const inputs = $form.querySelectorAll('input, textarea, select')
    inputs.forEach(($input) => {
      if ($input.type !== 'submit' && $input.type !== 'button') {
        this.registerField($input)
      }
    })
  }

  /**
   * Restores saved data into the fields.
   * @returns {boolean} True if data was restored.
   */
  restore() {
    try {
      const data = sessionStorage.getItem(this._storageKey)
      if (!data) return false

      const savedData = JSON.parse(data)
      let hasRestored = false

      for (const [fieldName, value] of Object.entries(savedData.fields)) {
        const $field = this._fields.get(fieldName)
        if ($field && value) {
          $field.value = value
          hasRestored = true
        }
      }

      if (hasRestored && this._onRestore) {
        this._onRestore(savedData)
      }

      return hasRestored
    } catch (error) {
      console.warn('Error restoring form:', error)
      return false
    }
  }

  /**
   * Saves the current field data.
   */
  _save() {
    try {
      const fields = {}
      let hasData = false

      for (const [name, $field] of this._fields) {
        const value = $field.value.trim()
        if (value) {
          fields[name] = value
          hasData = true
        }
      }

      if (hasData) {
        const data = {
          fields,
          timestamp: Date.now()
        }
        sessionStorage.setItem(this._storageKey, JSON.stringify(data))

        if (this._onSave) {
          this._onSave(data)
        }

        this._showIndicator()
      }
    } catch (error) {
      console.warn('Error saving form:', error)
    }
  }

  /**
   * Saves with debounce.
   */
  _debouncedSave() {
    clearTimeout(this._timeoutId)
    this._timeoutId = setTimeout(() => this._save(), this._debounceDelay)
  }

  /**
   * Clears the saved data.
   */
  clear() {
    sessionStorage.removeItem(this._storageKey)
    this._hideIndicator()
  }

  /**
   * Checks if data is saved.
   * @returns {boolean} True if data exists.
   */
  hasSavedData() {
    return sessionStorage.getItem(this._storageKey) !== null
  }

  /**
   * Retrieves the saved data.
   * @returns {Object|null} The saved data or null.
   */
  getSavedData() {
    try {
      const data = sessionStorage.getItem(this._storageKey)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * Creates and attaches a save indicator.
   * @param {HTMLElement} $container - Container for the indicator.
   */
  createIndicator($container) {
    this._$indicator = document.createElement('span')
    this._$indicator.classList.add('form-autosave-indicator')
    this._$indicator.setAttribute('aria-live', 'polite')
    this._$indicator.style.cssText = `
      font-size: var(--text-xs, 0.75rem);
      color: hsl(var(--muted-foreground, 240 3.8% 46.1%));
      opacity: 0;
      transition: opacity 0.3s ease;
    `
    $container.appendChild(this._$indicator)
  }

  /**
   * Shows the save indicator.
   */
  _showIndicator() {
    if (!this._$indicator) return

    this._$indicator.textContent = 'Draft saved'
    this._$indicator.style.opacity = '1'

    setTimeout(() => {
      this._$indicator.style.opacity = '0'
    }, 2000)
  }

  /**
   * Hides the save indicator.
   */
  _hideIndicator() {
    if (this._$indicator) {
      this._$indicator.style.opacity = '0'
    }
  }
}
