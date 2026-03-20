/**
 * Creates a throttled version of a function.
 * The function will be executed at most once per interval.
 *
 * @param {Function} fn - The function to throttle.
 * @param {number} limit - The minimum interval between executions in ms.
 * @param {Object} [options] - Configuration options.
 * @param {boolean} [options.leading=true] - Execute at the beginning of the interval.
 * @param {boolean} [options.trailing=true] - Execute at the end of the interval.
 * @returns {Function} The throttled function.
 *
 * @example
 * // Limit calls to once every 100ms
 * const throttledScroll = throttle(handleScroll, 100)
 * window.addEventListener('scroll', throttledScroll)
 *
 * @example
 * // Throttle with options
 * const throttledResize = throttle(handleResize, 200, { trailing: false })
 */
function throttle(fn, limit, options = {}) {
  const { leading = true, trailing = true } = options

  let lastCall = 0
  let timeoutId = null
  let lastArgs = null

  /**
   * Throttled function.
   */
  function throttled(...args) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Save the last arguments for the trailing call
    lastArgs = args

    // First call or interval elapsed
    if (timeSinceLastCall >= limit) {
      if (leading || lastCall !== 0) {
        lastCall = now
        fn.apply(this, args)
      } else {
        lastCall = now
      }

      // Cancel the trailing timeout if present
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    } else if (trailing && !timeoutId) {
      // Schedule a trailing call
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn.apply(this, lastArgs)
      }, limit - timeSinceLastCall)
    }
  }

  /**
   * Cancels pending calls.
   */
  throttled.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastCall = 0
    lastArgs = null
  }

  /**
   * Forces immediate execution if a call is pending.
   */
  throttled.flush = function () {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastCall = Date.now()
      fn.apply(this, lastArgs)
      lastArgs = null
    }
  }

  return throttled
}

/**
 * Creates a throttled version using requestAnimationFrame.
 * Ideal for animations and visual updates.
 *
 * @param {Function} fn - The function to throttle.
 * @returns {Function} The throttled function.
 *
 * @example
 * const throttledUpdate = rafThrottle(updatePosition)
 * window.addEventListener('mousemove', throttledUpdate)
 */
function rafThrottle(fn) {
  let rafId = null
  let lastArgs = null

  function throttled(...args) {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn.apply(this, lastArgs)
        rafId = null
      })
    }
  }

  throttled.cancel = function () {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastArgs = null
  }

  return throttled
}
