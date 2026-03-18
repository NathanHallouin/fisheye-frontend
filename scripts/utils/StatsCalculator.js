/**
 * Classe utilitaire pour calculer des statistiques sur les données.
 *
 * @description
 * Démontre l'utilisation avancée de Array.reduce() pour :
 * - Agréger des données (sommes, moyennes)
 * - Grouper des éléments par propriété
 * - Transformer des tableaux en objets
 * - Trouver des extremums (min/max)
 *
 * CONCEPT CLÉ : Array.reduce()
 * reduce() parcourt un tableau et "réduit" ses éléments en une seule valeur.
 * Cette valeur peut être un nombre, un objet, un tableau, etc.
 *
 * Syntaxe : array.reduce((accumulator, currentValue) => { ... }, initialValue)
 * - accumulator : la valeur accumulée (résultat en cours)
 * - currentValue : l'élément actuel du tableau
 * - initialValue : la valeur initiale de l'accumulator
 */
class StatsCalculator {
  /**
   * Crée une instance de StatsCalculator.
   *
   * @param {Array<Object>} photographers - Liste des photographes.
   * @param {Array<Object>} media - Liste des médias.
   */
  constructor(photographers, media) {
    this._photographers = photographers
    this._media = media
  }

  /**
   * Calcule le total de likes pour chaque photographe.
   *
   * @description
   * REDUCE : Grouper et sommer
   * On crée un objet où chaque clé est un photographerId
   * et chaque valeur est le total des likes.
   *
   * @returns {Object} Un objet { photographerId: totalLikes }
   *
   * @example
   * // Entrée : [{photographerId: 1, likes: 10}, {photographerId: 1, likes: 20}]
   * // Sortie : { 1: 30 }
   */
  getLikesByPhotographer() {
    return this._media.reduce((acc, media) => {
      const id = media.photographerId
      // Si la clé n'existe pas, on l'initialise à 0
      // Puis on ajoute les likes du média actuel
      acc[id] = (acc[id] || 0) + media.likes
      return acc
    }, {}) // Valeur initiale : objet vide
  }

  /**
   * Calcule le total global de tous les likes.
   *
   * @description
   * REDUCE : Somme simple
   * L'accumulator est un nombre, on additionne à chaque itération.
   *
   * @returns {number} Le total de tous les likes.
   */
  getTotalLikes() {
    return this._media.reduce((total, media) => total + media.likes, 0)
  }

  /**
   * Calcule la moyenne des prix des photographes.
   *
   * @description
   * REDUCE : Calcul de moyenne
   * On somme d'abord, puis on divise par le nombre d'éléments.
   *
   * @returns {number} La moyenne des prix (arrondie à 2 décimales).
   */
  getAveragePrice() {
    if (this._photographers.length === 0) return 0

    const total = this._photographers.reduce((sum, photographer) => {
      return sum + photographer.price
    }, 0)

    return Math.round((total / this._photographers.length) * 100) / 100
  }

  /**
   * Calcule les statistiques de prix (min, max, moyenne).
   *
   * @description
   * REDUCE : Calculs multiples en un seul passage
   * L'accumulator est un objet contenant plusieurs valeurs.
   *
   * @returns {Object} { min, max, average, total }
   */
  getPriceStats() {
    if (this._photographers.length === 0) {
      return { min: 0, max: 0, average: 0, total: 0 }
    }

    const stats = this._photographers.reduce(
      (acc, photographer) => {
        const price = photographer.price
        return {
          min: Math.min(acc.min, price),
          max: Math.max(acc.max, price),
          total: acc.total + price,
          count: acc.count + 1,
        }
      },
      { min: Infinity, max: -Infinity, total: 0, count: 0 },
    )

    return {
      min: stats.min,
      max: stats.max,
      average: Math.round((stats.total / stats.count) * 100) / 100,
      total: stats.total,
    }
  }

  /**
   * Groupe les médias par type (image ou vidéo).
   *
   * @description
   * REDUCE : Groupement par propriété
   * On crée un objet avec deux tableaux : images et videos.
   *
   * @returns {Object} { images: [...], videos: [...] }
   */
  getMediaByType() {
    return this._media.reduce(
      (acc, media) => {
        // Détermine le type selon la propriété présente
        if (media.video) {
          acc.videos.push(media)
        } else {
          acc.images.push(media)
        }
        return acc
      },
      { images: [], videos: [] },
    )
  }

