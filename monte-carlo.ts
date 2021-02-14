import { range } from 'lodash'
import { State, Action, cardSum, step, getReward } from './easy21'

type Loc = {
  value: number
  visits: number
}
const initLoc = (): Loc => ({ value: 0, visits: 0 })
const getRandomAction = (): Action => (Math.random() < 0.5 ? 'hit' : 'stick')
const getKey = (state: State, action: Action): string =>
  `${cardSum(state.dealer)}$${cardSum(state.player)}$${action}`

export default class MonteCarlo {
  n0: number
  Q: Record<string, Loc>
  constructor(n0 = 100) {
    this.n0 = n0
    this.Q = {}
  }

  getSample(state: State, action: Action): Loc {
    const key = getKey(state, action)
    if (!(key in this.Q)) {
      this.Q[key] = initLoc()
    }
    return this.Q[key]
  }

  getBestAction(state: State): Action {
    return this.getSample(state, 'hit').value >
      this.getSample(state, 'stick').value
      ? 'hit'
      : 'stick'
  }

  getValue(state: State): number {
    const hit = this.getSample(state, 'hit').value
    const stick = this.getSample(state, 'stick').value
    return Math.max(hit, stick)
  }

  getVisits(state: State) {
    return (
      this.getSample(state, 'hit').visits +
      this.getSample(state, 'stick').visits
    )
  }

  recordEntry(state: State, action: Action, result: number) {
    const sample = this.getSample(state, action)
    const count = ++sample.visits
    const error = result - sample.value
    sample.value += error * (1 / count)
  }

  conductEpisode(state: State): number {
    if (state.terminal) {
      return getReward(state)
    }

    // As we learn, get more biased towards optimality
    const e = this.n0 / (this.n0 + this.getVisits(state))
    const action =
      Math.random() < e ? getRandomAction() : this.getBestAction(state)

    const next = step(state, action)
    const result = this.conductEpisode(next)
    this.recordEntry(state, action, result)
    return result
  }
}
