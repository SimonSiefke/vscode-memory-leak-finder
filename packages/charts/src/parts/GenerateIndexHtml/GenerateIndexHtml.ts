import { writeFile } from 'fs/promises'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'

const baseStructure = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>VSCode Memory Leak Finder Charts</title>
    <style>
      * {
        font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }

      .Main {
        display: flex;
        padding: 0 10px;
      }
      .Charts {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        grid-template-columns: 1fr;
        width: 100%;
        overflow: hidden;
      }

      .ChartImage {
        max-width:100%;
      }

      @media screen and (min-width: 700px) {
        .Charts {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }
      }

      .SingleColumn {
        grid-template-columns: 1fr !important;
        max-width: 1200px;
        margin: 0 auto;
      }

      .SingleColumn .ChartImage {
        max-width: 100%;
        width: 100%;
        height: auto;
      }

      .Layout {
        display: flex;
        gap: 20px;
        min-height: 100vh;
      }

      .Navigation {
        position: sticky;
        top: 0;
        width: 250px;
        height: 100vh;
        background: #f8f9fa;
        border-right: 1px solid #e9ecef;
        padding: 20px;
        overflow-y: auto;
        flex-shrink: 0;
      }

      .Navigation h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
      }

      .ChartList {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .ChartList li {
        margin-bottom: 8px;
      }

      .ChartLink {
        display: block;
        padding: 8px 12px;
        color: #666;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        transition: all 0.2s ease;
        word-break: break-word;
      }

      .ChartLink:hover {
        background: #e9ecef;
        color: #333;
      }

      .ChartLink.active {
        background: #007acc;
        color: white;
      }

      .ChartsContainer {
        flex: 1;
        padding: 20px 0;
      }

      .ChartsContainer .Charts {
        margin: 0;
        padding: 0;
      }

      .ArrowOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1000;
      }

      .ArrowOverlay path {
        transition: opacity 0.3s ease;
      }



    </style>
  </head>

  <body>
    <header>
      <h1>VSCode Memory Leak Finder Charts</h1>
    </header>
    <main class="Main">
      CONTENT
    </main>
  </body>

  <script>
    // Navigation functionality
    document.addEventListener('DOMContentLoaded', function() {
      const chartLinks = document.querySelectorAll('.ChartLink');
      const charts = document.querySelectorAll('.Chart');
      const arrowOverlay = document.getElementById('arrowOverlay');
      const arrowPath = document.getElementById('arrowPath');
      
      // Function to calculate and draw arrow
      function drawArrow(activeLink, activeChart) {
        if (!activeLink || !activeChart || !arrowPath) return;
        
        const linkRect = activeLink.getBoundingClientRect();
        const chartRect = activeChart.getBoundingClientRect();
        
        // Start point: right edge of navigation, center of active link
        const startX = linkRect.right + 10;
        const startY = linkRect.top + linkRect.height / 2;
        
        // End point: left edge of chart, center vertically
        const endX = chartRect.left - 10;
        const endY = chartRect.top + chartRect.height / 2;
        
        // Control points for bezier curve
        const controlX1 = startX + (endX - startX) * 0.3;
        const controlY1 = startY;
        const controlX2 = startX + (endX - startX) * 0.7;
        const controlY2 = endY;
        
        // Create bezier curve path
        const pathData = 'M ' + startX + ',' + startY + 
                        ' C ' + controlX1 + ',' + controlY1 + 
                        ' ' + controlX2 + ',' + controlY2 + 
                        ' ' + endX + ',' + endY;
        
        arrowPath.setAttribute('d', pathData);
        arrowPath.style.opacity = '1';
      }
      
      // Function to hide arrow
      function hideArrow() {
        if (arrowPath) {
          arrowPath.style.opacity = '0';
        }
      }
      
      // Function to update active link based on scroll position
      function updateActiveLink() {
        const scrollPosition = window.scrollY + 100; // Offset for better UX
        let activeChart = null;
        let activeLink = null;
        
        charts.forEach(chart => {
          const chartTop = chart.offsetTop;
          const chartBottom = chartTop + chart.offsetHeight;
          const chartId = chart.id;
          
          if (scrollPosition >= chartTop && scrollPosition < chartBottom) {
            activeChart = chart;
            // Remove active class from all links
            chartLinks.forEach(link => link.classList.remove('active'));
            
            // Add active class to current chart's link
            const link = document.querySelector('a[href="#' + chartId + '"]');
            if (link) {
              link.classList.add('active');
              activeLink = link;
            }
          }
        });
        
        // Draw or hide arrow
        if (activeChart && activeLink) {
          drawArrow(activeLink, activeChart);
        } else {
          hideArrow();
        }
      }

      // Update active link on scroll
      window.addEventListener('scroll', updateActiveLink);
      
      // Update arrow on resize
      window.addEventListener('resize', updateActiveLink);
      
      // Update active link on page load
      updateActiveLink();

      // Smooth scrolling for navigation links
      chartLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('href').substring(1);
          const targetChart = document.getElementById(targetId);

          if (targetChart) {
            targetChart.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    });
  </script>

</html>
`

const getMiddleHtml = (dirents) => {
  let html = '<ul class="Charts">\n'
  for (const dirent of dirents) {
    if (!dirent.endsWith('.svg')) {
      continue
    }
    html += `        <li class="Chart"><img class="ChartImage" src="./${dirent}" alt="${dirent}"></li>\n`
  }
  html += '      </ul>'
  return html
}

const generateIndexHtmlForFolder = async (folderPath: string, folderName: string): Promise<void> => {
  const outPath = join(folderPath, 'index.html')
  const dirents = await readdir(folderPath)

  // Use single column layout for named-function-count-3
  if (folderName === 'named-function-count-3') {
    const middleHtml = getSingleColumnHtml(dirents)
    const html = baseStructure.replace('CONTENT', middleHtml)
    await writeFile(outPath, html)
  } else {
    const middleHtml = getMiddleHtml(dirents)
    const html = baseStructure.replace('CONTENT', middleHtml)
    await writeFile(outPath, html)
  }
}

const getSingleColumnHtml = (dirents: string[]): string => {
  const svgFiles = dirents.filter(dirent => dirent.endsWith('.svg'))

  let html = '<div class="Layout">\n'
  html += '        <nav class="Navigation">\n'
  html += '          <h3>Charts</h3>\n'
  html += '          <ul class="ChartList">\n'
  
  for (const svgFile of svgFiles) {
    const chartName = svgFile.replace('.svg', '')
    html += `            <li><a href="#chart-${chartName}" class="ChartLink">${chartName}</a></li>\n`
  }
  
  html += '          </ul>\n'
  html += '        </nav>\n'
  html += '        <main class="ChartsContainer">\n'
  html += '          <ul class="Charts SingleColumn">\n'
  
  for (const svgFile of svgFiles) {
    const chartName = svgFile.replace('.svg', '')
    html += `            <li class="Chart" id="chart-${chartName}"><img class="ChartImage" src="./${svgFile}" alt="${svgFile}"></li>\n`
  }
  
  html += '          </ul>\n'
  html += '        </main>\n'
  html += '        <svg class="ArrowOverlay" id="arrowOverlay">\n'
  html += '          <defs>\n'
  html += '            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">\n'
  html += '              <polygon points="0 0, 10 3.5, 0 7" fill="#007acc" />\n'
  html += '            </marker>\n'
  html += '          </defs>\n'
  html += '          <path id="arrowPath" stroke="#007acc" stroke-width="2" fill="none" marker-end="url(#arrowhead)" opacity="0" />\n'
  html += '        </svg>\n'
  html += '      </div>'
  return html
}

export const generateIndexHtml = async (): Promise<void> => {
  const outPath = join(Root.root, '.vscode-charts', `index.html`)
  const svgPath = join(Root.root, '.vscode-charts')
  const dirents = await readdir(svgPath)
  const middleHtml = getMiddleHtml(dirents)
  const html = baseStructure.replace('CONTENT', middleHtml)
  await writeFile(outPath, html)

  // Generate index.html for subfolders that contain multiple SVG files
  for (const dirent of dirents) {
    const fullPath = join(svgPath, dirent)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      const subDirContents = await readdir(fullPath)
      const hasSvgFiles = subDirContents.some(file => file.endsWith('.svg'))
      if (hasSvgFiles) {
        await generateIndexHtmlForFolder(fullPath, dirent)
      }
    }
  }
}
