class PhotographerMedia {
  /**
   * @param {Object} data - Les données du média.
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
   * @returns {string} La date du média.
   */
  get date() {
    return this._date
  }

  /**
   * @returns {number} L'identifiant du média.
   */
  get id() {
    return this._id
  }

  /**
   * @returns {string} Le format du média ('image' ou 'video').
   */
  get formatPicture() {
    return this._formatPicture
  }

  /**
   * @returns {string} Le chemin du fichier média.
   */
  get picture() {
    // On force l'extension .webp pour les images, sinon on garde la vidéo
    if (this._formatPicture === 'image') {
      const base = this._picture.replace(/\.[^/.]+$/, '')
      return `./assets/media/${this._photographerId}/${base}.webp`
    }
    return `./assets/media/${this._photographerId}/${this._picture}`
  }

  /**
   * @returns {number} Le nombre de likes du média.
   */
  get likes() {
    return this._likes
  }

  /**
   * @returns {number} L'identifiant du photographe.
   */
  get photographerId() {
    return this.photographerId
  }

  /**
   * @returns {number} Le prix du média.
   */
  get price() {
    return this._price
  }

  /**
   * @returns {string} Le titre du média.
   */
  get title() {
    return this._title
  }
}
