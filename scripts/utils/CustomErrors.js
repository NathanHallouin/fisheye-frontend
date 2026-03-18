/**
 * Classes d'erreurs personnalisées pour une meilleure gestion des erreurs.
 *
 * CONCEPT : Custom Error Classes
 *
 * Créer des classes d'erreur personnalisées permet de:
 * - Identifier le type d'erreur avec instanceof
 * - Ajouter des propriétés spécifiques (statusCode, field, etc.)
 * - Gérer différemment selon le type d'erreur
 * - Avoir des messages plus descriptifs
 *
 * Toutes les erreurs héritent de Error et préservent la stack trace.
 */

/**
 * Classe de base pour les erreurs personnalisées de l'application.
 * @extends Error
 */
class AppError extends Error {
  /**
   * Crée une erreur applicative.
   * @param {string} message - Message d'erreur.
   * @param {Object} [options] - Options supplémentaires.
   * @param {string} [options.code] - Code d'erreur unique.
   * @param {Error} [options.cause] - Erreur originale (chaînage).
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'AppError'
    this.code = options.code || 'APP_ERROR'
    this.timestamp = new Date().toISOString()

    // Chaînage d'erreurs (ES2022)
    if (options.cause) {
      this.cause = options.cause
    }

    // Capture de la stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Retourne une représentation JSON de l'erreur.
   * @returns {Object} L'erreur au format JSON.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

/**
 * Erreur réseau (fetch échoué, timeout, etc.).
 * @extends AppError
 */
class NetworkError extends AppError {
  /**
   * Crée une erreur réseau.
   * @param {string} message - Message d'erreur.
   * @param {Object} [options] - Options supplémentaires.
   * @param {number} [options.statusCode] - Code HTTP.
   * @param {string} [options.url] - URL de la requête.
   * @param {string} [options.method] - Méthode HTTP.
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'NETWORK_ERROR' })
    this.name = 'NetworkError'
    this.statusCode = options.statusCode || null
    this.url = options.url || null
    this.method = options.method || 'GET'
  }

  /**
   * Vérifie si l'erreur est due à un problème côté client (4xx).
   * @returns {boolean} True si erreur client.
   */
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  /**
   * Vérifie si l'erreur est due à un problème côté serveur (5xx).
   * @returns {boolean} True si erreur serveur.
   */
  isServerError() {
    return this.statusCode >= 500
  }

