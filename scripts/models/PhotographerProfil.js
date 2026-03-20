class PhotographerProfil {
  /**
   * @param {Object} data - The photographer data.
   */
  constructor(data) {
    this._id = data.id
    this._name = data.name
    this._portrait = data.portrait
    this._city = data.city
    this._country = data.country
    this._tagline = data.tagline
    this._price = data.price
    this._tags = data.tags || []
    this._url = 'photographer.html'
  }

  /**
   * @returns {number} The unique identifier of the photographer.
   */
  get id() {
    return this._id
  }

  /**
   * @returns {string} The photographer's name.
   */
  get name() {
    return this._name
  }

  /**
   * @returns {string} The path to the photographer's portrait.
   */
  get portrait() {
    // Force .webp extension because files exist in .webp format
    const base = this._portrait
      ? this._portrait.replace(/\.[^/.]+$/, '')
      : 'account'
    return `assets/photographers/${base}.webp`
  }

  /**
   * @returns {string} The photographer's city.
   */
  get city() {
    return this._city
  }

  /**
   * @returns {string} The photographer's country.
   */
  get country() {
    return this._country
  }

  /**
   * @returns {string} The photographer's tagline.
   */
  get tagline() {
    return this._tagline
  }

  /**
   * @returns {number} The photographer's price.
   */
  get price() {
    return this._price
  }

  /**
   * @returns {string} The URL of the photographer's page.
   */
  get url() {
    return `./${this._url}?user=${this._name}`
  }

  /**
   * @returns {Array<string>} The photographer's tags.
   */
  get tags() {
    return this._tags
  }

  /**
   * Checks if the photographer has a specific tag.
   * @param {string} tag - The tag to check.
   * @returns {boolean} True if the photographer has the tag.
   */
  hasTag(tag) {
    return this._tags.includes(tag.toLowerCase())
  }
}
