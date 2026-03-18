/**
 * Crée une fonction debounced qui retarde l'exécution.
 *
 * @description
 * Le debounce est une technique d'optimisation qui limite le nombre d'appels
 * à une fonction. La fonction ne s'exécute qu'après un délai d'inactivité.
 *
 * Cas d'usage typiques :
 * - Recherche en temps réel (éviter une requête à chaque frappe)
 * - Redimensionnement de fenêtre
 * - Scroll events
 *
 * CONCEPT CLÉ : Closure
 * La fonction retournée "capture" les variables timeoutId, fn et delay
 * dans sa closure, les gardant accessibles entre les appels.
 *
 * @param {Function} fn - La fonction à exécuter après le délai.
 * @param {number} delay - Le délai en millisecondes.
 * @returns {Function} La fonction debounced.
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Recherche:', query)
 * }, 300)
 *
 * // Appels rapides successifs
 * debouncedSearch('a')    // Annulé
 * debouncedSearch('ab')   // Annulé
 * debouncedSearch('abc')  // Exécuté après 300ms
 */
function debounce(fn, delay) {
  // Cette variable persiste entre les appels grâce à la closure
  let timeoutId = null

  // Retourne une nouvelle fonction qui "enveloppe" la fonction originale
  return function (...args) {
    // 'this' et 'args' sont capturés pour préserver le contexte

    // Annuler le timeout précédent s'il existe
    // Ceci "remet le compteur à zéro" à chaque appel
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Programmer l'exécution après le délai
    // Si aucun nouvel appel n'arrive pendant 'delay' ms, la fonction s'exécute
    timeoutId = setTimeout(() => {
      // apply() permet de passer le contexte (this) et les arguments
      fn.apply(this, args)
    }, delay)
  }
}
