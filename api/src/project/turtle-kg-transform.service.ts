import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

type TurtleNamespace = {
  prefix: string;
  iri: string;
};

type TurtleResourceTerm = {
  kind: 'resource';
  value: string;
  label?: string;
  raw?: string;
  nodeType?: string;
};

type TurtleLiteralTerm = {
  kind: 'literal';
  value: string;
  datatype?: string;
  language?: string;
};

type TurtleTerm = TurtleResourceTerm | TurtleLiteralTerm;

type TurtleTriple = {
  subject: TurtleResourceTerm;
  predicate: TurtleResourceTerm;
  object: TurtleTerm;
};

type TurtleToken =
  | { type: 'directive'; value: '@prefix' | '@base'; position: number }
  | { type: 'keyword'; value: 'PREFIX' | 'BASE' | 'a'; position: number }
  | { type: 'iri'; value: string; position: number }
  | { type: 'prefixed'; value: string; position: number }
  | { type: 'word'; value: string; position: number }
  | { type: 'string'; value: string; position: number }
  | { type: 'number'; value: string; position: number }
  | { type: 'boolean'; value: string; position: number }
  | { type: 'blankNode'; value: string; position: number }
  | { type: 'language'; value: string; position: number }
  | { type: 'punct'; value: '.' | ';' | ',' | '[' | ']' | '(' | ')' | '^^'; position: number }
  | { type: 'eof'; value: ''; position: number };

type TurtleParseResult = {
  baseIri: string;
  namespaces: TurtleNamespace[];
  triples: TurtleTriple[];
};

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const LABEL_PREDICATES = new Set([
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://www.w3.org/2004/02/skos/core#prefLabel',
  'http://schema.org/name',
  'http://xmlns.com/foaf/0.1/name',
]);

