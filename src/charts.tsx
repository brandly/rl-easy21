import { range } from 'lodash'
import * as React from 'react'
const { useState, useEffect } = React
import { render } from 'react-dom'
import Plot from 'react-plotly.js'
import { init } from './easy21'
import MonteCarlo from './monte-carlo'

const toZData = (monte: MonteCarlo): number[][] =>
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
  const [monte, setMonte] = useState(new MonteCarlo())
  const [layout, setLayout] = useState({
    title: 'easy 21 optimal value function',
    scene: { camera: { eye: { x: -1.45, y: 1.45, z: 0.85 } } },
    autosize: false,
    width: 600,
    height: 600,
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90
    }
  })

  const [ran, setRan] = useState(0)

  const doIt = () => {
    for (let i = 0; i < episodes; i++) {
      monte.conductEpisode(init())
    }
    setRan((ran) => ran + episodes)
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
          setRan(0)
          clearInterval(isRunning)
          setIsRunning(null)
        }}
      >
        reset
      </button>
      <p>episodes conducted: {ran}</p>
      <Plot
        data={[
          {
            z: toZData(monte),
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
