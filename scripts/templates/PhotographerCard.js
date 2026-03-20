/**
 * Class representing a photographer's card.
 *
 * @description
 * Displays a photographer's information with:
 * - Clickable profile picture
 * - Name, location, tagline and price
 * - Favorite button (heart)
 */
class PhotographerCard {
  constructor(photographer) {
    this._photographer = photographer
    this.$wrapper = document.createElement('article')
    this.$wrapper.classList.add('user-card')
  }

  get photographer() {
    return this._photographer
  }

  /**
   * Creates the photographer card with favorite button.
   * @returns {HTMLElement}
   */
  createPhotographerCard() {
    const article = document.createElement('article')
    article.classList.add('user-card')

    // Header with link and favorite button
    const header = document.createElement('header')
    header.classList.add('user-card__header')

    // Link to photographer's page
    const link = document.createElement('a')
    link.href = this._photographer.url
    link.classList.add('user-card__link')
    link.setAttribute(
      'aria-label',
      `View ${this._photographer.name}'s portfolio`,
    )

    // Image with lazy loading
    const img = document.createElement('img')
    img.classList.add('user-card__picture', 'lazy')
    // Placeholder: transparent 1x1 pixel image
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    // Actual URL stored in data-src for lazy loading
    img.dataset.src = this._photographer.portrait
    img.alt = `Photo of ${this._photographer.name}`

    // Observe the image for lazy loading
    const lazyLoader = LazyLoader.getInstance()
    lazyLoader.observe(img)

    const h2 = document.createElement('h2')
    h2.classList.add('user-card__name')
    h2.textContent = this._photographer.name

    link.appendChild(img)
    link.appendChild(h2)
    header.appendChild(link)

    // Favorite button
    const favoriteBtn = new FavoriteButton(this._photographer)
    header.appendChild(favoriteBtn.createButton())

    article.appendChild(header)

    // Information section
    const section = document.createElement('section')
    section.classList.add('user-card__paragraph')

    const pLoc = document.createElement('p')
    pLoc.classList.add('user-card__localization')
    pLoc.textContent = `${this._photographer.city}, ${this._photographer.country}`

    const pTag = document.createElement('p')
    pTag.classList.add('user-card__tagline')
    pTag.textContent = this._photographer.tagline

    const pPrice = document.createElement('p')
    pPrice.classList.add('user-card__price')
    pPrice.textContent = `${this._photographer.price}€/day`

    section.appendChild(pLoc)
    section.appendChild(pTag)
    section.appendChild(pPrice)
    article.appendChild(section)

    return article
  }
}
