class PhotographerMedia {
  /**
   * @param {Object} data - The media data.
   */
  constructor(data) {
    this._date = data.date
    this._id = data.id
    this._formatPicture = data.image ? 'image' : 'video'
    this._picture = data.image ?? data.video
    this._likes = data.likes
    this._photographerId = data.photographerId
    this._price = data.price
    this._title = data.title
  }

  /**
   * @returns {string} The media date.
   */
  get date() {
    return this._date
  }

  /**
   * @returns {number} The media identifier.
   */
  get id() {
    return this._id
  }

  /**
   * @returns {string} The media format ('image' or 'video').
   */
  get formatPicture() {
    return this._formatPicture
  }

  /**
   * @returns {string} The media file path.
   */
  get picture() {
    // Force .webp extension for images, otherwise keep the video
    if (this._formatPicture === 'image') {
      const base = this._picture.replace(/\.[^/.]+$/, '')
      return `./assets/media/${this._photographerId}/${base}.webp`
    }
    return `./assets/media/${this._photographerId}/${this._picture}`
  }

  /**
   * @returns {number} The number of likes for the media.
   */
  get likes() {
    return this._likes
  }

  /**
   * @returns {number} The photographer identifier.
   */
  get photographerId() {
    return this.photographerId
  }

  /**
   * @returns {number} The media price.
   */
  get price() {
    return this._price
  }

  /**
   * @returns {string} The media title.
   */
  get title() {
    return this._title
  }
}
