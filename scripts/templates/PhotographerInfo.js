/**
 * Class representing photographer information (likes, price).
 */
class PhotographerInfo {
  constructor() {
    this._totalLike = 0
    this.$wrapper = document.createElement('div')
    this.$wrapper.classList.add('photographer-info')
  }
  static price = ''

  /**
   * Creates the photographer information display.
   * @returns {HTMLElement}
   */
  createInfo() {
    const wrapper = document.createElement('div')
    wrapper.classList.add('photographer-info')
    const likesDiv = document.createElement('div')
    likesDiv.classList.add('photographer-info__likes')
    const pLikes = document.createElement('p')
    pLikes.classList.add('photographer-info__nbrLikes')
    pLikes.textContent = this._totalLike
    const imgLike = document.createElement('img')
    imgLike.src = './assets/icons/heart-black.svg'
    imgLike.alt = 'Button to add or remove a like'
    imgLike.setAttribute('role', 'button')
    imgLike.classList.add('photographer-info__imgLike')
    likesDiv.appendChild(pLikes)
    likesDiv.appendChild(imgLike)
    const pPrice = document.createElement('p')
    pPrice.classList.add('photographer-info__price')
    pPrice.textContent = `${PhotographerInfo.price}€ / day`
    wrapper.appendChild(likesDiv)
    wrapper.appendChild(pPrice)
    return wrapper
  }

  /**
   * Updates the total number of likes displayed for the photographer.
   * @param {number} newTotalLikes - The new total number of likes to display.
   */
  updateInfo(newTotalLikes) {
    this._totalLike = newTotalLikes
    const $textLike = document.querySelector('.photographer-info__nbrLikes')
    $textLike.textContent = this._totalLike
  }
}
