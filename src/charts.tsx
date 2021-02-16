import { range } from 'lodash'
import * as React from 'react'
const { useState, useEffect } = React
import { render } from 'react-dom'
import Plot from 'react-plotly.js'
import { Layout } from 'plotly.js'
import * as easy21 from './easy21'
import { MonteCarlo, SARSA, Learner } from './monte-carlo'

const toSurfaceData = (monte: Learner): number[][] =>
  range(0, 11).map((dealer) =>
    range(0, 22).map((player) =>
      monte.getValue({
        dealer: [{ color: 'black', value: dealer }],
        player: [{ color: 'black', value: player }],
        terminal: false
      })
    )
  )

const episodes = 10000

const App = () => {
  // tracking this is really to maintain camera position after user moves it
  const [layout, setLayout] = useState<Partial<Layout>>({
    title: 'easy 21 optimal value function',
    scene: {
      camera: { eye: { x: -1.45, y: 1.45, z: 0.85 } },
      xaxis: { title: 'player sum' },
      yaxis: { title: 'dealer showing' },
      zaxis: { title: 'value' }
    },
    autosize: false,
    width: 600,
    height: 600,
    margin: { l: 0, r: 0, b: 60, t: 60 }
  })

  const [monte, setMonte] = useState(new MonteCarlo())
  const [completedCount, setCompletedCount] = useState(0)

  // TODO: run episodes in a worker?
  const doIt = () => {
    for (let i = 0; i < episodes; i++) {
      monte.conductEpisode(easy21.init())
    }
    setCompletedCount((count) => count + episodes)
  }

  const [isRunning, setIsRunning] = useState(null)
  return (
    <>
      {isRunning ? (
        <button
          onClick={() => {
            clearInterval(isRunning)
            setIsRunning(null)
          }}
        >
          stop
        </button>
      ) : (
        <button
          onClick={() => {
            setIsRunning(setInterval(doIt, 500))
          }}
        >
          run episodes
        </button>
      )}
      <button
        onClick={() => {
          setMonte(new MonteCarlo())
          setCompletedCount(0)
          clearInterval(isRunning)
          setIsRunning(null)
        }}
      >
        reset
      </button>
      <p>episodes conducted: {completedCount}</p>
      <Plot
        data={[
          {
            z: toSurfaceData(monte),
            type: 'surface'
          }
        ]}
        onUpdate={(figure) => {
          setLayout(figure.layout)
        }}
        layout={layout}
      />
    </>
  )
}

render(<App />, document.getElementById('main'))
