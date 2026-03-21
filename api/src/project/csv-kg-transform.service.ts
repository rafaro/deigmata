import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

type CsvRow = Record<string, string>;

type CsvKgNamespace = {
  prefix?: string;
  iri?: string;
};

type CsvKgValueSource = {
  mode?: 'fixed' | 'column' | 'blank';
  value?: string;
};

type CsvKgLiteralNode = {
  kind: 'literal';
  valueSource?: CsvKgValueSource;
  labelSource?: CsvKgValueSource;
  datatype?: string;
  labelTemplate?: string;
  type?: string;
  valueTemplate?: string;
};

type CsvKgResourceNode = {
  kind?: 'resource';
  subjectSource?: CsvKgValueSource;
  labelSource?: CsvKgValueSource;
  properties?: CsvKgTriple[];
  triples?: CsvKgTriple[];
  iriTemplate?: string;
  labelTemplate?: string;
  title?: string;
  type?: string;
};

type CsvKgTriple = {
  predicate?: string;
  predicateSource?: CsvKgValueSource;
  object?: CsvKgLiteralNode | CsvKgResourceNode;
  target?: CsvKgLiteralNode | CsvKgResourceNode;
};

type CsvKgMapping = {
  baseIri?: string;
  delimiter?: string;
  namespaces?: CsvKgNamespace[];
  roots?: CsvKgResourceNode[];
};

type TransformContext = {
  edgeIds: Set<string>;
  mapping: CsvKgMapping;
  nodes: Map<string, Record<string, unknown>>;
  row: CsvRow;
  rowNumber: number;
};

@Injectable()
export class CsvKgTransformService {
  constructor(private readonly i18n: I18nService) { }