  /**
   * Retourne un message utilisateur approprié.
   * @returns {string} Message pour l'utilisateur.
   */
  getUserMessage() {
    if (this.statusCode === 404) {
      return 'La ressource demandée est introuvable.'
    }
    if (this.statusCode === 403) {
      return "Vous n'avez pas accès à cette ressource."
    }
    if (this.statusCode === 401) {
      return 'Authentification requise.'
    }
    if (this.isServerError()) {
      return 'Une erreur serveur est survenue. Veuillez réessayer plus tard.'
    }
    if (!navigator.onLine) {
      return 'Vous semblez être hors ligne. Vérifiez votre connexion.'
    }
    return 'Erreur de connexion. Veuillez réessayer.'
  }
}

/**
 * Erreur de validation de données.
 * @extends AppError
 */
class ValidationError extends AppError {
  /**
   * Crée une erreur de validation.
   * @param {string} message - Message d'erreur.
   * @param {Object} [options] - Options supplémentaires.
   * @param {string} [options.field] - Nom du champ invalide.
   * @param {*} [options.value] - Valeur invalide.
   * @param {string} [options.rule] - Règle de validation violée.
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'VALIDATION_ERROR' })
    this.name = 'ValidationError'
    this.field = options.field || null
    this.value = options.value
    this.rule = options.rule || null
  }

  /**
   * Retourne un message formaté pour l'affichage.
   * @returns {string} Message formaté.
   */
  getFieldMessage() {
    if (this.field) {
      return `${this.field}: ${this.message}`
    }
    return this.message
  }
}

/**
 * Erreur pour les ressources non trouvées.
 * @extends AppError
 */
class NotFoundError extends AppError {
  /**
   * Crée une erreur "non trouvé".
   * @param {string} resourceType - Type de ressource (photographe, media, etc.).
   * @param {string|number} identifier - Identifiant de la ressource.
   */
  constructor(resourceType, identifier) {
    super(`${resourceType} avec l'identifiant "${identifier}" introuvable.`, {
      code: 'NOT_FOUND',
    })
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.identifier = identifier
  }
}

/**
 * Erreur de configuration ou d'environnement.
 * @extends AppError
 */
class ConfigError extends AppError {
  /**
   * Crée une erreur de configuration.
   * @param {string} message - Message d'erreur.
   * @param {Object} [options] - Options supplémentaires.
   * @param {string} [options.configKey] - Clé de configuration manquante/invalide.
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'CONFIG_ERROR' })
    this.name = 'ConfigError'
    this.configKey = options.configKey || null
  }
}

/**
 * Erreur de timeout.
 * @extends AppError
 */
class TimeoutError extends AppError {
  /**
   * Crée une erreur de timeout.
   * @param {string} operation - Nom de l'opération qui a timeout.
   * @param {number} timeout - Durée du timeout en ms.
   */
  constructor(operation, timeout) {
    super(`L'opération "${operation}" a dépassé le délai de ${timeout}ms.`, {
      code: 'TIMEOUT',
    })
    this.name = 'TimeoutError'
    this.operation = operation
    this.timeout = timeout
  }
}

/**
 * Erreur pour les opérations non supportées.
 * @extends AppError
 */
class UnsupportedError extends AppError {
  /**
   * Crée une erreur "non supporté".
   * @param {string} feature - Fonctionnalité non supportée.
   * @param {string} [alternative] - Alternative suggérée.
   */
  constructor(feature, alternative = null) {
    const message = alternative
      ? `"${feature}" n'est pas supporté. Alternative: ${alternative}`
      : `"${feature}" n'est pas supporté par ce navigateur.`

    super(message, { code: 'UNSUPPORTED' })
    this.name = 'UnsupportedError'
    this.feature = feature
    this.alternative = alternative
  }
}

/**
 * Erreur de permission ou d'autorisation.
 * @extends AppError
 */
class PermissionError extends AppError {
  /**
   * Crée une erreur de permission.
   * @param {string} permission - Permission requise.
   * @param {string} [action] - Action tentée.
   */
  constructor(permission, action = null) {
    const message = action
      ? `Permission "${permission}" requise pour ${action}.`
      : `Permission "${permission}" refusée.`

    super(message, { code: 'PERMISSION_DENIED' })
    this.name = 'PermissionError'
    this.permission = permission
    this.action = action
  }
}

/**
 * Utilitaire pour gérer les erreurs de manière centralisée.
 */
class ErrorHandler {
  /**
   * Gère une erreur et retourne un message utilisateur approprié.
   * @param {Error} error - L'erreur à gérer.
   * @returns {string} Message pour l'utilisateur.
   */
  static getDisplayMessage(error) {
    if (error instanceof NetworkError) {
      return error.getUserMessage()
    }

    if (error instanceof ValidationError) {
      return error.getFieldMessage()
    }

    if (error instanceof NotFoundError) {
      return `${error.resourceType} introuvable.`
    }

    if (error instanceof TimeoutError) {
      return "L'opération a pris trop de temps. Veuillez réessayer."
    }

    if (error instanceof UnsupportedError) {
      return error.message
    }

    if (error instanceof PermissionError) {
      return "Vous n'avez pas la permission d'effectuer cette action."
    }

    // Erreur générique
    return 'Une erreur inattendue est survenue.'
  }

  /**
   * Détermine si l'erreur est récupérable (peut être retentée).
   * @param {Error} error - L'erreur à analyser.
   * @returns {boolean} True si l'erreur peut être retentée.
   */
  static isRetryable(error) {
    if (error instanceof NetworkError) {
      // Les erreurs serveur peuvent être retentées
      return error.isServerError() || error.statusCode === null
    }

    if (error instanceof TimeoutError) {
      return true
    }

    return false
  }

  /**
   * Log une erreur avec contexte.
   * @param {Error} error - L'erreur à logger.
   * @param {Object} [context] - Contexte additionnel.
   */
  static log(error, context = {}) {
    const errorInfo = {
      name: error.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    }

    // En développement, afficher l'erreur complète
    console.error('[ErrorHandler]', errorInfo)

    // Ici on pourrait envoyer à un service de monitoring
    // sendToMonitoring(errorInfo)
  }
}
