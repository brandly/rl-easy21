import { range } from 'lodash'
import { init } from './easy21'
import MonteCarlo from './monte-carlo'

const toFlatList = (monte): [number, number, number] =>
  range(1, 11).flatMap((dealer) =>
    range(1, 22).map((player) => {
      const value = monte.getValue({
        dealer: [{ color: 'black', value: dealer }],
        player: [{ color: 'black', value: player }],
        terminal: false
      })
      return [dealer, value, player]
    })
  )

// Give the points a 3D feel by adding a radial gradient
Highcharts.setOptions({
  colors: Highcharts.getOptions().colors.map(function (color) {
    return {
      radialGradient: {
        cx: 0.4,
        cy: 0.3,
        r: 0.5
      },
      stops: [
        [0, color],
        [1, Highcharts.color(color).brighten(-0.2).get('rgb')]
      ]
    }
  })
})

// Set up the chart
var chart = new Highcharts.Chart({
  chart: {
    renderTo: 'charts',
    margin: 100,
    type: 'scatter3d',
    animation: false,
    options3d: {
      enabled: true,
      alpha: 10,
      beta: 30,
      depth: 250,
      viewDistance: 5,
      fitToPlot: false,
      frame: {
        bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
        back: { size: 1, color: 'rgba(0,0,0,0.04)' },
        side: { size: 1, color: 'rgba(0,0,0,0.06)' }
      }
    }
  },
  title: {
    text: 'easy 21 optimal value function'
  },
  subtitle: {
    text: 'Click and drag the plot area to rotate in space'
  },
  plotOptions: {
    scatter: {
      width: 10,
      height: 10,
      depth: 10
    }
  },
  yAxis: {
    min: -1,
    max: 1
  },
  xAxis: {
    min: 1,
    max: 10,
    title: { text: 'dealer showing' },
    gridLineWidth: 1
  },
  zAxis: {
    min: 1,
    max: 21,
    title: { text: 'player sum' },
    showFirstLabel: false
  },
  legend: {
    enabled: true
  },
  series: [
    {
      name: 'Data',
      colorByPoint: true,
      accessibility: {
        exposeAsGroupOnly: true
      },
      // data: data
      data: []
    }
  ]
})

// Add mouse and touch events for rotation
;(function (H) {
  function dragStart(eStart) {
    eStart = chart.pointer.normalize(eStart)

    var posX = eStart.chartX,
      posY = eStart.chartY,
      alpha = chart.options.chart.options3d.alpha,
      beta = chart.options.chart.options3d.beta,
      sensitivity = 5, // lower is more sensitive
      handlers = []

    function drag(e) {
      // Get e.chartX and e.chartY
      e = chart.pointer.normalize(e)

      chart.update(
        {
          chart: {
            options3d: {
              alpha: alpha + (e.chartY - posY) / sensitivity,
              beta: beta + (posX - e.chartX) / sensitivity
            }
          }
        },
        undefined,
        undefined,
        false
      )
    }

    function unbindAll() {
      handlers.forEach(function (unbind) {
        if (unbind) {
          unbind()
        }
      })
      handlers.length = 0
    }

    handlers.push(H.addEvent(document, 'mousemove', drag))
    handlers.push(H.addEvent(document, 'touchmove', drag))

    handlers.push(H.addEvent(document, 'mouseup', unbindAll))
    handlers.push(H.addEvent(document, 'touchend', unbindAll))
  }
  H.addEvent(chart.container, 'mousedown', dragStart)
  H.addEvent(chart.container, 'touchstart', dragStart)

  const monte = new MonteCarlo()

  const episodes = 100000
  const runBatch = () => {
    for (let i = 0; i < episodes; i++) {
      monte.conductEpisode(init())
    }
    chart.update({
      series: [
        {
          name: 'Data',
          colorByPoint: true,
          accessibility: {
            exposeAsGroupOnly: true
          },
          data: toFlatList(monte.samples)
        }
      ]
    })
  }

  document.querySelector('#run-batch').addEventListener('click', runBatch)
})(Highcharts)
