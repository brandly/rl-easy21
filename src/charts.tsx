import { range, sum, flatten } from 'lodash'
import * as React from 'react'
const { useState, useEffect } = React
import { render } from 'react-dom'
import Plot from 'react-plotly.js'
import { Layout } from 'plotly.js'
import * as easy21 from './easy21'
import { MonteCarlo, SARSA, Learner, Loc } from './monte-carlo'

const allStates: [number, number][][] = range(0, 11).map((dealer) =>
  range(0, 22).map((player) => [dealer, player])
)

const toSurfaceData = (monte: Learner): number[][] =>
  allStates.map((states) =>
    states.map(([dealer, player]) =>
      monte.getValue({
        dealer: [{ color: 'black', value: dealer }],
        player: [{ color: 'black', value: player }],
        terminal: false
      })
    )
  )

const initialLayout = (title: string) => ({
  title,
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

const MonteCarloChart = () => {
  // tracking this is really to maintain camera position after user moves it
  const [layout, setLayout] = useState<Partial<Layout>>(
    initialLayout('easy 21 optimal value function')
  )
  const [learner, setLearner] = useState(new MonteCarlo())
  const [completedCount, setCompletedCount] = useState(0)
  const [isRunning, setIsRunning] = useState<number | null>(null)

  // TODO: run episodes in a worker?
  const doIt = () => {
    const episodes = 10000
    for (let i = 0; i < episodes; i++) {
      learner.conductEpisode(easy21.init())
    }
    setCompletedCount((count) => count + episodes)
  }

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
          setLearner(new MonteCarlo())
          setCompletedCount(0)
          isRunning && clearInterval(isRunning)
          setIsRunning(null)
        }}
      >
        reset
      </button>
      <OptimalValue
        onClick={(Q) => {
          const learner_ = new MonteCarlo()
          learner_.Q = Q
          setLearner(learner_)
          setCompletedCount(1000 * 1000 * 1000)
        }}
      />
      <p>episodes conducted: {completedCount}</p>
      <Plot
        data={[
          {
            z: toSurfaceData(learner),
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

const fetchTrainedModel = async () =>
  fetch('billion.json').then((res) => res.json())

const initQ = () => {
  try {
    return JSON.parse(localStorage.billion)
  } catch (_) {
    return null
  }
}

const getTrainedModel = async () => initQ() || (await fetchTrainedModel())

const OptimalValue = ({
  onClick
}: {
  onClick: (Q: Record<string, Loc>) => void
}) => {
  const [Q, setQ] = useState(initQ())
  return (
    <button
      onClick={async () => {
        let model = Q
        if (!model) {
          model = await fetchTrainedModel()
          localStorage.billion = JSON.stringify(model)
          setQ(model)
        }
        onClick(model)
      }}
    >
      optimal value
    </button>
  )
}

render(<MonteCarloChart />, document.getElementById('monte-carlo'))

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const TdLearning = () => {
  const [layout, setLayout] = useState<Partial<Layout>>(initialLayout(''))
  const [isRunning, setIsRunning] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [learner, setLearner] = useState(new SARSA({ lambda: 1, n0: 100 }))

  const [results, setResults] = useState<
    Record<string, { x: number; y: number }[]>
  >({})

  // TODO: run episodes in a worker?
  const doIt = async () => {
    let results_ = results
    const optimal = new MonteCarlo()
    optimal.Q = await getTrainedModel()

    const flatStates = flatten(allStates)

    const states: [number, number, easy21.Action][] = flatten(
      flatStates.map(([d, p]) => [
        [d, p, 'hit'],
        [d, p, 'stick']
      ])
    )
    const episodes = 1000

    const learners = range(0.1, 1.1, 0.1).map(
      (lambda) => new SARSA({ lambda, n0: 100 })
    )

    for (let i = 0; i < learners.length; i++) {
      const learner_ = learners[i]
      setLearner(learner_)
      for (let round = 1; round <= 100; round++) {
        for (let ep = 0; ep < episodes; ep++) {
          learner_.conductEpisode(easy21.init())
        }
        const count = round * episodes
        setCompletedCount(count)

        const errors = states.map(([dealer, player, action]) => {
          const state: easy21.State = {
            dealer: [{ color: 'black', value: dealer }],
            player: [{ color: 'black', value: player }],
            terminal: false
          }
          const real = learner_.getQ(state, action).value
          const expected = optimal.getQ(state, action).value
          return Math.pow(real - expected, 2)
        })
        results_ =
          learner_.lambda in results_
            ? results_
            : { ...results_, [learner_.lambda]: [] }

        results_ = {
          ...results_,
          [learner_.lambda]: results_[learner_.lambda].concat({
            x: count,
            y: sum(errors) / states.length
          })
        }

        setResults(results_)

        await sleep(16)
      }
    }
  }

  return (
    <>
      {isRunning ? (
        <button
          onClick={() => {
            setIsRunning(false)
          }}
        >
          stop
        </button>
      ) : (
        <button
          onClick={() => {
            setIsRunning(true)
            doIt()
          }}
        >
          run episodes
        </button>
      )}
      <button
        onClick={() => {
          setIsRunning(false)
        }}
      >
        reset
      </button>
      <p>episodes conducted: {completedCount}</p>
      <p>lambda: {learner.lambda}</p>
      <Plot
        data={[
          {
            z: toSurfaceData(learner),
            type: 'surface'
          }
        ]}
        onUpdate={(figure) => {
          setLayout(figure.layout)
        }}
        layout={layout}
      />
      <Plot
        data={Object.entries(results).map(([lambda, list]) => {
          return {
            x: list.map(({ x }) => x),
            y: list.map(({ y }) => y),
            type: 'scatter'
          }
        })}
        layout={{}}
      />
    </>
  )
}
render(<TdLearning />, document.getElementById('td-learning'))
