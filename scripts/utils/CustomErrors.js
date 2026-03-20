/**
 * Custom error classes for better error handling.
 *
 * CONCEPT: Custom Error Classes
 *
 * Creating custom error classes allows you to:
 * - Identify the error type with instanceof
 * - Add specific properties (statusCode, field, etc.)
 * - Handle errors differently based on type
 * - Have more descriptive messages
 *
 * All errors inherit from Error and preserve the stack trace.
 */

/**
 * Base class for custom application errors.
 * @extends Error
 */
class AppError extends Error {
  /**
   * Creates an application error.
   * @param {string} message - Error message.
   * @param {Object} [options] - Additional options.
   * @param {string} [options.code] - Unique error code.
   * @param {Error} [options.cause] - Original error (chaining).
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'AppError'
    this.code = options.code || 'APP_ERROR'
    this.timestamp = new Date().toISOString()

    // Error chaining (ES2022)
    if (options.cause) {
      this.cause = options.cause
    }

    // Stack trace capture (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Returns a JSON representation of the error.
   * @returns {Object} The error in JSON format.
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
 * Network error (failed fetch, timeout, etc.).
 * @extends AppError
 */
class NetworkError extends AppError {
  /**
   * Creates a network error.
   * @param {string} message - Error message.
   * @param {Object} [options] - Additional options.
   * @param {number} [options.statusCode] - HTTP status code.
   * @param {string} [options.url] - Request URL.
   * @param {string} [options.method] - HTTP method.
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'NETWORK_ERROR' })
    this.name = 'NetworkError'
    this.statusCode = options.statusCode || null
    this.url = options.url || null
    this.method = options.method || 'GET'
  }

  /**
   * Checks if the error is due to a client-side issue (4xx).
   * @returns {boolean} True if client error.
   */
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  /**
   * Checks if the error is due to a server-side issue (5xx).
   * @returns {boolean} True if server error.
   */
  isServerError() {
    return this.statusCode >= 500
  }

  /**
   * Returns an appropriate user message.
   * @returns {string} Message for the user.
   */
  getUserMessage() {
    if (this.statusCode === 404) {
      return 'The requested resource was not found.'
    }
    if (this.statusCode === 403) {
      return 'You do not have access to this resource.'
    }
    if (this.statusCode === 401) {
      return 'Authentication required.'
    }
    if (this.isServerError()) {
      return 'A server error occurred. Please try again later.'
    }
    if (!navigator.onLine) {
      return 'You appear to be offline. Check your connection.'
    }
    return 'Connection error. Please try again.'
  }
}

/**
 * Data validation error.
 * @extends AppError
 */
class ValidationError extends AppError {
  /**
   * Creates a validation error.
   * @param {string} message - Error message.
   * @param {Object} [options] - Additional options.
   * @param {string} [options.field] - Invalid field name.
   * @param {*} [options.value] - Invalid value.
   * @param {string} [options.rule] - Violated validation rule.
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'VALIDATION_ERROR' })
    this.name = 'ValidationError'
    this.field = options.field || null
    this.value = options.value
    this.rule = options.rule || null
  }

  /**
   * Returns a formatted message for display.
   * @returns {string} Formatted message.
   */
  getFieldMessage() {
    if (this.field) {
      return `${this.field}: ${this.message}`
    }
    return this.message
  }
}

/**
 * Error for resources not found.
 * @extends AppError
 */
class NotFoundError extends AppError {
  /**
   * Creates a "not found" error.
   * @param {string} resourceType - Resource type (photographer, media, etc.).
   * @param {string|number} identifier - Resource identifier.
   */
  constructor(resourceType, identifier) {
    super(`${resourceType} with identifier "${identifier}" not found.`, {
      code: 'NOT_FOUND',
    })
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.identifier = identifier
  }
}

/**
 * Configuration or environment error.
 * @extends AppError
 */
class ConfigError extends AppError {
  /**
   * Creates a configuration error.
   * @param {string} message - Error message.
   * @param {Object} [options] - Additional options.
   * @param {string} [options.configKey] - Missing/invalid configuration key.
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'CONFIG_ERROR' })
    this.name = 'ConfigError'
    this.configKey = options.configKey || null
  }
}

/**
 * Timeout error.
 * @extends AppError
 */
class TimeoutError extends AppError {
  /**
   * Creates a timeout error.
   * @param {string} operation - Name of the operation that timed out.
   * @param {number} timeout - Timeout duration in ms.
   */
  constructor(operation, timeout) {
    super(`Operation "${operation}" exceeded the ${timeout}ms timeout.`, {
      code: 'TIMEOUT',
    })
    this.name = 'TimeoutError'
    this.operation = operation
    this.timeout = timeout
  }
}

/**
 * Error for unsupported operations.
 * @extends AppError
 */
class UnsupportedError extends AppError {
  /**
   * Creates an "unsupported" error.
   * @param {string} feature - Unsupported feature.
   * @param {string} [alternative] - Suggested alternative.
   */
  constructor(feature, alternative = null) {
    const message = alternative
      ? `"${feature}" is not supported. Alternative: ${alternative}`
      : `"${feature}" is not supported by this browser.`

    super(message, { code: 'UNSUPPORTED' })
    this.name = 'UnsupportedError'
    this.feature = feature
    this.alternative = alternative
  }
}

/**
 * Permission or authorization error.
 * @extends AppError
 */
class PermissionError extends AppError {
  /**
   * Creates a permission error.
   * @param {string} permission - Required permission.
   * @param {string} [action] - Attempted action.
   */
  constructor(permission, action = null) {
    const message = action
      ? `Permission "${permission}" required for ${action}.`
      : `Permission "${permission}" denied.`

    super(message, { code: 'PERMISSION_DENIED' })
    this.name = 'PermissionError'
    this.permission = permission
    this.action = action
  }
}

/**
 * Utility for centralized error handling.
 */
class ErrorHandler {
  /**
   * Handles an error and returns an appropriate user message.
   * @param {Error} error - The error to handle.
   * @returns {string} Message for the user.
   */
  static getDisplayMessage(error) {
    if (error instanceof NetworkError) {
      return error.getUserMessage()
    }

    if (error instanceof ValidationError) {
      return error.getFieldMessage()
    }

    if (error instanceof NotFoundError) {
      return `${error.resourceType} not found.`
    }

    if (error instanceof TimeoutError) {
      return 'The operation took too long. Please try again.'
    }

    if (error instanceof UnsupportedError) {
      return error.message
    }

    if (error instanceof PermissionError) {
      return 'You do not have permission to perform this action.'
    }

    // Generic error
    return 'An unexpected error occurred.'
  }

  /**
   * Determines if the error is recoverable (can be retried).
   * @param {Error} error - The error to analyze.
   * @returns {boolean} True if the error can be retried.
   */
  static isRetryable(error) {
    if (error instanceof NetworkError) {
      // Server errors can be retried
      return error.isServerError() || error.statusCode === null
    }

    if (error instanceof TimeoutError) {
      return true
    }

    return false
  }

  /**
   * Logs an error with context.
   * @param {Error} error - The error to log.
   * @param {Object} [context] - Additional context.
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

    // In development, display the full error
    console.error('[ErrorHandler]', errorInfo)

    // Here we could send to a monitoring service
    // sendToMonitoring(errorInfo)
  }
}
