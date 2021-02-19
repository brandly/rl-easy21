import { range } from 'lodash'
import { State, Action, cardSum, step, getReward } from './easy21'

export type Loc = {
  value: number
  visits: number
}
const initLoc = (): Loc => ({ value: 0, visits: 0 })
const getRandomAction = (): Action => (Math.random() < 0.5 ? 'hit' : 'stick')
const getKey = (state: State, action: Action): string =>
  `${cardSum(state.dealer)}$${cardSum(state.player)}$${action}`

export class Learner {
  n0: number
  Q: Record<string, Loc>
  constructor(n0 = 100) {
    this.n0 = n0
    this.Q = {}
  }

  getQ(state: State, action: Action): Loc {
    const key = getKey(state, action)
    if (!(key in this.Q)) {
      this.Q[key] = initLoc()
    }
    return this.Q[key]
  }

  getBestAction(state: State): Action {
    return this.getQ(state, 'hit').value > this.getQ(state, 'stick').value
      ? 'hit'
      : 'stick'
  }

  getAction(state: State): Action {
    // As we learn, get more biased towards optimality
    const e = this.n0 / (this.n0 + this.getVisits(state))
    return Math.random() < e ? getRandomAction() : this.getBestAction(state)
  }

  getValue(state: State): number {
    const hit = this.getQ(state, 'hit').value
    const stick = this.getQ(state, 'stick').value
    return Math.max(hit, stick)
  }

  getVisits(state: State) {
    return this.getQ(state, 'hit').visits + this.getQ(state, 'stick').visits
  }
}

export class MonteCarlo extends Learner {
  recordEntry(state: State, action: Action, result: number) {
    const sample = this.getQ(state, action)
    const visits = ++sample.visits
    const error = result - sample.value
    sample.value += error * (1 / visits)
  }

  conductEpisode(state: State): number {
    if (state.terminal) {
      return getReward(state)
    }
    const action = this.getAction(state)
    const next = step(state, action)
    const result = this.conductEpisode(next)
    this.recordEntry(state, action, result)
    return result
  }
}

export class SARSA extends Learner {
  lambda: number
  constructor({ lambda, n0 }: { lambda: number; n0: number }) {
    super(n0)
    this.lambda = lambda
  }

  conductEpisode(state: State): number {
    let action = this.getAction(state)
    while (!state.terminal) {
      // TODO: `step` should probably report reward
      const nextState = step(state, action)
      const nextAction = this.getAction(nextState)
      const reward = nextState.terminal ? getReward(nextState) : 0

      const location = this.getQ(state, action)
      const visits = ++location.visits
      const change =
        reward +
        this.lambda * this.getQ(nextState, nextAction).value -
        location.value
      location.value += change * (1 / visits)

      state = nextState
      action = nextAction
    }
    return getReward(state)
  }
}
