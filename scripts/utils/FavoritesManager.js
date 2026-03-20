/**
 * Favorites manager with localStorage persistence.
 *
 * @description
 * This class implements several key JavaScript concepts:
 * - localStorage: Client-side persistent storage
 * - JSON.parse() / JSON.stringify(): Serialization/deserialization
 * - Array.find(): Search in an array
 * - Singleton Pattern: A single shared instance
 * - Custom Events: Communication between components
 *
 * localStorage persists even after closing the browser.
 * Capacity: ~5-10 MB depending on the browser.
 */
class FavoritesManager {
  /**
   * Unique instance (Singleton).
   * @type {FavoritesManager|null}
   * @private
   * @static
   */
  static _instance = null

  /**
   * Key used in localStorage.
   * @type {string}
   * @private
   * @static
   */
  static STORAGE_KEY = 'fisheye_favorites'

  /**
   * Name of the custom event emitted on changes.
   * @type {string}
   * @static
   */
  static CHANGE_EVENT = 'favorites-changed'

  /**
   * Returns the unique instance of FavoritesManager (Singleton).
   *
   * @description
   * KEY CONCEPT: Singleton Pattern
   * Ensures that only one instance exists throughout the application.
   * Useful for global state managers.
   *
   * @returns {FavoritesManager} The unique instance.
   * @static
   */
  static getInstance() {
    if (!FavoritesManager._instance) {
      FavoritesManager._instance = new FavoritesManager()
    }
    return FavoritesManager._instance
  }

  /**
   * Creates a FavoritesManager instance.
   * Use getInstance() rather than new FavoritesManager().
   */
  constructor() {
    // Load favorites from localStorage at startup
    this._favorites = this._load()
  }

  /**
   * Loads favorites from localStorage.
   *
   * @description
   * KEY CONCEPT: localStorage and JSON.parse()
   *
   * localStorage stores only strings.
   * To store objects/arrays, you must:
   * 1. Serialize with JSON.stringify() when saving
   * 2. Deserialize with JSON.parse() when reading
   *
   * JSON.parse() can fail if the data is corrupted,
   * hence the try/catch.
   *
   * @returns {Array<Object>} The loaded favorites or an empty array.
   * @private
   */
  _load() {
    try {
      // localStorage.getItem returns null if the key doesn't exist
      const data = localStorage.getItem(FavoritesManager.STORAGE_KEY)

      if (data === null) {
        return []
      }

      // JSON.parse converts the JSON string to a JavaScript object
      const parsed = JSON.parse(data)

      // Verify it's actually an array
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      // In case of error (corrupted data), return an empty array
      console.error('Error loading favorites:', error)
      return []
    }
  }

  /**
   * Saves favorites to localStorage.
   *
   * @description
   * KEY CONCEPT: JSON.stringify()
   *
   * Converts a JavaScript object to a JSON string.
   * Note: functions, undefined, and symbols are ignored.
   *
   * @private
   */
  _save() {
    try {
      // JSON.stringify converts the object to a JSON string
      const data = JSON.stringify(this._favorites)

      // localStorage.setItem stores the string
      localStorage.setItem(FavoritesManager.STORAGE_KEY, data)

      // Emit an event to notify other components
      this._emitChange()
    } catch (error) {
      // Can fail if quota is exceeded
      console.error('Error saving favorites:', error)
    }
  }

  /**
   * Emits a custom event to notify changes.
   *
   * @description
   * KEY CONCEPT: Custom Events
   *
   * Allows components to react to changes without direct coupling.
   * Observer/Pub-Sub pattern via the native DOM API.
   *
   * @private
   */
  _emitChange() {
    const event = new CustomEvent(FavoritesManager.CHANGE_EVENT, {
      detail: {
        favorites: this.getAll(),
        count: this.count(),
      },
    })
    document.dispatchEvent(event)
  }

  /**
   * Adds a photographer to favorites.
   *
   * @param {Object} photographer - The photographer's data.
   * @param {number} photographer.id - The unique identifier.
   * @param {string} photographer.name - The name.
   * @returns {boolean} True if added, false if already present.
   */
  add(photographer) {
    // Check if already in favorites
    if (this.isFavorite(photographer.id)) {
      return false
    }

    // Store only essential data
    const favoriteData = {
      id: photographer.id,
      name: photographer.name,
      city: photographer.city,
      country: photographer.country,
      tagline: photographer.tagline,
      price: photographer.price,
      portrait: photographer.portrait,
      addedAt: new Date().toISOString(),
    }

    this._favorites.push(favoriteData)
    this._save()
    return true
  }

