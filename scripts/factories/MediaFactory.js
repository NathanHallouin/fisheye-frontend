class MediaFactory {
  /**
   * @param {Object} data - The media data.
   * @param {string} type - The media type ('image' or 'video').
   * @param {number} likeId - The like identifier.
   * @throws {string} If the type is unknown.
   */
  constructor(data, type, likeId) {
    if (type === 'image') {
      new CreateImageCard(likeId).createMedia(data)
    } else if (type === 'video') {
      new CreateVideoCard(likeId).createMedia(data)
    } else {
      throw 'Unknown type format'
    }
  }
}
