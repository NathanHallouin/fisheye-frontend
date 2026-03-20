/**
 * Creates a debounced function that delays execution.
 *
 * @description
 * Debounce is an optimization technique that limits the number of calls
 * to a function. The function only executes after a period of inactivity.
 *
 * Typical use cases:
 * - Real-time search (avoid a request on every keystroke)
 * - Window resizing
 * - Scroll events
 *
 * KEY CONCEPT: Closure
 * The returned function "captures" the variables timeoutId, fn and delay
 * in its closure, keeping them accessible between calls.
 *
 * @param {Function} fn - The function to execute after the delay.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Search:', query)
 * }, 300)
 *
 * // Rapid successive calls
 * debouncedSearch('a')    // Cancelled
 * debouncedSearch('ab')   // Cancelled
 * debouncedSearch('abc')  // Executed after 300ms
 */
function debounce(fn, delay) {
  // This variable persists between calls thanks to the closure
  let timeoutId = null

  // Returns a new function that "wraps" the original function
  return function (...args) {
    // 'this' and 'args' are captured to preserve context

    // Cancel the previous timeout if it exists
    // This "resets the counter" on each call
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Schedule the execution after the delay
    // If no new call arrives during 'delay' ms, the function executes
    timeoutId = setTimeout(() => {
      // apply() allows passing the context (this) and arguments
      fn.apply(this, args)
    }, delay)
  }
}
