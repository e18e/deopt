export * as ICState from './ic-state.js'

export const MIN_SEVERITY = 1

export const severityColors = [
    'green'
  , 'blue'
  , 'dark-red'
]

export function highestSeverity(infos) {
  return infos.reduce(
      (highest, { severity }) => severity > highest ? severity : highest
    , MIN_SEVERITY
  )
}

export function lowestSeverity(infos) {
  return infos.reduce(
      (lowest, { severity }) => severity < lowest ? severity : lowest
    , 99
  )
}
