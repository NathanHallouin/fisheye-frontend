/**
 * Classe représentant un formulaire de contact affiché dans une modale.
 * Inclut la validation en temps réel et l'auto-sauvegarde.
 */
class ContactForm {
  /**
   * Configuration de validation pour chaque champ.
   */
  static VALIDATION_RULES = {
    prenom: [
      { rule: 'required' },
      { rule: 'name' },
      { rule: 'minLength', params: 2 }
    ],
    nom: [
      { rule: 'required' },
      { rule: 'name' },
      { rule: 'minLength', params: 2 }
    ],
    email: [
      { rule: 'required' },
      { rule: 'email' }
    ],
    message: [
      { rule: 'required' },
      { rule: 'minLength', params: 10, message: 'Le message doit contenir au moins 10 caractères' }
    ]
  }

  /**
   * Crée une instance de ContactForm.
   * @param {string} userData - Le nom du photographe ou de l'utilisateur à contacter.
   */
  constructor(userData) {
    this._userData = userData
    this.$wrapper = document.createElement('div')
    this.$wrapper.classList.add('contact-modal')
    this.$body = document.querySelector('body')
    this.$insertDom = document.querySelector('.body-container')
    this.$mainDom = document.querySelector('main')
    this._fieldErrors = new Map()
    this._formAutoSave = null
    this.createForm()
    this._initAutoSave()
  }

  /**
   * Attache l'instance du formulaire de contact à l'objet global window.
   */
  attachWindow() {
    window.contactForm = this
  }

  /**
   * Crée et insère le DOM du formulaire de contact dans la page.
   */
  createForm() {
    const modal = document.createElement('div')
    modal.classList.add('modal')
    modal.setAttribute('role', 'document')
    const header = document.createElement('header')
    header.classList.add('modal-header')
    const h2 = document.createElement('h2')
    h2.id = 'modalTitle'
    h2.classList.add('modal-title')
    h2.innerHTML = `Contactez-moi <br> ${this._userData}`
    const closeBtn = document.createElement('button')
    closeBtn.onclick = () => contactForm.closeModal()
    closeBtn.classList.add('modal-close')
    closeBtn.setAttribute('aria-label', 'Fermer')
    const spanClose = document.createElement('span')
    spanClose.classList.add('sr-only')
    spanClose.textContent = 'Fermer le formulaire de contact'
    closeBtn.appendChild(spanClose)
    header.appendChild(h2)
    header.appendChild(closeBtn)
    const form = document.createElement('form')
    form.method = 'post'
    form.action = '#'
    form.classList.add('modal-form')
    form.onsubmit = (e) => contactForm.validate(e)
    const fieldset = document.createElement('fieldset')
    fieldset.classList.add('modal-fieldset')
    // Champ Prénom
    const fieldPrenom = this._createField('prenom', 'Prénom', 'text', 'given-name')

    // Champ Nom
    const fieldNom = this._createField('nom', 'Nom', 'text', 'family-name')

    // Champ Email
    const fieldEmail = this._createField('email', 'Email', 'email', 'email')

    // Champ Message
    const fieldMessage = this._createTextareaField('message', 'Message')

    fieldset.appendChild(fieldPrenom)
    fieldset.appendChild(fieldNom)
    fieldset.appendChild(fieldEmail)
    fieldset.appendChild(fieldMessage)
    const btnSubmit = document.createElement('button')
    btnSubmit.type = 'submit'
    btnSubmit.classList.add('modal-submit')
    btnSubmit.textContent = 'Envoyer'
    form.appendChild(fieldset)
    form.appendChild(btnSubmit)
    modal.appendChild(header)
    modal.appendChild(form)
    this.$wrapper.innerHTML = ''
    this.$wrapper.appendChild(modal)
    this.$wrapper.id = 'contact-modal'
    this.$wrapper.role = 'dialog'
    this.$wrapper.setAttribute('aria-labelledby', 'modalTitle')
    this.$wrapper.setAttribute('aria-label', 'Modal de contacte')
    this.$wrapper.setAttribute('tabindex', '-1')
    this.$wrapper.setAttribute('aria-hidden', 'true')
    this.$wrapper.style.display = 'none'
    this.$body.appendChild(this.$wrapper)
  }