  /**
   * Groupe les médias par photographe avec leurs détails.
   *
   * @description
   * REDUCE : Groupement complexe
   * Chaque photographe devient une clé avec un objet contenant
   * son nom, ses médias, et le total de ses likes.
   *
   * @returns {Object} { photographerId: { name, media, totalLikes } }
   */
  getMediaGroupedByPhotographer() {
    // Créer un dictionnaire des photographes pour accès rapide O(1)
    const photographerMap = this._photographers.reduce((map, photographer) => {
      map[photographer.id] = photographer
      return map
    }, {})

    return this._media.reduce((acc, media) => {
      const id = media.photographerId
      const photographer = photographerMap[id]

      if (!acc[id]) {
        acc[id] = {
          name: photographer ? photographer.name : 'Unknown',
          media: [],
          totalLikes: 0,
        }
      }

      acc[id].media.push(media)
      acc[id].totalLikes += media.likes

      return acc
    }, {})
  }

  /**
   * Trouve le photographe le plus populaire (plus de likes).
   *
   * @description
   * REDUCE : Trouver un extremum (maximum)
   * L'accumulator garde trace du meilleur candidat trouvé.
   *
   * @returns {Object|null} Le photographe avec le plus de likes, ou null.
   */
  getMostPopularPhotographer() {
    const likesByPhotographer = this.getLikesByPhotographer()

    // Object.entries() convertit un objet en tableau de paires [clé, valeur]
    const entries = Object.entries(likesByPhotographer)

    if (entries.length === 0) return null

    // Trouver l'entrée avec le plus de likes
    const [bestId, bestLikes] = entries.reduce((best, current) => {
      return current[1] > best[1] ? current : best
    }, entries[0])

    // Trouver le photographe correspondant
    const photographer = this._photographers.find(
      (p) => p.id === parseInt(bestId, 10),
    )

    return photographer
      ? {
          ...photographer,
          totalLikes: bestLikes,
        }
      : null
  }

  /**
   * Compte le nombre de médias par tag de photographe.
   *
   * @description
   * REDUCE : Comptage avec lookup
   * Combine les données de deux sources (photographes et médias).
   *
   * @returns {Object} { tag: count }
   */
  getMediaCountByTag() {
    // D'abord, créer un map photographerId -> tags
    const photographerTags = this._photographers.reduce((map, photographer) => {
      map[photographer.id] = photographer.tags || []
      return map
    }, {})

    // Ensuite, compter les médias pour chaque tag
    return this._media.reduce((acc, media) => {
      const tags = photographerTags[media.photographerId] || []

      tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1
      })

      return acc
    }, {})
  }

  /**
   * Calcule les statistiques par pays.
   *
   * @description
   * REDUCE : Agrégation complexe par groupe
   * Groupe les photographes par pays et calcule des stats pour chaque groupe.
   *
   * @returns {Object} { country: { count, avgPrice, photographers } }
   */
  getStatsByCountry() {
    return this._photographers.reduce((acc, photographer) => {
      const country = photographer.country

      if (!acc[country]) {
        acc[country] = {
          count: 0,
          totalPrice: 0,
          photographers: [],
        }
      }

      acc[country].count += 1
      acc[country].totalPrice += photographer.price
      acc[country].photographers.push(photographer.name)

      return acc
    }, {})
  }

  /**
   * Génère un résumé complet de toutes les statistiques.
   *
   * @description
   * Combine toutes les méthodes pour un aperçu global.
   * Utilise Object.keys() et Object.values() pour traiter les résultats.
   *
   * @returns {Object} Résumé complet des statistiques.
   */
  getFullSummary() {
    const mediaByType = this.getMediaByType()
    const priceStats = this.getPriceStats()
    const mostPopular = this.getMostPopularPhotographer()
    const mediaByTag = this.getMediaCountByTag()
    const statsByCountry = this.getStatsByCountry()

    return {
      photographers: {
        total: this._photographers.length,
        priceStats: priceStats,
        byCountry: Object.keys(statsByCountry).map((country) => ({
          country,
          count: statsByCountry[country].count,
          avgPrice: Math.round(
            statsByCountry[country].totalPrice / statsByCountry[country].count,
          ),
        })),
      },
      media: {
        total: this._media.length,
        images: mediaByType.images.length,
        videos: mediaByType.videos.length,
        totalLikes: this.getTotalLikes(),
        byTag: Object.entries(mediaByTag)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count),
      },
      highlights: {
        mostPopular: mostPopular
          ? {
              name: mostPopular.name,
              likes: mostPopular.totalLikes,
            }
          : null,
        cheapest: priceStats.min,
        mostExpensive: priceStats.max,
      },
    }
  }
}
