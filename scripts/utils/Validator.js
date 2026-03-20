/**
 * Utility class for form validation.
 * Provides static methods to validate different types of fields.
 */
class Validator {
  /**
   * Regex patterns for validation.
   */
  static PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/
  }

  /**
   * Default error messages.
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
   * Validates that a field is not empty.
   * @param {string} value - The value to validate.
   * @returns {{valid: boolean, message: string}} Validation result.
   */
  static required(value) {
    const trimmed = value?.trim() || ''
    return {
      valid: trimmed.length > 0,
      message: Validator.MESSAGES.required
    }
  }

  /**
   * Validates an email address.
   * @param {string} value - The email to validate.
   * @returns {{valid: boolean, message: string}} Validation result.
   */
  static email(value) {
    const trimmed = value?.trim() || ''
    if (trimmed.length === 0) {
      return { valid: true, message: '' } // Let required handle empty fields
    }
    return {
      valid: Validator.PATTERNS.email.test(trimmed),
      message: Validator.MESSAGES.email
    }
  }

  /**
   * Validates a minimum length.
   * @param {string} value - The value to validate.
   * @param {number} min - The minimum length.
   * @returns {{valid: boolean, message: string}} Validation result.
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
   * Validates a maximum length.
   * @param {string} value - The value to validate.
   * @param {number} max - The maximum length.
   * @returns {{valid: boolean, message: string}} Validation result.
   */
  static maxLength(value, max) {
    const trimmed = value?.trim() || ''
    return {
      valid: trimmed.length <= max,
      message: Validator.MESSAGES.maxLength(max)
    }
  }

  /**
   * Validates a name (first name or last name).
   * @param {string} value - The name to validate.
   * @returns {{valid: boolean, message: string}} Validation result.
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
   * Validates with a custom regex pattern.
   * @param {string} value - The value to validate.
   * @param {RegExp} pattern - The regex pattern.
   * @param {string} [message] - Custom error message.
   * @returns {{valid: boolean, message: string}} Validation result.
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
   * Validates a field with multiple rules.
   * @param {string} value - The value to validate.
   * @param {Array<{rule: string, params?: any}>} rules - The rules to apply.
   * @returns {{valid: boolean, message: string, errors: string[]}} Validation result.
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
   * Creates a form validator for a set of fields.
   * @param {Object} config - Configuration of fields and their rules.
   * @returns {Function} Form validation function.
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