  /**
   * Affiche la modale du formulaire de contact.
   */
  displayModal() {
    const $modal = document.getElementById('contact-modal')
    $modal.style.display = 'block'
    this.$insertDom.setAttribute('aria-hidden', 'true')
    const $modalDom = document.querySelector('.contact-modal')
    $modalDom.setAttribute('aria-hidden', 'false')
    const closeBtn = document.querySelector('.modal-close')
    closeBtn.focus()
    const classThis = this
    document.addEventListener('keydown', function (e) {
      const modal = document.getElementById('contact-modal')
      if (modal.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') {
        classThis.closeModal()
      }
    })
    this.focusModal($modal)

    // Setup auto-save après l'ouverture
    this._setupAutoSave()
  }

  /**
   * Gère le focus cyclique dans la modale pour l'accessibilité.
   * @param {HTMLElement} $modal - L'élément modal à gérer.
   */
  focusModal($modal) {
    const focusElements = $modal.querySelectorAll('button, input')
    const focusElementsArray = Array.from(focusElements)
    const firstFocusElement = focusElementsArray[0]
    const lastFocusElement = focusElementsArray[focusElementsArray.length - 1]
    $modal.addEventListener('keydown', function (e) {
      const isTabPressed = e.key === 'Tab' || e.keyCode === 9
      if (!isTabPressed) {
        return
      }
      if (e.shiftKey) {
        if (document.activeElement === firstFocusElement) {
          e.preventDefault()
          lastFocusElement.focus()
        }
      } else {
        if (document.activeElement === lastFocusElement) {
          e.preventDefault()
          firstFocusElement.focus()
        }
      }
    })
  }

  /**
   * Ferme la modale du formulaire de contact et rend le contenu principal accessible.
   */
  closeModal() {
    const modal = document.getElementById('contact-modal')
    modal.style.display = 'none'
    this.$insertDom.setAttribute('aria-hidden', 'false')
    const $modalDom = document.querySelector('.contact-modal')
    $modalDom.setAttribute('aria-hidden', 'true')
    const openBtn = document.querySelector('.contact-button')
    openBtn.focus()
  }

  /**
   * Récupère les valeurs saisies dans le formulaire de contact.
   * @returns {{getPrenom: string, getNom: string, getEmail: string, getMessage: string}} Les données du formulaire.
   */
  getDataInput() {
    const getPrenom = document.querySelector('#prenom').value
    const getNom = document.querySelector('#nom').value
    const getEmail = document.querySelector('#email').value
    const getMessage = document.querySelector('#message').value
    return { getPrenom, getNom, getEmail, getMessage }
  }

  /**
   * Réinitialise les champs du formulaire de contact.
   */
  deleteDataInput() {
    document.querySelectorAll('.modal-input').forEach((e) => {
      e.value = ''
    })
    const textareaValue = document.querySelector('.modal-textarea')
    textareaValue.value = ''
  }

  /**
   * Valide le formulaire, affiche les données dans la console et réinitialise le formulaire.
   * @param {Event} event - L'événement de soumission du formulaire.
   */
  validate(event) {
    event.preventDefault()

    // Valider tous les champs avant soumission
    const isValid = this._validateAllFields()
    if (!isValid) {
      return
    }

    this.closeModal()
    const data = this.getDataInput()
    console.log(`Prénom: ${data.getPrenom}`)
    console.log(`Nom: ${data.getNom}`)
    console.log(`Email: ${data.getEmail}`)
    console.log(`Message: ${data.getMessage}`)
    console.log('Envoyé')

    // Effacer les données et le brouillon
    this.deleteDataInput()
    if (this._formAutoSave) {
      this._formAutoSave.clear()
    }

    // Afficher une notification de succès
    this._showSuccessToast()
  }

  /**
   * Crée un champ de formulaire avec label et conteneur d'erreur.
   * @param {string} id - L'identifiant du champ.
   * @param {string} labelText - Le texte du label.
   * @param {string} type - Le type d'input.
   * @param {string} autocomplete - La valeur d'autocomplete.
   * @returns {HTMLElement} Le conteneur du champ.
   */
  _createField(id, labelText, type, autocomplete) {
    const wrapper = document.createElement('div')
    wrapper.classList.add('modal-field')

    const label = document.createElement('label')
    label.htmlFor = id
    label.classList.add('modal-label')
    label.textContent = labelText

    const input = document.createElement('input')
    input.type = type
    input.name = id
    input.id = id
    input.classList.add('modal-input')
    input.setAttribute('aria-describedby', `${id}-error`)
    input.autocomplete = autocomplete

    // Validation en temps réel
    input.addEventListener('blur', () => this._validateField(id, input.value))
    input.addEventListener('input', () => {
      if (this._fieldErrors.has(id)) {
        this._validateField(id, input.value)
      }
    })

    const error = document.createElement('span')
    error.id = `${id}-error`
    error.classList.add('modal-error')
    error.setAttribute('aria-live', 'polite')

    wrapper.appendChild(label)
    wrapper.appendChild(input)
    wrapper.appendChild(error)

    return wrapper
  }

