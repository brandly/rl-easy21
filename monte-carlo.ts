import { range } from 'lodash'
import { State, Action, cardSum, step, getReward } from './easy21'

// TODO: this should record the visits/value for a given _action_ on that state
type Loc = {
  value: number
  visits: number
  hit: number
  stick: number
}
const initLoc = () => ({ value: 0, visits: 0, hit: 0, stick: 0 })
const getRandomAction = (): Action => (Math.random() < 0.5 ? 'hit' : 'stick')
const getKey = (state: State): string =>
  `${cardSum(state.dealer)}$${cardSum(state.player)}`

export default class MonteCarlo {
  n0: number
  samples: Record<string, Loc>
  constructor(n0 = 100) {
    this.n0 = n0
    this.samples = {}
  }

  getSample(state: State): Loc {
    const key = getKey(state)
    if (!(key in this.samples)) {
      this.samples[key] = initLoc()
    }
    return this.samples[key]
  }

  getBestAction(state: State): Action {
    return this.getSample(step(state, 'hit')).value >
      this.getSample(step(state, 'stick')).value
      ? 'hit'
      : 'stick'
  }

  recordEntry(state: State, action: Action, result: number) {
    const sample = this.getSample(state)
    const count = ++sample[action]
    sample.visits++
    const error = result - sample.value
    sample.value += error * (1 / count)
  }

  conductEpisode(state: State): number {
    if (state.terminal) {
      return getReward(state)
    }

    // As we learn, get more biased towards optimality
    const e = this.n0 / (this.n0 + this.getSample(state).visits)
    const action =
      Math.random() < e ? getRandomAction() : this.getBestAction(state)

    const next = step(state, action)
    const result = this.conductEpisode(next)
    this.recordEntry(state, action, result)
    return result
  }
}