const DEFAULT_NAMESPACES: TurtleNamespace[] = [
  { prefix: 'rdf', iri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
  { prefix: 'rdfs', iri: 'http://www.w3.org/2000/01/rdf-schema#' },
  { prefix: 'xsd', iri: 'http://www.w3.org/2001/XMLSchema#' },
  { prefix: 'owl', iri: 'http://www.w3.org/2002/07/owl#' },
  { prefix: 'schema', iri: 'http://schema.org/' },
  { prefix: 'foaf', iri: 'http://xmlns.com/foaf/0.1/' },
  { prefix: 'skos', iri: 'http://www.w3.org/2004/02/skos/core#' },
];

@Injectable()
export class TurtleKgTransformService {
  constructor(private readonly i18n: I18nService) { }

  transform(turtleContent: string) {
    const parser = new TurtleDocumentParser(turtleContent, this.i18n);
    const parsed = parser.parse();

    return this.buildGraph(parsed);
  }

  private buildGraph(parsed: TurtleParseResult) {
    const nodes = new Map<string, Record<string, unknown>>();
    const edges: Record<string, unknown>[] = [];
    const edgeIds = new Set<string>();

    parsed.triples.forEach((triple) => {
      this.ensureResourceNode(nodes, triple.subject, parsed.namespaces);

      const targetId =
        triple.object.kind === 'literal'
          ? this.ensureLiteralNode(nodes, triple)
          : this.ensureResourceNode(nodes, triple.object, parsed.namespaces);

      if (!targetId) {
        return;
      }

      const predicateLabel = this.toDisplayLabel(triple.predicate.value, parsed.namespaces);
      const edgeId = `${triple.subject.value}::${triple.predicate.value}::${targetId}`;

      if (!edgeIds.has(edgeId)) {
        edgeIds.add(edgeId);
        edges.push({
          data: {
            id: edgeId,
            label: predicateLabel,
            predicate: triple.predicate.value,
            source: triple.subject.value,
            target: targetId,
          },
        });
      }

      if (triple.object.kind === 'resource' && triple.predicate.value === RDF_TYPE) {
        this.mergeNode(nodes, triple.subject.value, {
          type: triple.object.label || this.toDisplayLabel(triple.object.value, parsed.namespaces),
        });
      }

      if (triple.object.kind === 'literal' && LABEL_PREDICATES.has(triple.predicate.value)) {
        this.mergeNode(nodes, triple.subject.value, {
          label: triple.object.value,
        });
      }
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  private ensureResourceNode(
    nodes: Map<string, Record<string, unknown>>,
    term: TurtleResourceTerm,
    namespaces: TurtleNamespace[],
  ) {
    const current = nodes.get(term.value);
    const currentData = (current?.data || {}) as Record<string, unknown>;
    const label = term.label || this.toDisplayLabel(term.value, namespaces);
    const type = term.nodeType || (term.value.startsWith('_:') ? 'Blank node' : 'Resource');

    this.mergeNode(nodes, term.value, {
      id: term.value,
      label: currentData.label || label,
      type: currentData.type || type,
    });

    return term.value;
  }

  private ensureLiteralNode(
    nodes: Map<string, Record<string, unknown>>,
    triple: TurtleTriple,
  ) {
    if (triple.object.kind !== 'literal') {
      return null;
    }

    const nodeId = [
      'lit',
      this.slugifyIdentifierValue(triple.subject.value),
      this.slugifyIdentifierValue(triple.predicate.value),
      this.slugifyIdentifierValue(triple.object.datatype || triple.object.language || 'literal'),
      this.slugifyIdentifierValue(triple.object.value),
    ].join('::');

    this.mergeNode(nodes, nodeId, {
      id: nodeId,
      label: triple.object.value,
      type: triple.object.datatype || (triple.object.language ? `@${triple.object.language}` : 'Literal'),
      value: triple.object.value,
      datatype: triple.object.datatype,
      language: triple.object.language,
    });

    return nodeId;
  }

  private mergeNode(
    nodes: Map<string, Record<string, unknown>>,
    nodeId: string,
    payload: Record<string, unknown>,
  ) {
    const current = nodes.get(nodeId);

    if (current) {
      nodes.set(nodeId, {
        ...current,
        data: {
          ...(current.data as Record<string, unknown>),
          ...payload,
        },
      });
      return;
    }

    nodes.set(nodeId, {
      data: payload,
    });
  }

  private toDisplayLabel(value: string, namespaces: TurtleNamespace[]) {
    if (value.startsWith('_:')) {
      return `Blank node ${value.slice(2)}`;
    }

    const namespace = namespaces.find((item) => item.iri && value.startsWith(item.iri));
    if (namespace?.iri) {
      const suffix = value.slice(namespace.iri.length);
      return namespace.prefix ? `${namespace.prefix}:${this.decodeIdentifierLabel(suffix)}` : this.decodeIdentifierLabel(suffix);
    }

    if (value.includes('#')) {
      const segments = value.split('#');
      return this.decodeIdentifierLabel(segments[segments.length - 1] || value);
    }

    if (value.includes('/')) {
      const segments = value.split('/');
      return this.decodeIdentifierLabel(segments[segments.length - 1] || value);
    }

    return this.decodeIdentifierLabel(value);
  }

  private slugifyIdentifierValue(value: string) {
    return value
      .split(/([/:#])/)
      .map((segment) => {
        if (segment === '/' || segment === ':' || segment === '#') {
          return segment;
        }

        return this.slugifyIdentifierSegment(segment);
      })
      .join('');
  }

  private slugifyIdentifierSegment(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    return trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private decodeIdentifierLabel(value: string) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}

class TurtleDocumentParser {
  private readonly tokenizer: TurtleTokenizer;

  private current: TurtleToken;

  private readonly triples: TurtleTriple[] = [];

  private readonly namespaces = new Map<string, string>();

  private blankNodeCounter = 0;

  private baseIri = '';

  constructor(
    private readonly input: string,
    private readonly i18n: I18nService,
  ) {
    DEFAULT_NAMESPACES.forEach((namespace) => {
      this.namespaces.set(namespace.prefix, namespace.iri);
    });
    this.tokenizer = new TurtleTokenizer(input);
    this.current = this.tokenizer.nextToken();
  }

  parse(): TurtleParseResult {
    while (this.current.type !== 'eof') {
      if (this.current.type === 'directive' || (this.current.type === 'keyword' && (this.current.value === 'PREFIX' || this.current.value === 'BASE'))) {
        this.parseDirective();
        this.consumePunctuation('.');
        continue;
      }

      const subject = this.parseSubject();
      this.parsePredicateObjectList(subject);
      this.consumePunctuation('.');
    }

    return {
      baseIri: this.baseIri,
      namespaces: Array.from(this.namespaces.entries()).map(([prefix, iri]) => ({
        prefix,
        iri,
      })),
      triples: this.triples,
    };
  }

  private parseDirective() {
    const token = this.current;

    if (
      (token.type === 'directive' && token.value === '@prefix') ||
      (token.type === 'keyword' && token.value === 'PREFIX')
    ) {
      this.advance();
      const prefixToken = this.current;

      if (prefixToken.type !== 'prefixed' || !prefixToken.value.endsWith(':')) {
        this.throwParseError(prefixToken.position);
      }

      const prefix = prefixToken.value.slice(0, -1);
      this.advance();
      const iri = this.consumeIri();
      this.namespaces.set(prefix, iri);
      return;
    }

    if (
      (token.type === 'directive' && token.value === '@base') ||
      (token.type === 'keyword' && token.value === 'BASE')
    ) {
      this.advance();
      this.baseIri = this.consumeIri();
      return;
    }

    this.throwParseError(token.position);
  }

  private parsePredicateObjectList(subject: TurtleResourceTerm) {
    while (true) {
      const predicate = this.parseVerb();
      this.parseObjectList(subject, predicate);

      if (!this.matchPunctuation(';')) {
        return;
      }

      if (
        this.current.type === 'punct' &&
        (this.current.value === '.' || this.current.value === ']')
      ) {
        return;
      }
    }
  }

  private parseObjectList(subject: TurtleResourceTerm, predicate: TurtleResourceTerm) {
    while (true) {
      const object = this.parseObject();
      this.triples.push({ subject, predicate, object });

      if (!this.matchPunctuation(',')) {
        return;
      }
    }
  }

  private parseSubject() {
    if (this.current.type === 'punct' && this.current.value === '[') {
      return this.parseBlankNodePropertyList();
    }

    return this.parseResource();
  }

  private parseObject() {
    if (this.current.type === 'string' || this.current.type === 'number' || this.current.type === 'boolean') {
      return this.parseLiteral();
    }

    if (this.current.type === 'punct' && this.current.value === '[') {
      return this.parseBlankNodePropertyList();
    }

    if (this.current.type === 'punct' && this.current.value === '(') {
      throw new BadRequestException(this.i18n.t('msg.project.turtleCollectionsUnsupported'));
    }

    return this.parseResource();
  }

  private parseVerb() {
    if (this.current.type === 'keyword' && this.current.value === 'a') {
      const predicate = this.createResourceTerm(RDF_TYPE, 'a', 'Predicate');
      this.advance();
      return predicate;
    }

    return this.parseResource();
  }

  private parseBlankNodePropertyList() {
    const startPosition = this.current.position;
    this.consumePunctuation('[');

    const blankNode = this.createGeneratedBlankNode();

    if (this.current.type === 'punct' && this.current.value === ']') {
      this.advance();
      return blankNode;
    }

    this.parsePredicateObjectList(blankNode);
    this.consumePunctuation(']');

    if (!blankNode.value) {
      this.throwParseError(startPosition);
    }

    return blankNode;
  }

  private parseResource() {
    const token = this.current;

    if (token.type === 'iri') {
      this.advance();
      return this.createResourceTerm(this.resolveIri(token.value), token.value);
    }

    if (token.type === 'prefixed') {
      this.advance();
      return this.createResourceTerm(this.resolvePrefixedName(token.value), token.value);
    }

    if (token.type === 'blankNode') {
      this.advance();
      return this.createResourceTerm(token.value, `Blank node ${token.value.slice(2)}`, 'Blank node');
    }

    this.throwParseError(token.position);
  }

  private parseLiteral(): TurtleLiteralTerm {
    const token = this.current;

    if (token.type === 'string') {
      this.advance();
      const literal: TurtleLiteralTerm = {
        kind: 'literal',
        value: token.value,
      };

      if (this.current.type === 'language') {
        literal.language = this.current.value;
        this.advance();
        return literal;
      }

      if (this.matchPunctuation('^^')) {
        const datatype = this.parseResource();
        literal.datatype = datatype.value;
      }

      return literal;
    }

    if (token.type === 'boolean') {
      this.advance();
      return {
        kind: 'literal',
        value: token.value,
        datatype: 'http://www.w3.org/2001/XMLSchema#boolean',
      };
    }

    if (token.type === 'number') {
      this.advance();
      return {
        kind: 'literal',
        value: token.value,
        datatype: this.resolveNumericDatatype(token.value),
      };
    }

    this.throwParseError(token.position);
  }

  private resolveNumericDatatype(value: string) {
    if (/[eE]/.test(value)) {
      return 'http://www.w3.org/2001/XMLSchema#double';
    }

    if (value.includes('.')) {
      return 'http://www.w3.org/2001/XMLSchema#decimal';
    }

    return 'http://www.w3.org/2001/XMLSchema#integer';
  }

  private createGeneratedBlankNode() {
    this.blankNodeCounter += 1;
    return this.createResourceTerm(
      `_:b${this.blankNodeCounter}`,
      `Blank node ${this.blankNodeCounter}`,
      'Blank node',
    );
  }

  private createResourceTerm(value: string, raw?: string, nodeType?: string): TurtleResourceTerm {
    return {
      kind: 'resource',
      value,
      raw,
      nodeType,
      label: value.startsWith('_:') ? raw : undefined,
    };
  }

  private resolveIri(value: string) {
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) || value.startsWith('_:')) {
      return value;
    }

    if (this.baseIri) {
      try {
        return new URL(value, this.baseIri).toString();
      } catch {
        return `${this.baseIri}${value}`;
      }
    }

    return value;
  }

  private resolvePrefixedName(value: string) {
    const splitIndex = value.indexOf(':');
    const prefix = value.slice(0, splitIndex);
    const localName = value.slice(splitIndex + 1);
    const namespaceIri = this.namespaces.get(prefix);

    if (!namespaceIri) {
      throw new BadRequestException(
        this.i18n.t('msg.project.turtleUnknownPrefix', { args: { prefix } }),
      );
    }

    return `${namespaceIri}${localName}`;
  }

  private consumeIri() {
    if (this.current.type !== 'iri') {
      this.throwParseError(this.current.position);
    }

    const value = this.resolveIri(this.current.value);
    this.advance();
    return value;
  }

  private consumePunctuation(value: '.' | '[' | ']' | ';' | ',' | '^^') {
    if (this.current.type !== 'punct' || this.current.value !== value) {
      this.throwParseError(this.current.position);
    }

    this.advance();
  }

  private matchPunctuation(value: '.' | '[' | ']' | ';' | ',' | '^^') {
    if (this.current.type === 'punct' && this.current.value === value) {
      this.advance();
      return true;
    }

    return false;
  }

  private advance() {
    this.current = this.tokenizer.nextToken();
  }

  private throwParseError(position: number): never {
    throw new BadRequestException(
      this.i18n.t('msg.project.turtleParseError', {
        args: {
          position: position + 1,
        },
      }),
    );
  }
}

class TurtleTokenizer {
  private position = 0;

  constructor(private readonly input: string) { }

  nextToken(): TurtleToken {
    this.skipWhitespaceAndComments();

    if (this.position >= this.input.length) {
      return { type: 'eof', value: '', position: this.position };
    }

    const char = this.input[this.position];
    const start = this.position;

    if (char === '^' && this.input[this.position + 1] === '^') {
      this.position += 2;
      return { type: 'punct', value: '^^', position: start };
    }

    if (char === '.' || char === ';' || char === ',' || char === '[' || char === ']' || char === '(' || char === ')') {
      this.position += 1;
      return { type: 'punct', value: char, position: start } as TurtleToken;
    }

    if (char === '<') {
      return {
        type: 'iri',
        value: this.readIri(),
        position: start,
      };
    }

    if (char === '"' || char === '\'') {
      return {
        type: 'string',
        value: this.readString(),
        position: start,
      };
    }

    if (char === '@') {
      const value = this.readWord();
      if (value === '@prefix' || value === '@base') {
        return { type: 'directive', value, position: start };
      }

      return {
        type: 'language',
        value: value.slice(1),
        position: start,
      };
    }

    const value = this.readWord();

    if (value === 'PREFIX' || value === 'BASE' || value === 'a') {
      return { type: 'keyword', value, position: start };
    }

    if (value === 'true' || value === 'false') {
      return { type: 'boolean', value, position: start };
    }

    if (/^[+-]?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)$/.test(value)) {
      return { type: 'number', value, position: start };
    }

    if (value.startsWith('_:')) {
      return { type: 'blankNode', value, position: start };
    }

    if (value.includes(':')) {
      return { type: 'prefixed', value, position: start };
    }

    return { type: 'word', value, position: start };
  }

  private skipWhitespaceAndComments() {
    while (this.position < this.input.length) {
      const char = this.input[this.position];

      if (/\s/.test(char)) {
        this.position += 1;
        continue;
      }

      if (char === '#') {
        while (this.position < this.input.length && this.input[this.position] !== '\n') {
          this.position += 1;
        }
        continue;
      }

      return;
    }
  }

  private readIri() {
    let value = '';
    this.position += 1;

    while (this.position < this.input.length) {
      const char = this.input[this.position];

      if (char === '>') {
        this.position += 1;
        return value;
      }

      if (char === '\\') {
        this.position += 1;
        value += this.input[this.position] || '';
        this.position += 1;
        continue;
      }

      value += char;
      this.position += 1;
    }

    return value;
  }

  private readString() {
    const quote = this.input[this.position];
    const triple = this.input.slice(this.position, this.position + 3) === quote.repeat(3);
    let value = '';

    this.position += triple ? 3 : 1;

    while (this.position < this.input.length) {
      if (triple && this.input.slice(this.position, this.position + 3) === quote.repeat(3)) {
        this.position += 3;
        return value;
      }

      const char = this.input[this.position];

      if (!triple && char === quote) {
        this.position += 1;
        return value;
      }

      if (char === '\\') {
        const escape = this.input[this.position + 1];
        value += this.decodeEscape(escape);
        this.position += 2;
        continue;
      }

      value += char;
      this.position += 1;
    }

    return value;
  }

  private decodeEscape(value: string) {
    switch (value) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case '"':
        return '"';
      case '\'':
        return '\'';
      case '\\':
        return '\\';
      default:
        return value || '';
    }
  }

  private readWord() {
    let value = '';

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      const next = this.input[this.position + 1] || '';

      if (/\s/.test(char) || char === '#' || char === '[' || char === ']' || char === '(' || char === ')' || char === ';' || char === ',' || char === '^') {
        break;
      }

      if (char === '.' && (!next || /\s|#|;|,|\]|\)/.test(next))) {
        break;
      }

      if (char === '<' || char === '"' || char === '\'') {
        break;
      }

      value += char;
      this.position += 1;
    }

    return value;
  }
}
