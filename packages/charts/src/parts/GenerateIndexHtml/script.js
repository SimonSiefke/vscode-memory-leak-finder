// @ts-nocheck

// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {
  const chartLinks = document.querySelectorAll('.ChartLink')
  const charts = document.querySelectorAll('.Chart')
  const arrowOverlay = document.getElementById('arrowOverlay')
  const arrowPath = document.getElementById('arrowPath')
  const arrowHead = document.getElementById('arrowHead')

  // Function to calculate and draw arrow
  function drawArrow(activeLink, activeChart) {
    if (!activeLink || !activeChart || !arrowPath) return

    const linkRect = activeLink.getBoundingClientRect()
    const chartRect = activeChart.getBoundingClientRect()

    // Start point: right edge of navigation, center of active link
    const startX = linkRect.right + 10
    const startY = linkRect.top + linkRect.height / 2

    // Target point: 300px more to the right from left edge of chart, center vertically
    const targetX = chartRect.left + 300
    const targetY = chartRect.top + chartRect.height / 2

    // Control points for bezier curve
    const controlX1 = startX + (targetX - startX) * 0.3
    const controlY1 = startY
    const controlX2 = startX + (targetX - startX) * 0.7
    const controlY2 = targetY

    // Calculate tangent angle at the target point
    // For a cubic bezier curve, the tangent at t=1 is: 3 * (P3 - P2)
    const tangentX = 3 * (targetX - controlX2)
    const tangentY = 3 * (targetY - controlY2)
    const angle = Math.atan2(tangentY, tangentX) * (180 / Math.PI)

    // Calculate arrow head size and position
    const arrowSize = 12 // Size of the arrow head
    const arrowOffsetX = Math.cos((angle * Math.PI) / 180) * arrowSize
    const arrowOffsetY = Math.sin((angle * Math.PI) / 180) * arrowSize

    // End point: target point minus arrow offset
    const endX = targetX - arrowOffsetX
    const endY = targetY - arrowOffsetY

    // Create bezier curve path that ends before the arrow head
    const pathData =
      'M ' + startX + ',' + startY + ' C ' + controlX1 + ',' + controlY1 + ' ' + controlX2 + ',' + controlY2 + ' ' + endX + ',' + endY

    arrowPath.setAttribute('d', pathData)

    // Position the arrow head at the end of the line
    // The triangle points are (0,0), (12,6), (0,12), so the base is at y=6
    // We need to offset by (0, -6) to position the base at the line end
    if (arrowHead) {
      const offsetX = Math.cos((angle * Math.PI) / 180) * 0 - Math.sin((angle * Math.PI) / 180) * -6
      const offsetY = Math.sin((angle * Math.PI) / 180) * 0 + Math.cos((angle * Math.PI) / 180) * -6
      arrowHead.setAttribute('transform', 'translate(' + (endX + offsetX) + ',' + (endY + offsetY) + ') rotate(' + angle + ')')
      arrowHead.style.opacity = '1'
    }

    arrowPath.style.opacity = '1'
  }

  // Function to hide arrow
  function hideArrow() {
    if (arrowPath) {
      arrowPath.style.opacity = '0'
    }
    if (arrowHead) {
      arrowHead.style.opacity = '0'
    }
  }

  // Function to update active link and arrow based on scroll position
  function updateActiveLink() {
    const scrollPosition = window.scrollY
    let activeChart = null
    let activeLink = null

    // Check if we have an active chart and if the arrow head is visible
    const currentActiveLink = document.querySelector('.ChartLink.active')
    if (currentActiveLink) {
      const currentChartId = currentActiveLink.getAttribute('href').substring(1)
      const currentChart = document.getElementById(currentChartId)

      if (currentChart) {
        const chartRect = currentChart.getBoundingClientRect()
        const arrowEndX = chartRect.left + 300
        const viewportWidth = window.innerWidth

        // If arrow head would be hidden (beyond viewport), switch to next chart
        if (arrowEndX > viewportWidth - 50) {
          // 50px margin from edge
          // Find next chart
          const currentIndex = Array.from(charts).indexOf(currentChart)
          if (currentIndex < charts.length - 1) {
            const nextChart = charts[currentIndex + 1]
            const nextChartId = nextChart.id
            const nextLink = document.querySelector('a[href="#' + nextChartId + '"]')

            if (nextLink) {
              activeChart = nextChart
              activeLink = nextLink

              // Update active classes
              chartLinks.forEach((link) => link.classList.remove('active'))
              nextLink.classList.add('active')
            }
          }
        }
      }
    }

    // If no active chart or arrow head is visible, use normal detection
    if (!activeChart) {
      charts.forEach((chart, index) => {
        const chartTop = chart.offsetTop
        const chartHeight = chart.offsetHeight
        const chartMiddle = chartTop + chartHeight / 2
        const chartId = chart.id

        // Switch to next chart when 20px before the middle of current chart
        const switchThreshold = chartMiddle - 20

        // For the first chart, use normal detection
        if (index === 0) {
          if (scrollPosition >= chartTop && scrollPosition < switchThreshold) {
            activeChart = chart
            // Remove active class from all links
            chartLinks.forEach((link) => link.classList.remove('active'))

            // Add active class to current chart's link
            const link = document.querySelector('a[href="#' + chartId + '"]')
            if (link) {
              link.classList.add('active')
              activeLink = link
            }
          }
        } else {
          // For subsequent charts, check if we're past the switch threshold of previous chart
          const prevChart = charts[index - 1]
          const prevChartTop = prevChart.offsetTop
          const prevChartHeight = prevChart.offsetHeight
          const prevChartMiddle = prevChartTop + prevChartHeight / 2
          const prevSwitchThreshold = prevChartMiddle - 20

          if (scrollPosition >= prevSwitchThreshold && scrollPosition < chartTop + chartHeight) {
            activeChart = chart
            // Remove active class from all links
            chartLinks.forEach((link) => link.classList.remove('active'))

            // Add active class to current chart's link
            const link = document.querySelector('a[href="#' + chartId + '"]')
            if (link) {
              link.classList.add('active')
              activeLink = link
            }
          }
        }
      })
    }

    // Draw or hide arrow
    if (activeChart && activeLink) {
      drawArrow(activeLink, activeChart)

      // Scroll sidebar to keep active link visible
      scrollSidebarToActiveLink(activeLink)
    } else {
      hideArrow()
    }
  }

  // Track scroll direction for better positioning
  let lastScrollY = window.scrollY
  let scrollDirection = 'down'

  // Function to scroll sidebar so the active link remains visible
  function scrollSidebarToActiveLink(activeLink) {
    const navigation = document.querySelector('.Navigation')
    if (!navigation || !activeLink) return

    const navigationRect = navigation.getBoundingClientRect()
    const linkRect = activeLink.getBoundingClientRect()
    const navigationScrollTop = navigation.scrollTop
    const viewportHeight = navigationRect.height
    const linkHeight = linkRect.height

    // Update scroll direction
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY) {
      scrollDirection = 'down'
    } else if (currentScrollY < lastScrollY) {
      scrollDirection = 'up'
    }
    lastScrollY = currentScrollY

    // Define thresholds for proactive scrolling (earlier than edge detection)
    const topThreshold = navigationRect.top + viewportHeight * 0.3 // 30% from top
    const bottomThreshold = navigationRect.bottom - viewportHeight * 0.3 // 30% from bottom

    // Check if the link is getting close to the top edge or is above it
    if (linkRect.top < topThreshold) {
      let targetPosition
      if (scrollDirection === 'down') {
        // When scrolling down, position link in upper third of viewport
        targetPosition = linkRect.top - navigationRect.top - viewportHeight * 0.4
      } else {
        // When scrolling up, position link more towards center
        targetPosition = linkRect.top - navigationRect.top - viewportHeight * 0.5
      }
      navigation.scrollTop = navigationScrollTop + targetPosition
    }
    // Check if the link is getting close to the bottom edge or is below it
    else if (linkRect.bottom > bottomThreshold) {
      let targetPosition
      if (scrollDirection === 'down') {
        // When scrolling down, position link in lower third of viewport
        targetPosition = linkRect.bottom - navigationRect.bottom + viewportHeight * 0.4
      } else {
        // When scrolling up, position link more towards center
        targetPosition = linkRect.bottom - navigationRect.bottom + viewportHeight * 0.5
      }
      navigation.scrollTop = navigationScrollTop + targetPosition
    }
  }

  // Update active link and arrow on scroll
  window.addEventListener('scroll', updateActiveLink)

  // Update active link and arrow on resize
  window.addEventListener('resize', updateActiveLink)

  // Update active link and arrow on page load
  updateActiveLink()

  // Smooth scrolling for navigation links
  chartLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault()
      const targetId = this.getAttribute('href').substring(1)
      const targetChart = document.getElementById(targetId)

      if (targetChart) {
        targetChart.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    })
  })
})
