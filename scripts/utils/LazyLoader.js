/**
 * Gestionnaire de chargement paresseux (Lazy Loading) des images.
 *
 * @description
 * Utilise l'API IntersectionObserver pour charger les images uniquement
 * quand elles entrent dans le viewport (zone visible).
 *
 * CONCEPT CLÉ : IntersectionObserver
 * Cette API permet de détecter quand un élément entre ou sort
 * du viewport de manière performante (pas de polling scroll).
 *
 * Avantages du lazy loading :
 * - Réduit le temps de chargement initial
 * - Économise la bande passante
 * - Améliore les performances perçues
 * - Réduit la consommation mémoire
 */
class LazyLoader {
  /**
   * Instance unique (Singleton).
   * @type {LazyLoader|null}
   */
  static _instance = null

  /**
   * Retourne l'instance unique du LazyLoader.
   * @returns {LazyLoader} L'instance unique.
   */
  static getInstance() {
    if (!LazyLoader._instance) {
      LazyLoader._instance = new LazyLoader()
    }
    return LazyLoader._instance
  }

  /**
   * Crée une instance de LazyLoader.
   *
   * @description
   * Configure l'IntersectionObserver avec des options optimisées :
   * - rootMargin : Marge autour du viewport pour pré-charger
   * - threshold : Pourcentage de visibilité requis pour déclencher
   */
  constructor() {
    /**
     * CONCEPT : Options de l'IntersectionObserver
     *
     * - root : L'élément racine (null = viewport)
     * - rootMargin : Marge autour de root (permet le pré-chargement)
     * - threshold : Ratio de visibilité pour déclencher le callback
     */
    const options = {
      root: null, // null = viewport du navigateur
      rootMargin: '100px 0px', // Charger 100px AVANT d'entrer dans le viewport
      threshold: 0.01, // Déclencher dès que 1% est visible
    }

    /**
     * CONCEPT : Création de l'IntersectionObserver
     *
     * Le callback reçoit un tableau d'IntersectionObserverEntry.
     * Chaque entry contient :
     * - target : l'élément observé
     * - isIntersecting : true si visible
     * - intersectionRatio : pourcentage visible (0 à 1)
     * - boundingClientRect : dimensions et position
     */
    this._observer = new IntersectionObserver(
      (entries) => this._handleIntersection(entries),
      options,
    )

    // Compteur pour les statistiques
    this._loadedCount = 0
    this._observedCount = 0
  }

  /**
   * Gère les intersections détectées.
   *
   * @description
   * CONCEPT : Callback de l'IntersectionObserver
   * Appelé à chaque fois qu'un élément observé change d'état
   * (entre ou sort du viewport).
   *
   * @param {IntersectionObserverEntry[]} entries - Les entrées d'intersection.
   * @private
   */
  _handleIntersection(entries) {
    entries.forEach((entry) => {
      // isIntersecting = true quand l'élément entre dans le viewport
      if (entry.isIntersecting) {
        this._loadImage(entry.target)
        // Arrêter d'observer une fois chargé (optimisation)
        this._observer.unobserve(entry.target)
      }
    })
  }

  /**
   * Charge l'image d'un élément.
   *
   * @description
   * Remplace data-src par src pour déclencher le chargement.
   * Gère également le srcset pour les images responsives.
   *
   * @param {HTMLElement} element - L'élément image ou conteneur.
   * @private
   */
  _loadImage(element) {
    // Cas 1 : Élément <img> direct
    if (element.tagName === 'IMG') {
      this._loadImgElement(element)
      return
    }

    // Cas 2 : Élément <picture> avec <source> et <img>
    if (element.tagName === 'PICTURE') {
      this._loadPictureElement(element)
      return
    }

    // Cas 3 : Conteneur avec une image enfant
    const img = element.querySelector('img[data-src]')
    if (img) {
      this._loadImgElement(img)
    }

    // Cas 4 : Background image (data-bg)
    if (element.dataset.bg) {
      element.style.backgroundImage = `url('${element.dataset.bg}')`
      delete element.dataset.bg
      element.classList.add('lazy-loaded')
      element.classList.remove('lazy-loading')
    }
  }

  /**
   * Charge une image <img>.
   *
   * @param {HTMLImageElement} img - L'élément image.
   * @private
   */
  _loadImgElement(img) {
    // Ajouter la classe de chargement
    img.classList.add('lazy-loading')

    // Créer une nouvelle image pour précharger
    const tempImage = new Image()

    // Gestionnaire de succès
    tempImage.onload = () => {
      // Transférer src une fois chargé
      if (img.dataset.src) {
        img.src = img.dataset.src
        delete img.dataset.src
      }

      // Transférer srcset si présent
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset
        delete img.dataset.srcset
      }

      // Mettre à jour les classes
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-loaded')

      // Incrémenter le compteur
      this._loadedCount++

      // Émettre un événement personnalisé
      this._emitLoadEvent(img)
    }

