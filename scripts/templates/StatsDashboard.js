/**
 * Component to display a statistics dashboard.
 *
 * @description
 * Creates a visual interface to display statistics calculated
 * by StatsCalculator. Uses DOM manipulation to dynamically build
 * the dashboard.
 */
class StatsDashboard {
  /**
   * Creates a StatsDashboard instance.
   *
   * @param {StatsCalculator} statsCalculator - Stats calculator instance.
   */
  constructor(statsCalculator) {
    this._stats = statsCalculator
  }

  /**
   * Creates the complete dashboard.
   *
   * @returns {HTMLElement} The dashboard container element.
   */
  createDashboard() {
    const container = document.createElement('div')
    container.classList.add('stats-dashboard')

    // Retrieve all statistics
    const summary = this._stats.getFullSummary()

    // General statistics section
    container.appendChild(this._createOverviewSection(summary))

    // Photographers section
    container.appendChild(this._createPhotographersSection(summary))

    // Media section
    container.appendChild(this._createMediaSection(summary))

    // Tags section
    container.appendChild(this._createTagsSection(summary))

    // By country section
    container.appendChild(this._createCountrySection(summary))

    return container
  }

  /**
   * Creates the general overview section.
   *
   * @param {Object} summary - The summary data.
   * @returns {HTMLElement} The overview section.
   * @private
   */
  _createOverviewSection(summary) {
    const section = document.createElement('section')
    section.classList.add('stats-section', 'stats-section--overview')
    section.setAttribute('aria-labelledby', 'overview-title')

    const title = document.createElement('h2')
    title.id = 'overview-title'
    title.classList.add('stats-section__title')
    title.textContent = 'General Overview'

    const grid = document.createElement('div')
    grid.classList.add('stats-grid')

    // Main statistics cards
    const cards = [
      {
        label: 'Photographers',
        value: summary.photographers.total,
        icon: '📷',
      },
      {
        label: 'Media',
        value: summary.media.total,
        icon: '🖼️',
      },
      {
        label: 'Total likes',
        value: this._formatNumber(summary.media.totalLikes),
        icon: '❤️',
      },
      {
        label: 'Average price',
        value: `${summary.photographers.priceStats.average}€/day`,
        icon: '💰',
      },
    ]

    cards.forEach((card) => {
      grid.appendChild(this._createStatCard(card))
    })

    section.appendChild(title)
    section.appendChild(grid)

    return section
  }

  /**
   * Creates the photographers section.
   *
   * @param {Object} summary - The summary data.
   * @returns {HTMLElement} The photographers section.
   * @private
   */
  _createPhotographersSection(summary) {
    const section = document.createElement('section')
    section.classList.add('stats-section', 'stats-section--photographers')
    section.setAttribute('aria-labelledby', 'photographers-title')

    const title = document.createElement('h2')
    title.id = 'photographers-title'
    title.classList.add('stats-section__title')
    title.textContent = 'Photographers'

    section.appendChild(title)

    // Most popular card
    if (summary.highlights.mostPopular) {
      const highlight = document.createElement('div')
      highlight.classList.add('stats-highlight')

      const highlightTitle = document.createElement('h3')
      highlightTitle.classList.add('stats-highlight__title')
      highlightTitle.textContent = 'Most Popular'

      const highlightContent = document.createElement('div')
      highlightContent.classList.add('stats-highlight__content')

      const name = document.createElement('span')
      name.classList.add('stats-highlight__name')
      name.textContent = summary.highlights.mostPopular.name

      const likes = document.createElement('span')
      likes.classList.add('stats-highlight__value')
      likes.textContent = `${this._formatNumber(summary.highlights.mostPopular.likes)} likes`

      highlightContent.appendChild(name)
      highlightContent.appendChild(likes)
      highlight.appendChild(highlightTitle)
      highlight.appendChild(highlightContent)
      section.appendChild(highlight)
    }

    // Price statistics
    const priceStats = document.createElement('div')
    priceStats.classList.add('stats-price')

    const priceTitle = document.createElement('h3')
    priceTitle.classList.add('stats-price__title')
    priceTitle.textContent = 'Daily Rates'

    const priceGrid = document.createElement('div')
    priceGrid.classList.add('stats-price__grid')

    const priceItems = [
      { label: 'Minimum', value: `${summary.photographers.priceStats.min}€` },
      { label: 'Maximum', value: `${summary.photographers.priceStats.max}€` },
      {
        label: 'Average',
        value: `${summary.photographers.priceStats.average}€`,
      },
    ]

    priceItems.forEach((item) => {
      const priceItem = document.createElement('div')
      priceItem.classList.add('stats-price__item')

      const label = document.createElement('span')
      label.classList.add('stats-price__label')
      label.textContent = item.label

      const value = document.createElement('span')
      value.classList.add('stats-price__value')
      value.textContent = item.value

      priceItem.appendChild(label)
      priceItem.appendChild(value)
      priceGrid.appendChild(priceItem)
    })

    priceStats.appendChild(priceTitle)
    priceStats.appendChild(priceGrid)
    section.appendChild(priceStats)

    return section
  }

