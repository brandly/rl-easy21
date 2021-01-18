const assert = require('assert')
const { range } = require('lodash')
type Action = 'hit' | 'stick'

type State = {
  dealer: Card[]
  player: Card[]
  terminal: boolean
}

type Card = {
  value: number
  color: 'red' | 'black'
}

const getValue = () => Math.floor(Math.random() * 10) + 1
const getColor = () => (Math.random() < 1 / 3 ? 'red' : 'black')
const getBlackCard = (): Card => ({ value: getValue(), color: 'black' })
const drawCard = (): Card => ({ value: getValue(), color: getColor() })
const outOfBounds = (value: number) => value < 1 || value > 21

const init = (): State => ({
  dealer: [getBlackCard()],
  player: [getBlackCard()],
  terminal: false
})

const cardSum = (list: Card[]): number =>
  list
    .map((card) => (card.color === 'red' ? -card.value : card.value))
    .reduce((a, b) => a + b, 0)

const step = (state: State, action: Action): State => {
  if (action === 'hit') {
    const player = state.player.concat(drawCard())
    return {
      ...state,
      player,
      terminal: outOfBounds(cardSum(player))
    }
  }

  if (action === 'stick') {
    let dealer = state.dealer
    while (cardSum(dealer) < 17) {
      dealer = dealer.concat(drawCard())
      if (outOfBounds(cardSum(dealer))) break
    }
    return {
      ...state,
      dealer,
      terminal: true
    }
  }

  throw new Error(`Unexpected action "${action}"`)
}

// monte-carlo
{
  type Loc = {
    value: number
    visits: number
    hit: number
    stick: number
  }
  const initLoc = () => ({ value: 0, visits: 0, hit: 0, stick: 0 })
  const episodes = 1000 * 1000
  const n0 = 100

  const getRandomAction = (): Action => (Math.random() < 0.5 ? 'hit' : 'stick')
  const getBestAction = (state: State): Action => {
    return getSample(step(state, 'hit')).value >
      getSample(step(state, 'stick')).value
      ? 'hit'
      : 'stick'
  }
  const getKey = (state: State): string =>
    `${cardSum(state.dealer)}$${cardSum(state.player)}`
  const samples: Record<string, Loc> = {}
  const getSample = (state: State): Loc => {
    const key = getKey(state)
    if (!(key in samples)) {
      samples[key] = initLoc()
    }
    return samples[key]
  }

  const recordEntry = (state: State, action: Action, result: number) => {
    const sample = getSample(state)
    const count = ++sample[action]
    sample.visits++
    sample.value += result * (1 / count)
  }

  const getReward = (state: State): number => {
    assert(state.terminal)

    const playerSum = cardSum(state.player)
    const dealerSum = cardSum(state.dealer)
    if (outOfBounds(dealerSum)) return 1
    if (outOfBounds(playerSum)) return -1
    if (playerSum === dealerSum) return 0
    return playerSum > dealerSum ? 1 : -1
  }
  const conductEpisode = (state: State): number => {
    if (state.terminal) {
      return getReward(state)
    }

    // As we learn, get more biased towards optimality
    const e = n0 / (n0 + getSample(state).visits)
    const action = Math.random() < e ? getRandomAction() : getBestAction(state)

    const next = step(state, action)
    const result = conductEpisode(next)
    recordEntry(state, action, result)
    return result
  }

  for (let i = 0; i < episodes; i++) {
    conductEpisode(init())
  }

  const toTable = (samples_) => {
    const table = range(1, 11).map(() => range(1, 22).map(() => 0))
    Object.entries(samples_).map(([key, { value }]) => {
      const [dealer, player] = key.split('$').map((n) => parseInt(n))
      if (dealer in table) {
        table[dealer][player] = value
      }
    })
    return table
  }

  console.log(JSON.stringify(toTable(samples), null, 2))
}
