class PhotographersFactory {
  /**
   * @param {Object} data - The data to process.
   * @param {string} type - The type of entity to create.
   * @returns {Array|Error} An array of instances or an error if the type is unknown.
   */
  constructor(data, type) {
    if (type === 'photographers') {
      return data.photographers.map((data) => new PhotographerProfil(data))
    } else {
      throw new Error('Unknown type format')
    }
  }
}
