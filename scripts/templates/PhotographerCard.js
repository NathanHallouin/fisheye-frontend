/**
 * Classe représentant la carte d'un photographe.
 *
 * @description
 * Affiche les informations d'un photographe avec :
 * - Photo de profil cliquable
 * - Nom, localisation, tagline et prix
 * - Bouton favori (coeur)
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
   * Crée la carte du photographe avec bouton favori.
   * @returns {HTMLElement}
   */
  createPhotographerCard() {
    const article = document.createElement('article')
    article.classList.add('user-card')

    // Header avec lien et bouton favori
    const header = document.createElement('header')
    header.classList.add('user-card__header')

    // Lien vers la page du photographe
    const link = document.createElement('a')
    link.href = this._photographer.url
    link.classList.add('user-card__link')
    link.setAttribute(
      'aria-label',
      `Voir le portfolio de ${this._photographer.name}`,
    )

    // Image avec lazy loading
    const img = document.createElement('img')
    img.classList.add('user-card__picture', 'lazy')
    // Placeholder : image transparente 1x1 pixel
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    // URL réelle stockée dans data-src pour lazy loading
    img.dataset.src = this._photographer.portrait
    img.alt = `Photo de ${this._photographer.name}`

    // Observer l'image pour lazy loading
    const lazyLoader = LazyLoader.getInstance()
    lazyLoader.observe(img)

    const h2 = document.createElement('h2')
    h2.classList.add('user-card__name')
    h2.textContent = this._photographer.name

    link.appendChild(img)
    link.appendChild(h2)
    header.appendChild(link)

    // Bouton favori
    const favoriteBtn = new FavoriteButton(this._photographer)
    header.appendChild(favoriteBtn.createButton())

    article.appendChild(header)

    // Section informations
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
    pPrice.textContent = `${this._photographer.price}€/jour`

    section.appendChild(pLoc)
    section.appendChild(pTag)
    section.appendChild(pPrice)
    article.appendChild(section)

    return article
  }
}
