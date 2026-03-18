/**
 * Utilitaire pour le chargement parallèle de ressources.
 *
 * @description
 * Charge plusieurs ressources en parallèle en utilisant Promise.all()
 * ou Promise.allSettled() selon les besoins.
 *
 * CONCEPTS CLÉS :
 *
 * 1. Promise.all(promises)
 *    - Attend que TOUTES les promesses soient résolues
 *    - Échoue dès qu'UNE promesse échoue (fail-fast)
 *    - Retourne un tableau de résultats dans le même ordre
 *
 * 2. Promise.allSettled(promises)
 *    - Attend que TOUTES les promesses soient terminées (résolues OU rejetées)
 *    - Ne "fail" jamais - retourne toujours un tableau
 *    - Chaque résultat a { status: 'fulfilled'|'rejected', value|reason }
 *
 * 3. Promise.race(promises)
 *    - Retourne dès que la PREMIÈRE promesse se termine
 *    - Utile pour les timeouts
 *
 * 4. Promise.any(promises)
 *    - Retourne dès que la PREMIÈRE promesse RÉUSSIT
 *    - Échoue seulement si TOUTES échouent
 */
class ParallelLoader {
  /**
   * Charge plusieurs URLs en parallèle.
   *
   * @description
   * CONCEPT : Promise.all()
   * Toutes les requêtes partent en même temps.
   * On attend que TOUTES soient terminées.
   * Si une échoue, tout échoue (fail-fast).
   *
   * @param {string[]} urls - Les URLs à charger.
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object[]>} Les données chargées.
   *
   * @example
   * const [users, posts] = await ParallelLoader.loadAll([
   *   '/api/users',
   *   '/api/posts'
   * ])
   */
  static async loadAll(urls, options = {}) {
    // map() crée un tableau de Promises
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => res.json()),
    )

    // Promise.all attend TOUTES les promesses
    // Si une échoue, l'erreur est propagée
    return Promise.all(promises)
  }

  /**
   * Charge plusieurs URLs avec gestion d'erreurs individuelles.
   *
   * @description
   * CONCEPT : Promise.allSettled()
   * Contrairement à Promise.all, ne fail pas si une requête échoue.
   * Retourne TOUJOURS un tableau de résultats.
   *
   * Chaque résultat est soit :
   * - { status: 'fulfilled', value: data }
   * - { status: 'rejected', reason: error }
   *
   * @param {string[]} urls - Les URLs à charger.
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object[]>} Résultats avec status.
   *
   * @example
   * const results = await ParallelLoader.loadAllSettled([
   *   '/api/users',
   *   '/api/invalid-endpoint'  // Ne fait pas échouer les autres
   * ])
   *
   * results.forEach((result, i) => {
   *   if (result.status === 'fulfilled') {
   *     console.log('Succès:', result.value)
   *   } else {
   *     console.log('Erreur:', result.reason)
   *   }
   * })
   */
  static async loadAllSettled(urls, options = {}) {
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => res.json()),
    )

    // Promise.allSettled ne fail jamais
    return Promise.allSettled(promises)
  }

  /**
   * Charge des ressources avec un rapport de progression.
   *
   * @description
   * Combine Promise.allSettled avec un callback de progression
   * pour suivre le chargement en temps réel.
   *
   * @param {string[]} urls - Les URLs à charger.
   * @param {Function} onProgress - Callback (loaded, total, result).
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object[]>} Résultats avec status.
   */
  static async loadWithProgress(urls, onProgress, options = {}) {
    let loaded = 0
    const total = urls.length
    const results = new Array(total)

    // Créer les promesses avec tracking individuel
    const promises = urls.map(async (url, index) => {
      try {
        const response = await fetch(url, options)
        const data = await response.json()

        results[index] = { status: 'fulfilled', value: data }
      } catch (error) {
        results[index] = { status: 'rejected', reason: error }
      } finally {
        loaded++
        // Appeler le callback de progression
        onProgress(loaded, total, results[index])
      }
    })

    // Attendre toutes les promesses
    await Promise.all(promises)

    return results
  }

  /**
   * Charge la première ressource disponible.
   *
   * @description
   * CONCEPT : Promise.race()
   * Retourne dès que la PREMIÈRE promesse se termine.
   * Utile pour les systèmes de fallback ou les timeouts.
   *
   * @param {string[]} urls - Les URLs à essayer.
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object>} Les données de la première réponse.
   */
  static async loadFirst(urls, options = {}) {
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => res.json()),
    )

    return Promise.race(promises)
  }

  /**
   * Charge avec un timeout.
   *
   * @description
   * CONCEPT : Promise.race() pour timeout
   * On crée une "course" entre la requête et un timer.
   * Si le timer gagne, on rejette avec une erreur de timeout.
   *
   * @param {string} url - L'URL à charger.
   * @param {number} timeout - Timeout en millisecondes.
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object>} Les données ou erreur timeout.
   */
  static async loadWithTimeout(url, timeout, options = {}) {
    // Créer une promesse qui rejette après le timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout après ${timeout}ms pour ${url}`))
      }, timeout)
    })

    // Race entre la requête et le timeout
    return Promise.race([
      fetch(url, options).then((res) => res.json()),
      timeoutPromise,
    ])
  }

  /**
   * Charge le premier succès parmi plusieurs URLs.
   *
   * @description
   * CONCEPT : Promise.any()
   * Retourne dès qu'UNE promesse RÉUSSIT.
   * Échoue seulement si TOUTES échouent (AggregateError).
   *
   * Utile pour les systèmes de fallback (essayer plusieurs CDN).
   *
   * @param {string[]} urls - Les URLs à essayer.
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object>} Les données du premier succès.
   */
  static async loadFirstSuccess(urls, options = {}) {
    const promises = urls.map((url) =>
      fetch(url, options).then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      }),
    )

    return Promise.any(promises)
  }

  /**
   * Charge des ressources en lots (batching).
   *
   * @description
   * Pour éviter de surcharger le serveur, on charge par lots
   * de N requêtes à la fois.
   *
   * @param {string[]} urls - Les URLs à charger.
   * @param {number} batchSize - Taille des lots.
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object[]>} Tous les résultats.
   */
  static async loadInBatches(urls, batchSize = 5, options = {}) {
    const results = []

    // Découper en lots
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)

      // Charger le lot en parallèle
      const batchResults = await this.loadAllSettled(batch, options)

      // Ajouter aux résultats
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Retente une requête en cas d'échec.
   *
   * @description
   * Pattern de retry avec backoff exponentiel.
   *
   * @param {string} url - L'URL à charger.
   * @param {number} maxRetries - Nombre maximum de tentatives.
   * @param {number} baseDelay - Délai de base entre les tentatives (ms).
   * @param {Object} [options] - Options de fetch.
   * @returns {Promise<Object>} Les données ou erreur après toutes les tentatives.
   */
  static async loadWithRetry(
    url,
    maxRetries = 3,
    baseDelay = 1000,
    options = {},
  ) {
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        lastError = error
        console.warn(
          `Tentative ${attempt + 1}/${maxRetries} échouée:`,
          error.message,
        )

        // Attendre avant la prochaine tentative (backoff exponentiel)
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * Extrait les valeurs réussies d'un résultat allSettled.
   *
   * @param {Object[]} results - Résultats de Promise.allSettled.
   * @returns {*[]} Les valeurs des promesses réussies.
   */
  static extractFulfilled(results) {
    return results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  }

  /**
   * Extrait les erreurs d'un résultat allSettled.
   *
   * @param {Object[]} results - Résultats de Promise.allSettled.
   * @returns {Error[]} Les raisons des promesses rejetées.
   */
  static extractRejected(results) {
    return results.filter((r) => r.status === 'rejected').map((r) => r.reason)
  }
}
