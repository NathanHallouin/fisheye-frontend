class PhotographerData {
  /**
   * @param {Object} data - Les données des photographes et médias.
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
   * @returns {string} Le nom du photographe depuis les paramètres d'URL.
   */
  get namePhotographer() {
    return this.searchParams
  }

  /**
   * @returns {Object} Les données du photographe courant.
   */
  get dataPhotographer() {
    return this._data.photographers.find(
      (element) => element.name === this.searchParams,
    )
  }

  /**
   * @returns {Array} Les médias du photographe courant.
   */
  get mediaPhotographer() {
    return this._data.media.filter(
      (element) => element.photographerId === this.dataPhotographer.id,
    )
  }
}
