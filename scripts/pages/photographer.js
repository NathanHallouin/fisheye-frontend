class PhotographerPage {
  /**
   * Initializes the API, main container, and media/filter sections.
   */
  constructor() {
    this.photographersApi = new PhotographerApi('./data/photographers.json')
    this.$addDom = document.querySelector('#main')
    this.$photographerMedia = document.createElement('div')
    this.$photographerMedia.classList.add('photographer-media')
    this.$mediaContainer = document.createElement('div')
    this.$mediaContainer.classList.add('media-container')
  }

  /**
   * Dynamically updates the <title> and meta description based on the displayed photographer.
   * @param {PhotographerProfil} profil
   */
  updateHead(profil) {
    // Dynamic title
    document.title = `Fisheye – ${profil.name}, photographe à ${profil.city}`
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content = `Découvrez le portfolio de ${profil.name}, photographe professionnel·le à ${profil.city} (${profil.country}). ${profil.tagline}`
    // Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.content = `Fisheye – ${profil.name}, photographe à ${profil.city}`
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (!ogDesc) {
      ogDesc = document.createElement('meta')
      ogDesc.setAttribute('property', 'og:description')
      document.head.appendChild(ogDesc)
    }
    ogDesc.content = `Découvrez le portfolio de ${profil.name}, photographe professionnel·le à ${profil.city} (${profil.country}). ${profil.tagline}`
    let ogImg = document.querySelector('meta[property="og:image"]')
    if (!ogImg) {
      ogImg = document.createElement('meta')
      ogImg.setAttribute('property', 'og:image')
      document.head.appendChild(ogImg)
    }
    ogImg.content = window.location.origin + '/' + profil.portrait
    // Twitter
    let twTitle = document.querySelector('meta[name="twitter:title"]')
    if (!twTitle) {
      twTitle = document.createElement('meta')
      twTitle.name = 'twitter:title'
      document.head.appendChild(twTitle)
    }
    twTitle.content = `Fisheye – ${profil.name}, photographe à ${profil.city}`
    let twDesc = document.querySelector('meta[name="twitter:description"]')
    if (!twDesc) {
      twDesc = document.createElement('meta')
      twDesc.name = 'twitter:description'
      document.head.appendChild(twDesc)
    }
    twDesc.content = `Découvrez le portfolio de ${profil.name}, photographe professionnel·le à ${profil.city} (${profil.country}). ${profil.tagline}`
    let twImg = document.querySelector('meta[name="twitter:image"]')
    if (!twImg) {
      twImg = document.createElement('meta')
      twImg.name = 'twitter:image'
      document.head.appendChild(twImg)
    }
    twImg.content = window.location.origin + '/' + profil.portrait
  }

  /**
   * Main asynchronous method to load and display the photographer profile, media, filters, and modals.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    const photographersData = await this.photographersApi.get()
    const photographerAllData = new PhotographerData(photographersData)
    const photographerProfil = new PhotographerProfil(
      photographerAllData.dataPhotographer,
    )
    // Dynamic SEO addition
    this.updateHead(photographerProfil)
    const createHeaderPhotographer = new PhotographerHeader(photographerProfil)
    this.$addDom.appendChild(createHeaderPhotographer.createHeader())
    PhotographerInfo.price = photographerProfil.price
    const createInfo = new PhotographerInfo()
    this.$addDom.appendChild(createInfo.createInfo())
    this.$addDom.appendChild(this.$photographerMedia)
    new MediaFilter()
    this.$photographerMedia.appendChild(this.$mediaContainer)
    const photographerMedia = photographerAllData.mediaPhotographer.map(
      (e) => new PhotographerMedia(e),
    )
    const initMedia = new PhotographerMediaCard(photographerMedia)
    initMedia.createAllMedia()
    InitData.data = photographerMedia
    InitData.update = initMedia
    const contactForm = new ContactForm(photographerProfil._name)
    contactForm.attachWindow()
    Lightbox.data = photographerMedia
    const lightbox = new Lightbox()
    lightbox.attachWindow()
  }
}

const run = new PhotographerPage()
run.main()
