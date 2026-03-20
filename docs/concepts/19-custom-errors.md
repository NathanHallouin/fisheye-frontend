# Custom Error Classes

## Concept

**Custom Error Classes** allow creating specific error types to better identify and handle them. By inheriting from `Error`, we can add properties specific to each error type.

## Use Cases

- Distinguish network errors from validation errors
- Add contextual information (HTTP code, invalid field, etc.)
- Enable differentiated handling based on error type
- Improve debugging with descriptive messages

## Basic Syntax

```javascript
class CustomError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CustomError'

    // Capture stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
```

## Implementation in Fisheye

### File: `scripts/utils/CustomErrors.js`

```javascript
// Base class for all app errors
class AppError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'AppError'
    this.code = options.code || 'APP_ERROR'
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp
    }
  }
}

// Network error
class NetworkError extends AppError {
  constructor(message, options = {}) {
    super(message, { code: 'NETWORK_ERROR', ...options })
    this.name = 'NetworkError'
    this.statusCode = options.statusCode || null
    this.url = options.url || null
  }

  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  isServerError() {
    return this.statusCode >= 500
  }

  getUserMessage() {
    if (this.statusCode === 404) return 'Resource not found.'
    if (this.isServerError()) return 'Server error. Try again later.'
    return 'Connection error.'
  }
}

// Validation error
class ValidationError extends AppError {
  constructor(message, options = {}) {
    super(message, { code: 'VALIDATION_ERROR', ...options })
    this.name = 'ValidationError'
    this.field = options.field || null
    this.value = options.value
  }
}

// Resource not found
class NotFoundError extends AppError {
  constructor(resourceType, identifier) {
    super(`${resourceType} "${identifier}" not found.`, { code: 'NOT_FOUND' })
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.identifier = identifier
  }
}
```

## Usage

```javascript
// Throw a typed error
async function fetchPhotographer(id) {
  const response = await fetch(`/api/photographers/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError('Photographer', id)
    }
    throw new NetworkError('Error loading', {
      statusCode: response.status,
      url: response.url
    })
  }

  return response.json()
}

// Handle differently based on type
try {
  const photographer = await fetchPhotographer(999)
} catch (error) {
  if (error instanceof NotFoundError) {
    showMessage(`${error.resourceType} not found`)
  } else if (error instanceof NetworkError) {
    showMessage(error.getUserMessage())
  } else {
    showMessage('Unexpected error')
  }
}
```

## Error Chaining (ES2022)

```javascript
try {
  await fetchData()
} catch (originalError) {
  throw new AppError('Unable to load data', {
    cause: originalError  // Preserves the original error
  })
}
```

## Centralized ErrorHandler

```javascript
class ErrorHandler {
  static getDisplayMessage(error) {
    if (error instanceof NetworkError) {
      return error.getUserMessage()
    }
    if (error instanceof ValidationError) {
      return `${error.field}: ${error.message}`
    }
    if (error instanceof NotFoundError) {
      return `${error.resourceType} not found.`
    }
    return 'An error occurred.'
  }

  static isRetryable(error) {
    if (error instanceof NetworkError) {
      return error.isServerError()
    }
    return false
  }
}
```

## Advantages

1. **Precise identification**: `instanceof` to distinguish types
2. **Rich context**: Properties specific to each error type
3. **Improved UX**: Adapted user messages
4. **Easier debugging**: Preserved stack trace, additional info

## Best Practices

- Inherit from `Error` (or a class that inherits from `Error`)
- Define `this.name` with the class name
- Capture stack trace with `Error.captureStackTrace`
- Use `instanceof` for type checks
- Provide utility methods (`getUserMessage`, `isRetryable`)

## See Also

- [Error Handling](09-error-handling.md)
- [MDN - Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