  /**
   * Creates the media section.
   *
   * @param {Object} summary - The summary data.
   * @returns {HTMLElement} The media section.
   * @private
   */
  _createMediaSection(summary) {
    const section = document.createElement('section')
    section.classList.add('stats-section', 'stats-section--media')
    section.setAttribute('aria-labelledby', 'media-title')

    const title = document.createElement('h2')
    title.id = 'media-title'
    title.classList.add('stats-section__title')
    title.textContent = 'Media'

    section.appendChild(title)

    // Image/video distribution
    const distribution = document.createElement('div')
    distribution.classList.add('stats-distribution')

    const total = summary.media.total
    const imagePercent = Math.round((summary.media.images / total) * 100)
    const videoPercent = 100 - imagePercent

    // Progress bar
    const bar = document.createElement('div')
    bar.classList.add('stats-bar')
    bar.setAttribute('role', 'img')
    bar.setAttribute(
      'aria-label',
      `${imagePercent}% images, ${videoPercent}% videos`,
    )

    const imageBar = document.createElement('div')
    imageBar.classList.add('stats-bar__segment', 'stats-bar__segment--images')
    imageBar.style.width = `${imagePercent}%`

    const videoBar = document.createElement('div')
    videoBar.classList.add('stats-bar__segment', 'stats-bar__segment--videos')
    videoBar.style.width = `${videoPercent}%`

    bar.appendChild(imageBar)
    bar.appendChild(videoBar)

    // Legend
    const legend = document.createElement('div')
    legend.classList.add('stats-legend')

    const imageLegend = this._createLegendItem(
      'Images',
      summary.media.images,
      imagePercent,
      'images',
    )
    const videoLegend = this._createLegendItem(
      'Videos',
      summary.media.videos,
      videoPercent,
      'videos',
    )

    legend.appendChild(imageLegend)
    legend.appendChild(videoLegend)

    distribution.appendChild(bar)
    distribution.appendChild(legend)
    section.appendChild(distribution)

    return section
  }

  /**
   * Creates the tags section.
   *
   * @param {Object} summary - The summary data.
   * @returns {HTMLElement} The tags section.
   * @private
   */
  _createTagsSection(summary) {
    const section = document.createElement('section')
    section.classList.add('stats-section', 'stats-section--tags')
    section.setAttribute('aria-labelledby', 'tags-title')

    const title = document.createElement('h2')
    title.id = 'tags-title'
    title.classList.add('stats-section__title')
    title.textContent = 'Media by Category'

    section.appendChild(title)

    // Tags list with progress bars
    const tagsList = document.createElement('div')
    tagsList.classList.add('stats-tags')

    // Find maximum to calculate relative percentages
    const maxCount = Math.max(...summary.media.byTag.map((t) => t.count))

    summary.media.byTag.forEach((tagData) => {
      const tagItem = document.createElement('div')
      tagItem.classList.add('stats-tag')

      const tagHeader = document.createElement('div')
      tagHeader.classList.add('stats-tag__header')

      const tagName = document.createElement('span')
      tagName.classList.add('stats-tag__name')
      tagName.textContent = tagData.tag

      const tagCount = document.createElement('span')
      tagCount.classList.add('stats-tag__count')
      tagCount.textContent = tagData.count

      tagHeader.appendChild(tagName)
      tagHeader.appendChild(tagCount)

      // Relative progress bar
      const tagBar = document.createElement('div')
      tagBar.classList.add('stats-tag__bar')

      const tagProgress = document.createElement('div')
      tagProgress.classList.add('stats-tag__progress')
      tagProgress.style.width = `${(tagData.count / maxCount) * 100}%`

      tagBar.appendChild(tagProgress)

      tagItem.appendChild(tagHeader)
      tagItem.appendChild(tagBar)
      tagsList.appendChild(tagItem)
    })

    section.appendChild(tagsList)

    return section
  }

