/**
 * Classe utilitaire pour la validation de formulaires.
 * Fournit des méthodes statiques pour valider différents types de champs.
 */
class Validator {
  /**
   * Patterns regex pour la validation.
   */
  static PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/
  }

  /**
   * Messages d'erreur par défaut.
   */
  static MESSAGES = {
    required: 'Ce champ est requis',
    email: 'Veuillez entrer une adresse email valide',
    minLength: (min) => `Minimum ${min} caractères requis`,
    maxLength: (max) => `Maximum ${max} caractères autorisés`,
    name: 'Veuillez entrer un nom valide (lettres uniquement)',
    pattern: 'Format invalide'
  }

  /**
   * Valide qu'un champ n'est pas vide.
   * @param {string} value - La valeur à valider.
   * @returns {{valid: boolean, message: string}} Résultat de la validation.
   */
  static required(value) {
    const trimmed = value?.trim() || ''
    return {
      valid: trimmed.length > 0,
      message: Validator.MESSAGES.required
    }
  }

  /**
   * Valide une adresse email.
   * @param {string} value - L'email à valider.
   * @returns {{valid: boolean, message: string}} Résultat de la validation.
   */
  static email(value) {
    const trimmed = value?.trim() || ''
    if (trimmed.length === 0) {
      return { valid: true, message: '' } // Laisser required gérer les champs vides
    }
    return {
      valid: Validator.PATTERNS.email.test(trimmed),
      message: Validator.MESSAGES.email
    }
  }

  /**
   * Valide une longueur minimale.
   * @param {string} value - La valeur à valider.
   * @param {number} min - La longueur minimale.
   * @returns {{valid: boolean, message: string}} Résultat de la validation.
   */
  static minLength(value, min) {
    const trimmed = value?.trim() || ''
    if (trimmed.length === 0) {
      return { valid: true, message: '' }
    }
    return {
      valid: trimmed.length >= min,
      message: Validator.MESSAGES.minLength(min)
    }
  }

  /**
   * Valide une longueur maximale.
   * @param {string} value - La valeur à valider.
   * @param {number} max - La longueur maximale.
   * @returns {{valid: boolean, message: string}} Résultat de la validation.
   */
  static maxLength(value, max) {
    const trimmed = value?.trim() || ''
    return {
      valid: trimmed.length <= max,
      message: Validator.MESSAGES.maxLength(max)
    }
  }

  /**
   * Valide un nom (prénom ou nom de famille).
   * @param {string} value - Le nom à valider.
   * @returns {{valid: boolean, message: string}} Résultat de la validation.
   */
  static name(value) {
    const trimmed = value?.trim() || ''
    if (trimmed.length === 0) {
      return { valid: true, message: '' }
    }
    return {
      valid: Validator.PATTERNS.name.test(trimmed),
      message: Validator.MESSAGES.name
    }
  }

  /**
   * Valide avec un pattern regex personnalisé.
   * @param {string} value - La valeur à valider.
   * @param {RegExp} pattern - Le pattern regex.
   * @param {string} [message] - Message d'erreur personnalisé.
   * @returns {{valid: boolean, message: string}} Résultat de la validation.
   */
  static pattern(value, pattern, message = Validator.MESSAGES.pattern) {
    const trimmed = value?.trim() || ''
    if (trimmed.length === 0) {
      return { valid: true, message: '' }
    }
    return {
      valid: pattern.test(trimmed),
      message
    }
  }

  /**
   * Valide un champ avec plusieurs règles.
   * @param {string} value - La valeur à valider.
   * @param {Array<{rule: string, params?: any}>} rules - Les règles à appliquer.
   * @returns {{valid: boolean, message: string, errors: string[]}} Résultat de la validation.
   */
  static validate(value, rules) {
    const errors = []

    for (const ruleConfig of rules) {
      const { rule, params, message } = ruleConfig
      let result

      switch (rule) {
        case 'required':
          result = Validator.required(value)
          break
        case 'email':
          result = Validator.email(value)
          break
        case 'minLength':
          result = Validator.minLength(value, params)
          break
        case 'maxLength':
          result = Validator.maxLength(value, params)
          break
        case 'name':
          result = Validator.name(value)
          break
        case 'pattern':
          result = Validator.pattern(value, params, message)
          break
        default:
          continue
      }

      if (!result.valid) {
        errors.push(message || result.message)
      }
    }

    return {
      valid: errors.length === 0,
      message: errors[0] || '',
      errors
    }
  }

  /**
   * Crée un validateur de formulaire pour un ensemble de champs.
   * @param {Object} config - Configuration des champs et leurs règles.
   * @returns {Function} Fonction de validation du formulaire.
   */
  static createFormValidator(config) {
    return (formData) => {
      const results = {}
      let isValid = true

      for (const [field, rules] of Object.entries(config)) {
        const value = formData[field] || ''
        const result = Validator.validate(value, rules)
        results[field] = result

        if (!result.valid) {
          isValid = false
        }
      }

      return {
        valid: isValid,
        fields: results
      }
    }
  }
}