  transform(csvContent: string, mapping: CsvKgMapping, delimiter?: string) {
    if (!mapping || !Array.isArray(mapping.roots) || mapping.roots.length === 0) {
      throw new BadRequestException(
        this.i18n.t('msg.project.csvMappingMissing'),
      );
    }

    const rows = this.parseCsv(csvContent, delimiter || mapping.delimiter);
    const nodes = new Map<string, Record<string, unknown>>();
    const edges: Record<string, unknown>[] = [];
    const edgeIds = new Set<string>();

    rows.forEach((row, rowIndex) => {
      const context: TransformContext = {
        edgeIds,
        mapping,
        nodes,
        row,
        rowNumber: rowIndex + 1,
      };

      mapping.roots?.forEach((root, rootIndex) => {
        const path = [`root-${rootIndex}`];
        const sourceId = this.ensureResourceNode(root, context, path, true);

        if (!sourceId) {
          return;
        }

        this.applyTriples(
          sourceId,
          this.getTriples(root),
          context,
          edges,
          path,
        );
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  private applyTriples(
    sourceId: string,
    triples: CsvKgTriple[],
    context: TransformContext,
    edges: Record<string, unknown>[],
    path: string[],
  ) {
    triples.forEach((triple, tripleIndex) => {
      const predicate = this.resolvePredicate(triple, context);
      const target = triple.object ?? triple.target;

      if (!predicate || !target) {
        return;
      }

      const triplePath = [...path, `triple-${tripleIndex}`];
      const targetId =
        target.kind === 'literal'
          ? this.ensureLiteralNode(target, sourceId, predicate, context)
          : this.ensureResourceNode(target, context, triplePath, false);

      if (!targetId) {
        return;
      }

      this.addEdge(sourceId, targetId, predicate, context, edges);

      if (target.kind !== 'literal') {
        this.applyTriples(
          targetId,
          this.getTriples(target),
          context,
          edges,
          triplePath,
        );
      }
    });
  }

  private resolvePredicate(triple: CsvKgTriple, context: TransformContext) {
    const source = triple.predicateSource;

    if (source) {
      return this.resolveValueSource(source, context).trim();
    }

    return triple.predicate?.trim() ?? '';
  }

  private addEdge(
    sourceId: string,
    targetId: string,
    predicate: string,
    context: TransformContext,
    edges: Record<string, unknown>[],
  ) {
    const expandedPredicate = this.expandIdentifier(predicate, context.mapping);
    const edgeId = [sourceId, expandedPredicate, targetId].join('::');

    if (context.edgeIds.has(edgeId)) {
      return;
    }

    context.edgeIds.add(edgeId);
    edges.push({
      data: {
        id: edgeId,
        label: this.toDisplayLabel(predicate, context.mapping),
        predicate: expandedPredicate,
        source: sourceId,
        target: targetId,
      },
    });
  }

  private ensureLiteralNode(
    node: CsvKgLiteralNode,
    sourceId: string,
    predicate: string,
    context: TransformContext,
  ) {
    const value = this.resolveValueSource(
      node.valueSource,
      context,
      node.valueTemplate,
    ).trim();

    if (!value) {
      return null;
    }

    const label =
      this.resolveValueSource(
        node.labelSource,
        context,
        node.labelTemplate,
      ).trim() || value;
    const nodeId = this.buildLiteralNodeId(sourceId, predicate, value);

    this.upsertNode(context.nodes, nodeId, {
      id: nodeId,
      label,
      type: node.datatype?.trim() || node.type?.trim() || 'Literal',
      value,
    });

    return nodeId;
  }

  private ensureResourceNode(
    node: CsvKgResourceNode,
    context: TransformContext,
    path: string[],
    isRoot: boolean,
  ) {
    const resolvedId = this.resolveResourceIdentifier(node, context, path, isRoot);

    if (!resolvedId) {
      return null;
    }

    const rawLabel = this.resolveValueSource(
      node.labelSource,
      context,
      node.labelTemplate,
    ).trim();
    const label =
      rawLabel ||
      (resolvedId.startsWith('_:')
        ? node.title?.trim() || `Blank node ${context.rowNumber}`
        : this.resolveResourceLabel(node, resolvedId, context)) ||
      node.title?.trim() ||
      node.type?.trim() ||
      resolvedId;

    this.upsertNode(context.nodes, resolvedId, {
      id: resolvedId,
      label,
      type: node.type?.trim() || node.title?.trim() || 'Resource',
    });

    return resolvedId;
  }

  private resolveResourceIdentifier(
    node: CsvKgResourceNode,
    context: TransformContext,
    path: string[],
    isRoot: boolean,
  ) {
    const source = node.subjectSource;
    const fallbackTemplate = node.iriTemplate?.trim() || '';

    if (!isRoot && source?.mode === 'blank') {
      return this.buildBlankNodeId(context, path);
    }

    if (!isRoot && !source && !fallbackTemplate) {
      return this.buildBlankNodeId(context, path);
    }

    const rawIdentifier = this.resolveValueSource(
      source,
      context,
      fallbackTemplate,
    ).trim();

    if (!rawIdentifier) {
      return null;
    }

    return this.expandIdentifier(rawIdentifier, context.mapping);
  }

  private resolveValueSource(
    source: CsvKgValueSource | undefined,
    context: TransformContext,
    fallbackTemplate?: string,
  ) {
    if (source?.mode === 'blank') {
      return '';
    }

    if (source?.mode === 'column') {
      const column = source.value?.trim() || '';
      return context.row[column] ?? '';
    }

    const rawValue = source?.value ?? fallbackTemplate ?? '';
    return this.resolveTemplate(rawValue, context);
  }

  private getTriples(node: CsvKgResourceNode) {
    if (Array.isArray(node.triples)) {
      return node.triples;
    }

    if (Array.isArray(node.properties)) {
      return node.properties;
    }

    return [];
  }

  private buildBlankNodeId(context: TransformContext, path: string[]) {
    return `_:row${context.rowNumber}-${path.join('-')}`;
  }

  private buildLiteralNodeId(sourceId: string, predicate: string, value: string) {
    return [
      'lit',
      sourceId,
      this.slugifyIdentifierValue(predicate),
      this.slugifyIdentifierValue(value),
    ].join('::');
  }

  private upsertNode(
    nodes: Map<string, Record<string, unknown>>,
    nodeId: string,
    payload: Record<string, unknown>,
  ) {
    if (nodes.has(nodeId)) {
      const current = nodes.get(nodeId);
      nodes.set(nodeId, {
        ...current,
        data: {
          ...(current?.data as Record<string, unknown>),
          ...(payload as Record<string, unknown>),
        },
      });
      return;
    }

    nodes.set(nodeId, {
      data: payload,
    });
  }

  private resolveTemplate(template: string | undefined, context: TransformContext) {
    if (!template) {
      return '';
    }

    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawToken: string) => {
      const token = rawToken.trim();

      if (token === '$rowNumber') {
        return String(context.rowNumber);
      }

      if (token === '$baseIri') {
        return context.mapping.baseIri ?? '';
      }

      return context.row[token] ?? '';
    });
  }

  private expandIdentifier(value: string, mapping: CsvKgMapping) {
    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    if (trimmed.startsWith('_:')) {
      return this.slugifyIdentifierValue(trimmed);
    }

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed) || trimmed.startsWith('urn:')) {
      return this.slugifyIdentifierValue(trimmed);
    }

    const prefixed = trimmed.match(/^([A-Za-z][\w-]*):(.*)$/);
    if (prefixed) {
      const namespace = mapping.namespaces?.find((item) => item.prefix === prefixed[1]);
      if (namespace?.iri) {
        return `${namespace.iri}${this.slugifyIdentifierValue(prefixed[2])}`;
      }
    }

    if (mapping.baseIri) {
      const base = mapping.baseIri.endsWith('/') || mapping.baseIri.endsWith('#')
        ? mapping.baseIri
        : `${mapping.baseIri}/`;
      return `${base}${this.slugifyIdentifierValue(trimmed)}`;
    }

    return this.slugifyIdentifierValue(trimmed);
  }

  private resolveResourceLabel(
    node: CsvKgResourceNode,
    resolvedId: string,
    context: TransformContext,
  ) {
    const rawIdentifier = this.resolveValueSource(
      node.subjectSource,
      context,
      node.iriTemplate,
    ).trim();

    if (rawIdentifier && !/[/:#]/.test(rawIdentifier)) {
      return rawIdentifier;
    }

    return this.toDisplayLabel(resolvedId, context.mapping);
  }

  private toDisplayLabel(value: string, mapping: CsvKgMapping) {
    const trimmed = value.trim();
    const namespace = mapping.namespaces?.find((item) => item.iri && trimmed.startsWith(item.iri));

    if (namespace?.prefix && namespace.iri) {
      return `${namespace.prefix}:${this.decodeIdentifierLabel(trimmed.slice(namespace.iri.length))}`;
    }

    if (trimmed.includes('#')) {
      const hashSegments = trimmed.split('#');
      return this.decodeIdentifierLabel(hashSegments[hashSegments.length - 1] || trimmed);
    }

    if (trimmed.includes('/')) {
      const slashSegments = trimmed.split('/');
      return this.decodeIdentifierLabel(slashSegments[slashSegments.length - 1] || trimmed);
    }

    return this.decodeIdentifierLabel(trimmed);
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

    const slug = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (slug) {
      return slug;
    }

    return trimmed.toLowerCase().replace(/\s+/g, '-');
  }

  private decodeIdentifierLabel(value: string) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private parseCsv(csvContent: string, delimiter?: string) {
    const rows: string[][] = [];
    const normalized = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const separator = delimiter || this.detectDelimiter(normalized);
    let currentField = '';
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < normalized.length; index += 1) {
      const char = normalized[index];
      const nextChar = normalized[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          index += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (char === separator && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
        continue;
      }

      if (char === '\n' && !inQuotes) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentField = '';
        currentRow = [];
        continue;
      }

      currentField += char;
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    const populatedRows = rows.filter((row) => row.some((value) => value.trim() !== ''));
    if (populatedRows.length === 0) {
      return [];
    }

    const headers = populatedRows[0].map((header) => header.trim().replace(/^\uFEFF/, ''));

    return populatedRows.slice(1).map((columns) => {
      const row: CsvRow = {};

      headers.forEach((header, columnIndex) => {
        row[header] = (columns[columnIndex] ?? '').trim();
      });

      return row;
    });
  }

  private detectDelimiter(csvContent: string) {
    const firstLine = csvContent.split('\n').find((line) => line.trim().length > 0) ?? '';
    const candidates = [',', ';', '\t', '|'];

    return candidates.reduce((selected, current) => {
      const currentCount = firstLine.split(current).length;
      const selectedCount = firstLine.split(selected).length;

      return currentCount > selectedCount ? current : selected;
    }, ',');
  }
}
