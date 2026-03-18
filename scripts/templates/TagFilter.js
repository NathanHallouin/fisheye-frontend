/**
 * Classe représentant le système de filtrage par tags.
 *
 * @description
 * Cette classe implémente plusieurs concepts JavaScript clés :
 * - Array.map() : Transformation de tableaux
 * - Array.filter() : Filtrage de tableaux
 * - Array.includes() : Vérification d'appartenance
 * - Set : Collection de valeurs uniques
 * - Spread operator (...) : Décomposition de tableaux
 * - Event listeners : Gestion des événements DOM
 * - Closures : Accès aux variables du scope parent dans les callbacks
 */
class TagFilter {
  /**
   * Crée une instance de TagFilter.
   * @param {Array<Object>} photographers - Liste des photographes avec leurs tags.
   * @param {Function} onFilterChange - Callback appelé quand les filtres changent.
   */
  constructor(photographers, onFilterChange) {
    this._photographers = photographers
    this._onFilterChange = onFilterChange
    this._activeTags = new Set()
    this._allTags = this._extractAllTags()
    this.$container = null
  }

  /**
   * Extrait tous les tags uniques de la liste des photographes.
   *
   * @description
   * Utilise plusieurs concepts JavaScript :
   * - flatMap() : Aplatit les tableaux imbriqués en un seul
   * - Set : Élimine automatiquement les doublons
   * - Spread operator : Convertit le Set en Array
   *
   * @returns {Array<string>} Liste des tags uniques triés.
   * @private
   */
  _extractAllTags() {
    // flatMap combine map() et flat() en une seule opération
    // Chaque photographe a un tableau de tags, flatMap les rassemble tous
    const allTags = this._photographers.flatMap(
      (photographer) => photographer.tags,
    )

    // Set élimine automatiquement les doublons
    // Le spread operator [...] convertit le Set en Array
    const uniqueTags = [...new Set(allTags)]

    // sort() trie alphabétiquement par défaut
    return uniqueTags.sort()
  }

  /**
   * Crée le conteneur HTML des filtres.
   * @returns {HTMLElement} L'élément nav contenant les filtres.
   */
  createFilterBar() {
    const nav = document.createElement('nav')
    nav.classList.add('tag-filter')
    nav.setAttribute('aria-label', 'Filtrer par catégorie')

    // Créer le titre
    const title = document.createElement('span')
    title.classList.add('tag-filter__title')
    title.textContent = 'Filtrer par :'
    nav.appendChild(title)

    // Conteneur des boutons
    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add('tag-filter__buttons')
    buttonContainer.setAttribute('role', 'group')
    buttonContainer.setAttribute('aria-label', 'Boutons de filtrage')

    // Créer un bouton pour chaque tag unique
    // map() transforme chaque tag en élément bouton
    this._allTags.forEach((tag) => {
      const button = this._createTagButton(tag)
      buttonContainer.appendChild(button)
    })

    // Bouton de réinitialisation
    const resetButton = this._createResetButton()
    buttonContainer.appendChild(resetButton)

    nav.appendChild(buttonContainer)
    this.$container = nav

    return nav
  }

  /**
   * Crée un bouton de tag individuel.
   *
   * @description
   * Démontre l'utilisation des closures : la variable 'tag' est capturée
   * dans le callback de l'event listener et reste accessible même après
   * la fin de l'exécution de _createTagButton().
   *
   * @param {string} tag - Le nom du tag.
   * @returns {HTMLButtonElement} Le bouton créé.
   * @private
   */
  _createTagButton(tag) {
    const button = document.createElement('button')
    button.classList.add('tag-filter__btn')
    button.setAttribute('data-tag', tag)
    button.setAttribute('aria-pressed', 'false')
    button.textContent = this._formatTagName(tag)

    // Closure : 'tag' est capturé et accessible dans le callback
    // même après que _createTagButton() a terminé son exécution
    button.addEventListener('click', () => {
      this._toggleTag(tag, button)
    })

    return button
  }

  /**
   * Crée le bouton de réinitialisation des filtres.
   * @returns {HTMLButtonElement} Le bouton de reset.
   * @private
   */
  _createResetButton() {
    const button = document.createElement('button')
    button.classList.add('tag-filter__btn', 'tag-filter__btn--reset')
    button.textContent = 'Tous'
    button.setAttribute('aria-label', 'Afficher tous les photographes')

    button.addEventListener('click', () => {
      this._resetFilters()
    })

    return button
  }

