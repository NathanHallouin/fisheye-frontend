/**
 * Class to create a video media card.
 */
class CreateVideoCard {
  constructor(likeId) {
    this._likeId = likeId
    this.$mediaContainer = document.querySelector('.media-container')
  }

  /**
   * Creates the video card for a photographer.
   * @param {Object} photographer - The photographer's data.
   * @returns {HTMLElement}
   */
  createMedia(photographer) {
    const article = document.createElement('article')
    article.classList.add('media-card')
    const video = document.createElement('video')
    video.src = photographer.picture
    video.tabIndex = 0
    video.classList.add('media-card__img')
    video.onclick = function () {
      lightbox.listenerLightbox(this)
    }
    video.autoplay = true
    video.innerHTML = `Your browser does not support video playback. But you can still <a href="${photographer.picture}">download it</a>!`
    const textDiv = document.createElement('div')
    textDiv.classList.add('media-card__text')
    const title = document.createElement('h3')
    title.classList.add('media-card__title')
    title.textContent = photographer.title
    const counterLike = document.createElement('p')
    counterLike.classList.add('media-card__counterLike')
    counterLike.id = `nbrLike${this._likeId}`
    counterLike.textContent = photographer.likes
    const label = document.createElement('label')
    label.htmlFor = `like${this._likeId}`
    label.classList.add('media-card__label')
    label.tabIndex = 0
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = `like${this._likeId}`
    input.classList.add('media-card__checkbox')
    const spanBtn = document.createElement('span')
    spanBtn.classList.add('media-card__btnLike')
    spanBtn.role = 'button'
    const spanSr = document.createElement('span')
    spanSr.classList.add('sr-only')
    spanSr.textContent = 'Button to add or remove a like'
    spanBtn.appendChild(spanSr)
    label.appendChild(input)
    label.appendChild(spanBtn)
    textDiv.appendChild(title)
    textDiv.appendChild(counterLike)
    textDiv.appendChild(label)
    article.appendChild(video)
    article.appendChild(textDiv)
    this.$mediaContainer.appendChild(article)
    return this.$mediaContainer
  }
}
