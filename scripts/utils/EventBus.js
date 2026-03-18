/**
 * Bus d'événements centralisé (Pattern Observer/Pub-Sub).
 *
 * @description
 * Permet aux composants de communiquer sans se connaître directement.
 * Un composant peut émettre un événement, et tous les abonnés le reçoivent.
 *
 * CONCEPT : Pattern Observer (Pub/Sub)
 *
 * - Publisher (émetteur) : émet des événements sans savoir qui écoute
 * - Subscriber (abonné) : écoute des événements sans savoir qui émet
 * - Event Bus : intermédiaire qui route les événements
 *
 * Avantages :
 * - Découplage : les composants ne dépendent pas les uns des autres
 * - Flexibilité : ajouter/retirer des abonnés facilement
 * - Testabilité : on peut mocker l'EventBus
 *
 * DEUX IMPLÉMENTATIONS :
 * 1. Basée sur EventTarget natif (plus simple, intégrée au DOM)
 * 2. Basée sur Map (plus de contrôle, fonctionne hors DOM)
 */
class EventBus {
  /**
   * Instance unique (Singleton).
   * @type {EventBus|null}
   */
  static _instance = null

  /**
   * Retourne l'instance unique de l'EventBus.
   * @returns {EventBus} L'instance unique.
   */
  static getInstance() {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus()
    }
    return EventBus._instance
  }

  /**
   * Crée une instance d'EventBus.
   *
   * @description
   * On peut utiliser deux approches :
   * 1. EventTarget natif : exploite l'API DOM
   * 2. Map custom : plus de contrôle
   *
   * Ici on combine les deux pour montrer les deux approches.
   */
  constructor() {
    /**
     * CONCEPT : EventTarget
     *
     * EventTarget est la classe de base pour tout ce qui peut
     * émettre/recevoir des événements dans le DOM.
     * On peut créer notre propre EventTarget !
     */
    this._target = new EventTarget()

    /**
     * Map pour stocker les listeners avec plus de métadonnées.
     * Permet de supporter des features avancées comme once, priority, etc.
     */
    this._listeners = new Map()

    // Historique des événements (pour debugging)
    this._history = []
    this._historySize = 50
  }

  /**
   * S'abonne à un événement.
   *
   * @description
   * CONCEPT : S'abonner (Subscribe)
   * Le callback sera appelé chaque fois que l'événement est émis.
   *
   * @param {string} eventName - Nom de l'événement.
   * @param {Function} callback - Fonction à appeler.
   * @param {Object} [options] - Options d'abonnement.
   * @param {boolean} [options.once=false] - Se désabonner après le premier appel.
   * @param {number} [options.priority=0] - Priorité (plus haut = appelé en premier).
   * @returns {Function} Fonction pour se désabonner.
   *
   * @example
   * const unsubscribe = eventBus.on('user-login', (data) => {
   *   console.log('Utilisateur connecté:', data.username)
   * })
   *
   * // Plus tard, pour se désabonner :
   * unsubscribe()
   */
  on(eventName, callback, options = {}) {
    const { once = false, priority = 0 } = options

    // Créer la liste de listeners si elle n'existe pas
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, [])
    }

    // Ajouter le listener avec ses métadonnées
    const listener = { callback, once, priority }
    const listeners = this._listeners.get(eventName)
    listeners.push(listener)

    // Trier par priorité (plus haute en premier)
    listeners.sort((a, b) => b.priority - a.priority)

    // Retourner une fonction de désabonnement
    return () => this.off(eventName, callback)
  }

  /**
   * S'abonne à un événement pour UN SEUL appel.
   *
   * @param {string} eventName - Nom de l'événement.
   * @param {Function} callback - Fonction à appeler.
   * @returns {Function} Fonction pour se désabonner.
   */
  once(eventName, callback) {
    return this.on(eventName, callback, { once: true })
  }

  /**
   * Se désabonne d'un événement.
   *
   * @param {string} eventName - Nom de l'événement.
   * @param {Function} callback - Fonction à retirer.
   */
  off(eventName, callback) {
    const listeners = this._listeners.get(eventName)
    if (!listeners) return

    const index = listeners.findIndex((l) => l.callback === callback)
    if (index !== -1) {
      listeners.splice(index, 1)
    }

    // Nettoyer si plus de listeners
    if (listeners.length === 0) {
      this._listeners.delete(eventName)
    }
  }

  /**
   * Émet un événement.
   *
   * @description
   * CONCEPT : Émettre (Publish/Emit)
   * Tous les abonnés seront notifiés avec les données fournies.
   *
   * @param {string} eventName - Nom de l'événement.
   * @param {*} [data] - Données à transmettre.
   *
   * @example
   * eventBus.emit('user-login', { username: 'john', timestamp: Date.now() })
   */
  emit(eventName, data) {
    // Ajouter à l'historique
    this._addToHistory(eventName, data)

    const listeners = this._listeners.get(eventName)
    if (!listeners || listeners.length === 0) return

    // Copier la liste pour éviter les problèmes si un listener se désabonne
    const listenersCopy = [...listeners]

    // Appeler chaque listener
    listenersCopy.forEach((listener) => {
      try {
        listener.callback(data)

        // Si once=true, se désabonner après le premier appel
        if (listener.once) {
          this.off(eventName, listener.callback)
        }
      } catch (error) {
        console.error(`EventBus: Erreur dans listener de "${eventName}"`, error)
      }
    })
  }

  /**
   * Émet un événement de manière asynchrone.
   *
   * @description
   * Utilise setTimeout(0) pour différer l'émission,
   * permettant à d'autres code de s'exécuter d'abord.
   *
   * @param {string} eventName - Nom de l'événement.
   * @param {*} [data] - Données à transmettre.
   * @returns {Promise<void>} Promise résolue après émission.
   */
  emitAsync(eventName, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(eventName, data)
        resolve()
      }, 0)
    })
  }

  /**
   * Vérifie si un événement a des abonnés.
   *
   * @param {string} eventName - Nom de l'événement.
   * @returns {boolean} True si des abonnés existent.
   */
  hasListeners(eventName) {
    const listeners = this._listeners.get(eventName)
    return listeners && listeners.length > 0
  }

  /**
   * Retourne le nombre d'abonnés pour un événement.
   *
   * @param {string} eventName - Nom de l'événement.
   * @returns {number} Le nombre d'abonnés.
   */
  listenerCount(eventName) {
    const listeners = this._listeners.get(eventName)
    return listeners ? listeners.length : 0
  }

  /**
   * Supprime tous les abonnés d'un événement.
   *
   * @param {string} eventName - Nom de l'événement.
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this._listeners.delete(eventName)
    } else {
      this._listeners.clear()
    }
  }

  /**
   * Ajoute un événement à l'historique.
   *
   * @param {string} eventName - Nom de l'événement.
   * @param {*} data - Données de l'événement.
   * @private
   */
  _addToHistory(eventName, data) {
    this._history.push({
      event: eventName,
      data,
      timestamp: Date.now(),
    })

    // Limiter la taille de l'historique
    if (this._history.length > this._historySize) {
      this._history.shift()
    }
  }

  /**
   * Retourne l'historique des événements.
   *
   * @returns {Array} L'historique.
   */
  getHistory() {
    return [...this._history]
  }

  /**
   * Vide l'historique.
   */
  clearHistory() {
    this._history = []
  }

  /**
   * Retourne tous les noms d'événements ayant des abonnés.
   *
   * @returns {string[]} Les noms d'événements.
   */
  getEventNames() {
    return [...this._listeners.keys()]
  }

  /**
   * Crée un namespace d'événements.
   *
   * @description
   * Permet de grouper des événements sous un préfixe commun.
   *
   * @param {string} namespace - Le préfixe du namespace.
   * @returns {Object} Un objet avec des méthodes scoped.
   *
   * @example
   * const userEvents = eventBus.namespace('user')
   * userEvents.on('login', callback)  // Écoute 'user:login'
   * userEvents.emit('logout', data)   // Émet 'user:logout'
   */
  namespace(namespace) {
    const prefix = `${namespace}:`

    return {
      on: (event, callback, options) =>
        this.on(`${prefix}${event}`, callback, options),
      once: (event, callback) => this.once(`${prefix}${event}`, callback),
      off: (event, callback) => this.off(`${prefix}${event}`, callback),
      emit: (event, data) => this.emit(`${prefix}${event}`, data),
    }
  }
}

// Événements prédéfinis pour l'application Fisheye
EventBus.Events = {
  // Navigation
  PAGE_CHANGE: 'page:change',
  FILTER_CHANGE: 'filter:change',

  // Utilisateur
  FAVORITE_ADD: 'favorite:add',
  FAVORITE_REMOVE: 'favorite:remove',
  LIKE_TOGGLE: 'like:toggle',

  // UI
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  LIGHTBOX_OPEN: 'lightbox:open',
  LIGHTBOX_CLOSE: 'lightbox:close',

  // Données
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
}