  /**
   * Formate le nom d'un tag pour l'affichage (première lettre en majuscule).
   * @param {string} tag - Le tag à formater.
   * @returns {string} Le tag formaté.
   * @private
   */
  _formatTagName(tag) {
    return tag.charAt(0).toUpperCase() + tag.slice(1)
  }

  /**
   * Active ou désactive un tag de filtre.
   *
   * @description
   * Utilise Set pour gérer les tags actifs :
   * - Set.has() : Vérifie si un élément existe
   * - Set.delete() : Supprime un élément
   * - Set.add() : Ajoute un élément
   *
   * @param {string} tag - Le tag à basculer.
   * @param {HTMLButtonElement} button - Le bouton associé.
   * @private
   */
  _toggleTag(tag, button) {
    // Set.has() vérifie l'appartenance en O(1)
    if (this._activeTags.has(tag)) {
      this._activeTags.delete(tag)
      button.classList.remove('tag-filter__btn--active')
      button.setAttribute('aria-pressed', 'false')
    } else {
      this._activeTags.add(tag)
      button.classList.add('tag-filter__btn--active')
      button.setAttribute('aria-pressed', 'true')
    }

    this._applyFilters()
  }

  /**
   * Réinitialise tous les filtres actifs.
   * @private
   */
  _resetFilters() {
    // Set.clear() vide l'ensemble
    this._activeTags.clear()

    // Retirer la classe active de tous les boutons
    const buttons = this.$container.querySelectorAll('.tag-filter__btn--active')
    buttons.forEach((btn) => {
      btn.classList.remove('tag-filter__btn--active')
      btn.setAttribute('aria-pressed', 'false')
    })

    this._applyFilters()
  }

  /**
   * Applique les filtres et retourne les photographes filtrés.
   *
   * @description
   * Utilise Array.filter() pour créer un nouveau tableau contenant
   * uniquement les éléments qui passent le test de la fonction callback.
   *
   * La méthode some() vérifie si AU MOINS UN élément du tableau
   * satisfait la condition (union des tags).
   *
   * @private
   */
  _applyFilters() {
    // Si aucun tag actif, afficher tous les photographes
    if (this._activeTags.size === 0) {
      this._onFilterChange(this._photographers)
      return
    }

    // Convertir le Set en Array pour utiliser some()
    const activeTagsArray = [...this._activeTags]

    // filter() crée un nouveau tableau avec les éléments qui passent le test
    const filteredPhotographers = this._photographers.filter((photographer) => {
      // some() retourne true si AU MOINS UN tag actif est présent
      // Ceci implémente une logique OR (union)
      return activeTagsArray.some((tag) => photographer.hasTag(tag))
    })

    // Appeler le callback avec les photographes filtrés
    this._onFilterChange(filteredPhotographers)
  }

  /**
   * Retourne les tags actuellement actifs.
   * @returns {Array<string>} Liste des tags actifs.
   */
  getActiveTags() {
    return [...this._activeTags]
  }

  /**
   * Définit les tags actifs programmatiquement (pour restauration d'état URL).
   *
   * @description
   * CONCEPT : Synchronisation avec l'état externe
   * Permet de restaurer l'état des filtres depuis une source externe
   * comme les paramètres URL ou localStorage.
   *
   * @param {Array<string>} tags - Les tags à activer.
   * @param {boolean} [triggerCallback=true] - Si true, appelle le callback de filtrage.
   */
  setTags(tags, triggerCallback = true) {
    // Vider les tags actuels
    this._activeTags.clear()

    // Réinitialiser l'état visuel de tous les boutons
    if (this.$container) {
      const allButtons = this.$container.querySelectorAll(
        '.tag-filter__btn[data-tag]',
      )
      allButtons.forEach((btn) => {
        btn.classList.remove('tag-filter__btn--active')
        btn.setAttribute('aria-pressed', 'false')
      })
    }

    // Ajouter les nouveaux tags et mettre à jour l'UI
    tags.forEach((tag) => {
      if (this._allTags.includes(tag)) {
        this._activeTags.add(tag)

        // Mettre à jour le bouton correspondant
        if (this.$container) {
          const button = this.$container.querySelector(`[data-tag="${tag}"]`)
          if (button) {
            button.classList.add('tag-filter__btn--active')
            button.setAttribute('aria-pressed', 'true')
          }
        }
      }
    })

    // Appliquer les filtres si demandé
    if (triggerCallback) {
      this._applyFilters()
    }
  }
}
