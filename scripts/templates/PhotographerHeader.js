/**
 * Class representing the header of a photographer's page.
 */
class PhotographerHeader {
  constructor(photographer) {
    this._photographer = photographer
    this.$wrapper = document.createElement('div')
    this.$wrapper.classList.add('photograph-header')
  }

  get photographer() {
    return this._photographer
  }

  /**
   * Creates the photographer's header.
   * @returns {HTMLElement}
   */
  createHeader() {
    const wrapper = document.createElement('div')
    wrapper.classList.add('photograph-header')
    const section = document.createElement('section')
    section.classList.add('photograph-header__text')
    const h2 = document.createElement('h2')
    h2.classList.add('photograph-header__title')
    h2.textContent = this._photographer.name
    const pLoc = document.createElement('p')
    pLoc.classList.add('photograph-header__localization')
    pLoc.textContent = `${this._photographer.city}, ${this._photographer.country}`
    const pDesc = document.createElement('p')
    pDesc.classList.add('photograph-header__desc')
    pDesc.textContent = this._photographer.tagline
    section.appendChild(h2)
    section.appendChild(pLoc)
    section.appendChild(pDesc)
    const button = document.createElement('button')
    button.classList.add('contact-button')
    button.setAttribute('onclick', 'contactForm.displayModal()')
    button.setAttribute('aria-label', 'Open contact form')
    button.tabIndex = 0
    button.textContent = 'Contact me'
    const img = document.createElement('img')
    img.src = this._photographer.portrait
    img.alt = this._photographer.name
    img.classList.add('user-card__picture')
    wrapper.appendChild(section)
    wrapper.appendChild(button)
    wrapper.appendChild(img)
    return wrapper
  }
}
