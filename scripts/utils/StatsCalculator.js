/**
 * Utility class for calculating statistics on data.
 *
 * @description
 * Demonstrates advanced usage of Array.reduce() for:
 * - Aggregating data (sums, averages)
 * - Grouping elements by property
 * - Transforming arrays into objects
 * - Finding extrema (min/max)
 *
 * KEY CONCEPT: Array.reduce()
 * reduce() iterates through an array and "reduces" its elements to a single value.
 * This value can be a number, an object, an array, etc.
 *
 * Syntax: array.reduce((accumulator, currentValue) => { ... }, initialValue)
 * - accumulator: the accumulated value (result in progress)
 * - currentValue: the current element of the array
 * - initialValue: the initial value of the accumulator
 */
class StatsCalculator {
  /**
   * Creates a StatsCalculator instance.
   *
   * @param {Array<Object>} photographers - List of photographers.
   * @param {Array<Object>} media - List of media.
   */
  constructor(photographers, media) {
    this._photographers = photographers
    this._media = media
  }

  /**
   * Calculates the total likes for each photographer.
   *
   * @description
   * REDUCE: Group and sum
   * We create an object where each key is a photographerId
   * and each value is the total likes.
   *
   * @returns {Object} An object { photographerId: totalLikes }
   *
   * @example
   * // Input: [{photographerId: 1, likes: 10}, {photographerId: 1, likes: 20}]
   * // Output: { 1: 30 }
   */
  getLikesByPhotographer() {
    return this._media.reduce((acc, media) => {
      const id = media.photographerId
      // If the key doesn't exist, initialize it to 0
      // Then add the current media's likes
      acc[id] = (acc[id] || 0) + media.likes
      return acc
    }, {}) // Initial value: empty object
  }

  /**
   * Calculates the global total of all likes.
   *
   * @description
   * REDUCE: Simple sum
   * The accumulator is a number, we add at each iteration.
   *
   * @returns {number} The total of all likes.
   */
  getTotalLikes() {
    return this._media.reduce((total, media) => total + media.likes, 0)
  }

  /**
   * Calculates the average price of photographers.
   *
   * @description
   * REDUCE: Average calculation
   * We sum first, then divide by the number of elements.
   *
   * @returns {number} The average price (rounded to 2 decimals).
   */
  getAveragePrice() {
    if (this._photographers.length === 0) return 0

    const total = this._photographers.reduce((sum, photographer) => {
      return sum + photographer.price
    }, 0)

    return Math.round((total / this._photographers.length) * 100) / 100
  }

  /**
   * Calculates price statistics (min, max, average).
   *
   * @description
   * REDUCE: Multiple calculations in a single pass
   * The accumulator is an object containing multiple values.
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
   * Groups media by type (image or video).
   *
   * @description
   * REDUCE: Grouping by property
   * We create an object with two arrays: images and videos.
   *
   * @returns {Object} { images: [...], videos: [...] }
   */
  getMediaByType() {
    return this._media.reduce(
      (acc, media) => {
        // Determine type based on the property present
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
   * Groups media by photographer with their details.
   *
   * @description
   * REDUCE: Complex grouping
   * Each photographer becomes a key with an object containing
   * their name, media, and total likes.
   *
   * @returns {Object} { photographerId: { name, media, totalLikes } }
   */
  getMediaGroupedByPhotographer() {
    // Create a photographer dictionary for fast O(1) access
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
   * Finds the most popular photographer (most likes).
   *
   * @description
   * REDUCE: Finding an extremum (maximum)
   * The accumulator keeps track of the best candidate found.
   *
   * @returns {Object|null} The photographer with the most likes, or null.
   */
  getMostPopularPhotographer() {
    const likesByPhotographer = this.getLikesByPhotographer()

    // Object.entries() converts an object to an array of [key, value] pairs
    const entries = Object.entries(likesByPhotographer)

    if (entries.length === 0) return null

    // Find the entry with the most likes
    const [bestId, bestLikes] = entries.reduce((best, current) => {
      return current[1] > best[1] ? current : best
    }, entries[0])

    // Find the corresponding photographer
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
   * Counts the number of media per photographer tag.
   *
   * @description
   * REDUCE: Counting with lookup
   * Combines data from two sources (photographers and media).
   *
   * @returns {Object} { tag: count }
   */
  getMediaCountByTag() {
    // First, create a photographerId -> tags map
    const photographerTags = this._photographers.reduce((map, photographer) => {
      map[photographer.id] = photographer.tags || []
      return map
    }, {})

    // Then, count media for each tag
    return this._media.reduce((acc, media) => {
      const tags = photographerTags[media.photographerId] || []

      tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1
      })

      return acc
    }, {})
  }

  /**
   * Calculates statistics by country.
   *
   * @description
   * REDUCE: Complex aggregation by group
   * Groups photographers by country and calculates stats for each group.
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
   * Generates a complete summary of all statistics.
   *
   * @description
   * Combines all methods for a global overview.
   * Uses Object.keys() and Object.values() to process results.
   *
   * @returns {Object} Complete summary of statistics.
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
