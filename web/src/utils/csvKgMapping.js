const cloneJson = (value) => JSON.parse(JSON.stringify(value))

export const createValueSource = (mode = 'column', value = '') => ({
  mode,
  value,
})

export const createPredicateSource = (mode = 'fixed', value = '') => ({
  mode,
  value,
})

export const createResourceNode = (overrides = {}) => ({
  kind: 'resource',
  title: '',
  subjectSource: createValueSource('column', ''),
  labelSource: createValueSource('fixed', ''),
  type: '',
  triples: [],
  ...overrides,
})

export const createLiteralNode = (overrides = {}) => ({
  kind: 'literal',
  valueSource: createValueSource('column', ''),
  labelSource: createValueSource('fixed', ''),
  datatype: 'Literal',
  ...overrides,
})

export const createTriple = (kind = 'literal') => ({
  predicate: '',
  predicateSource: createPredicateSource('fixed', ''),
  object: kind === 'resource' ? createResourceNode() : createLiteralNode(),
})

const normalizeValueSource = (source, fallbackMode = 'column') => {
  if (!source || typeof source !== 'object') {
    return createValueSource(fallbackMode, '')
  }

  return {
    mode: source.mode || fallbackMode,
    value: source.value || '',
  }
}

const normalizeLiteralNode = (node) => ({
  kind: 'literal',
  valueSource: normalizeValueSource(node?.valueSource, 'column'),
  labelSource: normalizeValueSource(node?.labelSource, 'fixed'),
  datatype: node?.datatype || node?.type || 'Literal',
})

const normalizeTriple = (triple) => {
  const object = triple?.object || triple?.target
  const predicate = triple?.predicate || ''

  return {
    predicate,
    predicateSource: normalizeValueSource(
      triple?.predicateSource || createPredicateSource('fixed', predicate),
      'fixed',
    ),
    object:
      object?.kind === 'resource'
        ? normalizeResourceNode(object)
        : normalizeLiteralNode(object),
  }
}

export const normalizeResourceNode = (node) => ({
  kind: 'resource',
  title: node?.title || '',
  subjectSource: normalizeValueSource(node?.subjectSource, 'column'),
  labelSource: normalizeValueSource(node?.labelSource, 'fixed'),
  type: node?.type || '',
  triples: Array.isArray(node?.triples)
    ? node.triples.map(normalizeTriple)
    : Array.isArray(node?.properties)
      ? node.properties.map(normalizeTriple)
      : [],
})

export const createDefaultCsvMapping = () => ({
  baseIri: 'http://example.com/resource',
  delimiter: ',',
  namespaces: [
    { prefix: 'rdf', iri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
    { prefix: 'rdfs', iri: 'http://www.w3.org/2000/01/rdf-schema#' },
  ],
  roots: [createResourceNode({ title: 'Raiz 1' })],
})

export const normalizeCsvMapping = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return createDefaultCsvMapping()
  }

  const normalized = cloneJson(mapping)
  normalized.baseIri = normalized.baseIri || 'http://example.com/resource'
  normalized.delimiter = normalized.delimiter || ','
  normalized.namespaces = Array.isArray(normalized.namespaces) ? normalized.namespaces : []
  normalized.roots = Array.isArray(normalized.roots)
    ? normalized.roots.map(normalizeResourceNode)
    : [createResourceNode({ title: 'Raiz 1' })]

  if (normalized.roots.length === 0) {
    normalized.roots.push(createResourceNode({ title: 'Raiz 1' }))
  }

  return normalized
}

export const parseCsvHeaders = (csvContent, forcedDelimiter = '') => {
  if (!csvContent || !csvContent.trim()) {
    return []
  }

  const normalized = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstLine = normalized.split('\n').find((line) => line.trim())

  if (!firstLine) {
    return []
  }

  const delimiters = [',', ';', '\t', '|']
  const delimiter =
    forcedDelimiter ||
    delimiters.reduce((selected, current) => {
      const currentCount = firstLine.split(current).length
      const selectedCount = firstLine.split(selected).length
      return currentCount > selectedCount ? current : selected
    }, ',')

  return firstLine
    .split(delimiter)
    .map((header) => header.trim().replace(/^\uFEFF/, ''))
    .filter(Boolean)
}
