import vehicleData from '../../data/philippine-vehicle-sizes.json'

export type VehicleSize = 'Small' | 'Medium' | 'Large' | 'X-Large' | 'XX-Large'

export interface VehicleKnowledgeEntry {
  make: string
  model: string
  size: VehicleSize
}

export interface VehicleSuggestion extends VehicleKnowledgeEntry {
  class: string | null
  year: number | null
}

const vehicles = vehicleData as VehicleKnowledgeEntry[]

const apiClassSizeMap: Record<string, VehicleSize> = {
  'minicompact car': 'Small',
  'subcompact car': 'Small',
  'two seater': 'Small',
  'compact car': 'Medium',
  'small station wagon': 'Medium',
  'midsize car': 'Large',
  'midsize station wagon': 'Large',
  'small sport utility vehicle': 'Large',
  'large car': 'X-Large',
  'standard sport utility vehicle': 'X-Large',
  'small pickup truck': 'X-Large',
  minivan: 'X-Large',
  'standard pickup truck': 'XX-Large',
  vans: 'XX-Large',
}

const textHeuristics: Array<{ terms: string[]; size: VehicleSize }> = [
  { terms: ['jeepney', 'heavy duty', 'cargo', 'long wheelbase'], size: 'XX-Large' },
  {
    terms: ['pickup', 'truck', 'full size suv', 'raptor', '4x4', 'f 150', 'silverado'],
    size: 'X-Large',
  },
  { terms: ['midsize', 'crossover', 'wagon', 'utility'], size: 'Large' },
  { terms: ['compact', 'sedan', 'hatchback'], size: 'Medium' },
  { terms: ['mini', 'micro', 'sub', 'city car', 'brio', 'wigo', 'alto', 'mira'], size: 'Small' },
]

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
const compact = (value: string) => normalize(value).replace(/\s+/g, '')

const ranked = (
  entries: VehicleKnowledgeEntry[],
  query: string,
  selector: (entry: VehicleKnowledgeEntry) => string,
) => {
  const normalizedQuery = normalize(query)
  const compactQuery = compact(query)

  return [...entries].sort((a, b) => {
    const aValue = normalize(selector(a))
    const bValue = normalize(selector(b))
    const aCompact = compact(selector(a))
    const bCompact = compact(selector(b))

    const aScore = [
      aValue.startsWith(normalizedQuery) ? 0 : 1,
      aValue.includes(normalizedQuery) ? 0 : 1,
      aCompact.startsWith(compactQuery) ? 0 : 1,
      selector(a),
    ]
    const bScore = [
      bValue.startsWith(normalizedQuery) ? 0 : 1,
      bValue.includes(normalizedQuery) ? 0 : 1,
      bCompact.startsWith(compactQuery) ? 0 : 1,
      selector(b),
    ]

    return aScore.join('|').localeCompare(bScore.join('|'))
  })
}

export const resolveVehicleSize = (
  make = '',
  model = '',
  apiClass = '',
  rawText = '',
): VehicleSize => {
  const normalizedMake = compact(make)
  const normalizedModel = compact(model)
  const exact = vehicles.find(
    (entry) => compact(entry.make) === normalizedMake && compact(entry.model) === normalizedModel,
  )

  if (exact) {
    return exact.size
  }

  const apiClassSize = apiClassSizeMap[normalize(apiClass)]

  if (apiClassSize) {
    return apiClassSize
  }

  const searchable = normalize([make, model, rawText].filter(Boolean).join(' '))

  for (const heuristic of textHeuristics) {
    if (heuristic.terms.some((term) => searchable.includes(term))) {
      return heuristic.size
    }
  }

  return 'Medium'
}

export const findKnownVehicle = (make = '', model = ''): VehicleKnowledgeEntry | undefined => {
  const normalizedMake = compact(make)
  const normalizedModel = compact(model)

  return vehicles.find(
    (entry) => compact(entry.make) === normalizedMake && compact(entry.model) === normalizedModel,
  )
}

export const isKnownVehicle = (make = '', model = ''): boolean =>
  findKnownVehicle(make, model) !== undefined

export const suggestVehicleMakes = (query: string): VehicleSuggestion[] => {
  if (query.trim().length < 2) {
    return []
  }

  const seen = new Set<string>()

  return ranked(vehicles, query, (entry) => entry.make)
    .filter((entry) => normalize(entry.make).includes(normalize(query)))
    .filter((entry) => {
      const key = compact(entry.make)

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
    .map((entry) => ({ ...entry, class: null, year: null }))
}

export const suggestVehicleModels = (make: string, query: string): VehicleSuggestion[] => {
  if (query.trim().length < 2) {
    return []
  }

  const normalizedQuery = normalize(query)
  const normalizedMake = compact(make)
  const makeMatches = normalizedMake
    ? vehicles.filter((entry) => compact(entry.make) === normalizedMake)
    : vehicles

  return ranked(makeMatches, query, (entry) => entry.model)
    .filter(
      (entry) =>
        normalize(entry.model).includes(normalizedQuery) ||
        compact(entry.model).includes(compact(query)),
    )
    .map((entry) => ({ ...entry, class: null, year: null }))
}
