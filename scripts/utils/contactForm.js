/**
 * Class representing a contact form displayed in a modal.
 * Includes real-time validation and auto-save.
 */
class ContactForm {
  /**
   * Validation configuration for each field.
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
   * Creates an instance of ContactForm.
   * @param {string} userData - The name of the photographer or user to contact.
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
   * Attaches the contact form instance to the global window object.
   */
  attachWindow() {
    window.contactForm = this
  }

  /**
   * Creates and inserts the contact form DOM into the page.
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
    // First Name field
    const fieldPrenom = this._createField('prenom', 'Prénom', 'text', 'given-name')

    // Last Name field
    const fieldNom = this._createField('nom', 'Nom', 'text', 'family-name')

    // Email field
    const fieldEmail = this._createField('email', 'Email', 'email', 'email')

    // Message field
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
   * Displays the contact form modal.
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

    // Setup auto-save after opening
    this._setupAutoSave()
  }

  /**
   * Handles cyclic focus within the modal for accessibility.
   * @param {HTMLElement} $modal - The modal element to manage.
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
   * Closes the contact form modal and makes the main content accessible.
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
   * Retrieves the values entered in the contact form.
   * @returns {{getPrenom: string, getNom: string, getEmail: string, getMessage: string}} The form data.
   */
  getDataInput() {
    const getPrenom = document.querySelector('#prenom').value
    const getNom = document.querySelector('#nom').value
    const getEmail = document.querySelector('#email').value
    const getMessage = document.querySelector('#message').value
    return { getPrenom, getNom, getEmail, getMessage }
  }

  /**
   * Resets the contact form fields.
   */
  deleteDataInput() {
    document.querySelectorAll('.modal-input').forEach((e) => {
      e.value = ''
    })
    const textareaValue = document.querySelector('.modal-textarea')
    textareaValue.value = ''
  }

  /**
   * Validates the form, logs the data to the console and resets the form.
   * @param {Event} event - The form submission event.
   */
  validate(event) {
    event.preventDefault()

    // Validate all fields before submission
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

    // Clear data and draft
    this.deleteDataInput()
    if (this._formAutoSave) {
      this._formAutoSave.clear()
    }

    // Show success notification
    this._showSuccessToast()
  }

  /**
   * Creates a form field with label and error container.
   * @param {string} id - The field identifier.
   * @param {string} labelText - The label text.
   * @param {string} type - The input type.
   * @param {string} autocomplete - The autocomplete value.
   * @returns {HTMLElement} The field container.
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

    // Real-time validation
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
   * Creates a textarea field with label and error container.
   * @param {string} id - The field identifier.
   * @param {string} labelText - The label text.
   * @returns {HTMLElement} The field container.
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

    // Real-time validation
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
   * Validates an individual field.
   * @param {string} fieldId - The field identifier.
   * @param {string} value - The field value.
   * @returns {boolean} True if valid.
   */
  _validateField(fieldId, value) {
    const rules = ContactForm.VALIDATION_RULES[fieldId]
    if (!rules) return true

    // Check if Validator is available
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
   * Validates all form fields.
   * @returns {boolean} True if all fields are valid.
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

    // Focus on the first field with error
    if (!isValid) {
      const firstError = fields.find((id) => this._fieldErrors.has(id))
      if (firstError) {
        document.getElementById(firstError).focus()
      }
    }

    return isValid
  }

  /**
   * Initializes form auto-save.
   */
  _initAutoSave() {
    // Check if FormAutoSave is available
    if (typeof FormAutoSave === 'undefined') {
      return
    }

    this._formAutoSave = new FormAutoSave('contact', {
      debounceDelay: 500,
      onSave: () => {
        console.log('Draft saved')
      }
    })
  }

  /**
   * Sets up auto-save after opening the modal.
   */
  _setupAutoSave() {
    if (!this._formAutoSave) return

    const $form = this.$wrapper.querySelector('form')
    if ($form) {
      this._formAutoSave.registerForm($form)

      // Create the save indicator
      const $fieldset = $form.querySelector('fieldset')
      if ($fieldset) {
        this._formAutoSave.createIndicator($fieldset)
      }

      // Restore saved data
      if (this._formAutoSave.hasSavedData()) {
        this._formAutoSave.restore()
      }
    }
  }

  /**
   * Shows a success toast.
   */
  _showSuccessToast() {
    if (typeof Toast !== 'undefined') {
      Toast.show('Message envoyé avec succès!', 'success')
    }
  }
}
