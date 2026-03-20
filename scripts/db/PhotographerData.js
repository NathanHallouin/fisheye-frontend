class PhotographerData {
  /**
   * @param {Object} data - The photographers and media data.
   */
  constructor(data) {
    if (PhotographerData.exists) {
      return PhotographerData.instance
    }
    PhotographerData.instance = this
    this._data = data
    this.searchParams = new URLSearchParams(document.location.search).get(
      'user',
    )
  }

  /**
   * @returns {string} The photographer name from URL parameters.
   */
  get namePhotographer() {
    return this.searchParams
  }

  /**
   * @returns {Object} The current photographer data.
   */
  get dataPhotographer() {
    return this._data.photographers.find(
      (element) => element.name === this.searchParams,
    )
  }

  /**
   * @returns {Array} The current photographer's media.
   */
  get mediaPhotographer() {
    return this._data.media.filter(
      (element) => element.photographerId === this.dataPhotographer.id,
    )
  }
}