    // Gestionnaire d'erreur
    tempImage.onerror = () => {
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-error')

      // Charger une image de fallback
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback
      }

      console.warn('LazyLoader: Erreur de chargement', img.dataset.src)
    }

    // Démarrer le chargement
    tempImage.src = img.dataset.src
  }

  /**
   * Charge un élément <picture>.
   *
   * @param {HTMLPictureElement} picture - L'élément picture.
   * @private
   */
  _loadPictureElement(picture) {
    // Charger les sources
    const sources = picture.querySelectorAll('source[data-srcset]')
    sources.forEach((source) => {
      source.srcset = source.dataset.srcset
      delete source.dataset.srcset
    })

    // Charger l'image de fallback
    const img = picture.querySelector('img')
    if (img) {
      this._loadImgElement(img)
    }
  }

  /**
   * Émet un événement personnalisé après le chargement.
   *
   * @param {HTMLElement} element - L'élément chargé.
   * @private
   */
  _emitLoadEvent(element) {
    const event = new CustomEvent('lazyload', {
      detail: {
        element,
        loadedCount: this._loadedCount,
        observedCount: this._observedCount,
      },
      bubbles: true,
    })
    element.dispatchEvent(event)
  }

  /**
   * Observe un élément pour le lazy loading.
   *
   * @param {HTMLElement} element - L'élément à observer.
   */
  observe(element) {
    if (!element) return

    // Vérifier si l'élément a des données à charger
    const hasLazyData =
      element.dataset.src ||
      element.dataset.srcset ||
      element.dataset.bg ||
      element.querySelector('[data-src]')

    if (!hasLazyData) {
      console.warn('LazyLoader: Élément sans data-src/data-srcset', element)
      return
    }

    this._observedCount++
    this._observer.observe(element)
  }

  /**
   * Observe plusieurs éléments.
   *
   * @param {NodeList|Array<HTMLElement>} elements - Les éléments à observer.
   */
  observeAll(elements) {
    elements.forEach((element) => this.observe(element))
  }

  /**
   * Arrête d'observer un élément.
   *
   * @param {HTMLElement} element - L'élément à ne plus observer.
   */
  unobserve(element) {
    this._observer.unobserve(element)
  }

  /**
   * Arrête d'observer tous les éléments.
   */
  disconnect() {
    this._observer.disconnect()
  }

  /**
   * Force le chargement immédiat d'un élément.
   *
   * @param {HTMLElement} element - L'élément à charger.
   */
  loadImmediately(element) {
    this._loadImage(element)
    this._observer.unobserve(element)
  }

  /**
   * Force le chargement de tous les éléments observés.
   */
  loadAll() {
    // Note : IntersectionObserver n'expose pas la liste des éléments observés
    // Cette méthode est utile si on garde une référence séparée
    console.info('LazyLoader: loadAll() appelé - les images seront chargées')
  }

  /**
   * Retourne les statistiques de chargement.
   *
   * @returns {Object} Les statistiques.
   */
  getStats() {
    return {
      observed: this._observedCount,
      loaded: this._loadedCount,
      pending: this._observedCount - this._loadedCount,
    }
  }

  /**
   * Crée un élément image avec lazy loading.
   *
   * @description
   * Méthode utilitaire pour créer une image lazy-loadable.
   *
   * @param {Object} options - Les options de l'image.
   * @param {string} options.src - L'URL de l'image.
   * @param {string} options.alt - Le texte alternatif.
   * @param {string} [options.placeholder] - URL du placeholder.
   * @param {string} [options.fallback] - URL de l'image de fallback.
   * @param {string} [options.className] - Classes CSS.
   * @returns {HTMLImageElement} L'élément image créé.
   */
  createLazyImage({ src, alt, placeholder, fallback, className }) {
    const img = document.createElement('img')

    // Utiliser un placeholder ou une image transparente
    img.src =
      placeholder ||
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

    // Stocker l'URL réelle dans data-src
    img.dataset.src = src

    // Attributs d'accessibilité
    img.alt = alt || ''

    // Fallback en cas d'erreur
    if (fallback) {
      img.dataset.fallback = fallback
    }

    // Classes CSS
    if (className) {
      img.className = className
    }
    img.classList.add('lazy')

    // Observer l'image
    this.observe(img)

    return img
  }
}
