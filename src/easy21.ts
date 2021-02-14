const assert = (value) => {
  if (!value) throw new Error('Assertion failed')
}

export type Action = 'hit' | 'stick'

export type State = {
  dealer: Card[]
  player: Card[]
  terminal: boolean
}

export type Card = {
  value: number
  color: 'red' | 'black'
}

const getValue = () => Math.floor(Math.random() * 10) + 1
const getColor = () => (Math.random() < 1 / 3 ? 'red' : 'black')
const getBlackCard = (): Card => ({ value: getValue(), color: 'black' })
const drawCard = (): Card => ({ value: getValue(), color: getColor() })
const outOfBounds = (value: number) => value < 1 || value > 21
export const getReward = (state: State): number => {
  assert(state.terminal)

  const playerSum = cardSum(state.player)
  const dealerSum = cardSum(state.dealer)
  if (outOfBounds(dealerSum)) return 1
  if (outOfBounds(playerSum)) return -1
  if (playerSum === dealerSum) return 0
  return playerSum > dealerSum ? 1 : -1
}

export const init = (): State => ({
  dealer: [getBlackCard()],
  player: [getBlackCard()],
  terminal: false
})

export const cardSum = (list: Card[]): number =>
  list
    .map((card) => (card.color === 'red' ? -card.value : card.value))
    .reduce((a, b) => a + b, 0)

export const step = (state: State, action: Action): State => {
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