  /**
   * Creates the by country section.
   *
   * @param {Object} summary - The summary data.
   * @returns {HTMLElement} The by country section.
   * @private
   */
  _createCountrySection(summary) {
    const section = document.createElement('section')
    section.classList.add('stats-section', 'stats-section--countries')
    section.setAttribute('aria-labelledby', 'countries-title')

    const title = document.createElement('h2')
    title.id = 'countries-title'
    title.classList.add('stats-section__title')
    title.textContent = 'By Country'

    section.appendChild(title)

    const table = document.createElement('table')
    table.classList.add('stats-table')

    // Header
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')

    const headers = ['Country', 'Photographers', 'Average Price']
    headers.forEach((headerText) => {
      const th = document.createElement('th')
      th.scope = 'col'
      th.textContent = headerText
      headerRow.appendChild(th)
    })

    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body
    const tbody = document.createElement('tbody')

    summary.photographers.byCountry.forEach((countryData) => {
      const row = document.createElement('tr')

      const countryCell = document.createElement('td')
      countryCell.textContent = countryData.country

      const countCell = document.createElement('td')
      countCell.textContent = countryData.count

      const priceCell = document.createElement('td')
      priceCell.textContent = `${countryData.avgPrice}€`

      row.appendChild(countryCell)
      row.appendChild(countCell)
      row.appendChild(priceCell)
      tbody.appendChild(row)
    })

    table.appendChild(tbody)
    section.appendChild(table)

    return section
  }

  /**
   * Creates a statistics card.
   *
   * @param {Object} data - The card data.
   * @param {string} data.label - The label.
   * @param {string|number} data.value - The value.
   * @param {string} data.icon - The emoji icon.
   * @returns {HTMLElement} The statistics card.
   * @private
   */
  _createStatCard(data) {
    const card = document.createElement('div')
    card.classList.add('stats-card')

    const icon = document.createElement('span')
    icon.classList.add('stats-card__icon')
    icon.textContent = data.icon
    icon.setAttribute('aria-hidden', 'true')

    const content = document.createElement('div')
    content.classList.add('stats-card__content')

    const value = document.createElement('span')
    value.classList.add('stats-card__value')
    value.textContent = data.value

    const label = document.createElement('span')
    label.classList.add('stats-card__label')
    label.textContent = data.label

    content.appendChild(value)
    content.appendChild(label)
    card.appendChild(icon)
    card.appendChild(content)

    return card
  }

  /**
   * Creates a legend item.
   *
   * @param {string} label - The label.
   * @param {number} count - The count.
   * @param {number} percent - The percentage.
   * @param {string} type - The type (for CSS class).
   * @returns {HTMLElement} The legend item.
   * @private
   */
  _createLegendItem(label, count, percent, type) {
    const item = document.createElement('div')
    item.classList.add('stats-legend__item')

    const dot = document.createElement('span')
    dot.classList.add('stats-legend__dot', `stats-legend__dot--${type}`)

    const text = document.createElement('span')
    text.classList.add('stats-legend__text')
    text.textContent = `${label}: ${count} (${percent}%)`

    item.appendChild(dot)
    item.appendChild(text)

    return item
  }

  /**
   * Formats a number with thousand separators.
   *
   * @param {number} num - The number to format.
   * @returns {string} The formatted number.
   * @private
   */
  _formatNumber(num) {
    return num.toLocaleString('fr-FR')
  }
}