  /**
   * Removes a photographer from favorites.
   *
   * @description
   * KEY CONCEPT: Array.findIndex() and Array.splice()
   *
   * findIndex() finds the index of the matching element.
   * splice() modifies the array in place (deletion).
   *
   * @param {number} photographerId - The photographer's identifier.
   * @returns {boolean} True if removed, false if not found.
   */
  remove(photographerId) {
    // findIndex returns -1 if not found
    const index = this._favorites.findIndex((fav) => fav.id === photographerId)

    if (index === -1) {
      return false
    }

    // splice(index, 1) removes 1 element at the given index
    this._favorites.splice(index, 1)
    this._save()
    return true
  }

  /**
   * Adds or removes a photographer from favorites.
   *
   * @param {Object} photographer - The photographer's data.
   * @returns {boolean} True if now in favorites, false otherwise.
   */
  toggle(photographer) {
    if (this.isFavorite(photographer.id)) {
      this.remove(photographer.id)
      return false
    } else {
      this.add(photographer)
      return true
    }
  }

  /**
   * Checks if a photographer is in favorites.
   *
   * @description
   * KEY CONCEPT: Array.some()
   *
   * some() returns true if AT LEAST ONE element satisfies the condition.
   * More efficient than find() when you just want a boolean.
   *
   * @param {number} photographerId - The photographer's identifier.
   * @returns {boolean} True if in favorites.
   */
  isFavorite(photographerId) {
    return this._favorites.some((fav) => fav.id === photographerId)
  }

  /**
   * Returns all favorites.
   *
   * @description
   * Returns a COPY to prevent external modifications.
   *
   * @returns {Array<Object>} Copy of favorites.
   */
  getAll() {
    // Spread to return a copy
    return [...this._favorites]
  }

  /**
   * Returns a favorite by its ID.
   *
   * @description
   * KEY CONCEPT: Array.find()
   *
   * find() returns the FIRST element that satisfies the condition,
   * or undefined if none matches.
   *
   * @param {number} photographerId - The photographer's identifier.
   * @returns {Object|undefined} The favorite or undefined.
   */
  getById(photographerId) {
    return this._favorites.find((fav) => fav.id === photographerId)
  }

  /**
   * Returns the number of favorites.
   * @returns {number}
   */
  count() {
    return this._favorites.length
  }

  /**
   * Removes all favorites.
   */
  clear() {
    this._favorites = []
    this._save()
  }

  /**
   * Listens to favorites changes.
   *
   * @param {Function} callback - Function called on changes.
   * @returns {Function} Function to stop listening.
   *
   * @example
   * const unsubscribe = FavoritesManager.getInstance().onChange((data) => {
   *   console.log('Favorites:', data.favorites)
   *   console.log('Total:', data.count)
   * })
   *
   * // Later, to stop listening:
   * unsubscribe()
   */
  onChange(callback) {
    const handler = (event) => callback(event.detail)
    document.addEventListener(FavoritesManager.CHANGE_EVENT, handler)

    // Return a cleanup function (unsubscribe)
    return () => {
      document.removeEventListener(FavoritesManager.CHANGE_EVENT, handler)
    }
  }

  /**
   * Exports favorites to JSON format.
   * Useful for backup or sharing.
   *
   * @returns {string} The favorites in JSON.
   */
  export() {
    return JSON.stringify(this._favorites, null, 2)
  }

  /**
   * Imports favorites from a JSON string.
   *
   * @param {string} jsonString - The favorites in JSON.
   * @param {boolean} merge - If true, merge with existing ones.
   * @returns {boolean} True if import succeeded.
   */
  import(jsonString, merge = false) {
    try {
      const imported = JSON.parse(jsonString)

      if (!Array.isArray(imported)) {
        return false
      }

      if (merge) {
        // Merge while avoiding duplicates
        imported.forEach((item) => {
          if (!this.isFavorite(item.id)) {
            this._favorites.push(item)
          }
        })
      } else {
        this._favorites = imported
      }

      this._save()
      return true
    } catch (error) {
      console.error('Error during import:', error)
      return false
    }
  }
}