  /**
   * Crée un champ textarea avec label et conteneur d'erreur.
   * @param {string} id - L'identifiant du champ.
   * @param {string} labelText - Le texte du label.
   * @returns {HTMLElement} Le conteneur du champ.
   */
  _createTextareaField(id, labelText) {
    const wrapper = document.createElement('div')
    wrapper.classList.add('modal-field', 'modal-message')

    const label = document.createElement('label')
    label.htmlFor = id
    label.classList.add('modal-label')
    label.textContent = labelText

    const textarea = document.createElement('textarea')
    textarea.name = id
    textarea.id = id
    textarea.classList.add('modal-textarea')
    textarea.setAttribute('aria-describedby', `${id}-error`)

    // Validation en temps réel
    textarea.addEventListener('blur', () => this._validateField(id, textarea.value))
    textarea.addEventListener('input', () => {
      if (this._fieldErrors.has(id)) {
        this._validateField(id, textarea.value)
      }
    })

    const error = document.createElement('span')
    error.id = `${id}-error`
    error.classList.add('modal-error')
    error.setAttribute('aria-live', 'polite')

    wrapper.appendChild(label)
    wrapper.appendChild(textarea)
    wrapper.appendChild(error)

    return wrapper
  }

  /**
   * Valide un champ individuel.
   * @param {string} fieldId - L'identifiant du champ.
   * @param {string} value - La valeur du champ.
   * @returns {boolean} True si valide.
   */
  _validateField(fieldId, value) {
    const rules = ContactForm.VALIDATION_RULES[fieldId]
    if (!rules) return true

    // Vérifier si Validator est disponible
    if (typeof Validator === 'undefined') {
      return true
    }

    const result = Validator.validate(value, rules)
    const $input = document.getElementById(fieldId)
    const $error = document.getElementById(`${fieldId}-error`)

    if (!result.valid) {
      $input.classList.add('modal-input--error')
      $input.setAttribute('aria-invalid', 'true')
      $error.textContent = result.message
      this._fieldErrors.set(fieldId, result.message)
      return false
    } else {
      $input.classList.remove('modal-input--error')
      $input.removeAttribute('aria-invalid')
      $error.textContent = ''
      this._fieldErrors.delete(fieldId)
      return true
    }
  }

  /**
   * Valide tous les champs du formulaire.
   * @returns {boolean} True si tous les champs sont valides.
   */
  _validateAllFields() {
    let isValid = true
    const fields = ['prenom', 'nom', 'email', 'message']

    for (const fieldId of fields) {
      const $field = document.getElementById(fieldId)
      if ($field && !this._validateField(fieldId, $field.value)) {
        isValid = false
      }
    }

    // Focus sur le premier champ en erreur
    if (!isValid) {
      const firstError = fields.find((id) => this._fieldErrors.has(id))
      if (firstError) {
        document.getElementById(firstError).focus()
      }
    }

    return isValid
  }

  /**
   * Initialise l'auto-sauvegarde du formulaire.
   */
  _initAutoSave() {
    // Vérifier si FormAutoSave est disponible
    if (typeof FormAutoSave === 'undefined') {
      return
    }

    this._formAutoSave = new FormAutoSave('contact', {
      debounceDelay: 500,
      onSave: () => {
        console.log('Brouillon sauvegardé')
      }
    })
  }

  /**
   * Configure l'auto-sauvegarde après l'ouverture du modal.
   */
  _setupAutoSave() {
    if (!this._formAutoSave) return

    const $form = this.$wrapper.querySelector('form')
    if ($form) {
      this._formAutoSave.registerForm($form)

      // Créer l'indicateur de sauvegarde
      const $fieldset = $form.querySelector('fieldset')
      if ($fieldset) {
        this._formAutoSave.createIndicator($fieldset)
      }

      // Restaurer les données sauvegardées
      if (this._formAutoSave.hasSavedData()) {
        this._formAutoSave.restore()
      }
    }
  }

  /**
   * Affiche un toast de succès.
   */
  _showSuccessToast() {
    if (typeof Toast !== 'undefined') {
      Toast.show('Message envoyé avec succès!', 'success')
    }
  }
}
