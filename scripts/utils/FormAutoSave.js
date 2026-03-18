/**
 * Classe pour la sauvegarde automatique des formulaires dans sessionStorage.
 * Permet de restaurer les données en cas de rechargement de page.
 */
class FormAutoSave {
  /**
   * Crée une instance de FormAutoSave.
   * @param {string} formId - Identifiant unique pour le formulaire.
   * @param {Object} [options] - Options de configuration.
   * @param {number} [options.debounceDelay=500] - Délai de debounce en ms.
   * @param {Function} [options.onRestore] - Callback appelé après restauration.
   * @param {Function} [options.onSave] - Callback appelé après sauvegarde.
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
   * Enregistre un champ de formulaire pour l'auto-save.
   * @param {HTMLInputElement|HTMLTextAreaElement} $field - L'élément du champ.
   * @param {string} [name] - Nom du champ (utilise l'id ou name par défaut).
   */
  registerField($field, name = null) {
    const fieldName = name || $field.id || $field.name
    if (!fieldName) return

    this._fields.set(fieldName, $field)

    // Écouter les changements
    $field.addEventListener('input', () => this._debouncedSave())
    $field.addEventListener('blur', () => this._save())
  }

  /**
   * Enregistre tous les champs d'un formulaire.
   * @param {HTMLFormElement} $form - Le formulaire.
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
   * Restaure les données sauvegardées dans les champs.
   * @returns {boolean} True si des données ont été restaurées.
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
      console.warn('Erreur lors de la restauration du formulaire:', error)
      return false
    }
  }

  /**
   * Sauvegarde les données actuelles des champs.
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
      console.warn('Erreur lors de la sauvegarde du formulaire:', error)
    }
  }

  /**
   * Sauvegarde avec debounce.
   */
  _debouncedSave() {
    clearTimeout(this._timeoutId)
    this._timeoutId = setTimeout(() => this._save(), this._debounceDelay)
  }

  /**
   * Efface les données sauvegardées.
   */
  clear() {
    sessionStorage.removeItem(this._storageKey)
    this._hideIndicator()
  }

  /**
   * Vérifie si des données sont sauvegardées.
   * @returns {boolean} True si des données existent.
   */
  hasSavedData() {
    return sessionStorage.getItem(this._storageKey) !== null
  }

  /**
   * Récupère les données sauvegardées.
   * @returns {Object|null} Les données sauvegardées ou null.
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
   * Crée et attache un indicateur de sauvegarde.
   * @param {HTMLElement} $container - Conteneur pour l'indicateur.
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
   * Affiche l'indicateur de sauvegarde.
   */
  _showIndicator() {
    if (!this._$indicator) return

    this._$indicator.textContent = 'Brouillon sauvegardé'
    this._$indicator.style.opacity = '1'

    setTimeout(() => {
      this._$indicator.style.opacity = '0'
    }, 2000)
  }

  /**
   * Cache l'indicateur de sauvegarde.
   */
  _hideIndicator() {
    if (this._$indicator) {
      this._$indicator.style.opacity = '0'
    }
  }
}
