import { CsvKgTransformService } from './csv-kg-transform.service';

describe('CsvKgTransformService', () => {
  const i18n = {
    t: (key: string) => key,
  };

  let service: CsvKgTransformService;

  beforeEach(() => {
    service = new CsvKgTransformService(i18n as any);
  });

  it('transforms CSV rows into a graph and resolves predicate from a column', () => {
    const result = service.transform(
      'person,relation,city\nAna,livesIn,Sao Paulo',
      {
        baseIri: 'http://example.com/resource',
        roots: [
          {
            kind: 'resource',
            subjectSource: { mode: 'column', value: 'person' },
            labelSource: { mode: 'column', value: 'person' },
            type: 'Person',
            triples: [
              {
                predicateSource: { mode: 'column', value: 'relation' },
                object: {
                  kind: 'resource',
                  subjectSource: { mode: 'column', value: 'city' },
                  labelSource: { mode: 'column', value: 'city' },
                  type: 'City',
                },
              },
            ],
          },
        ],
      },
      ',',
    );

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({
      data: {
        label: 'livesIn',
        predicate: 'http://example.com/resource/livesIn',
        source: 'http://example.com/resource/Ana',
        target: 'http://example.com/resource/Sao Paulo',
      },
    });
  });

  it('creates literal objects from a fixed predicate and column value', () => {
    const result = service.transform(
      'person,age\nAna,34',
      {
        baseIri: 'http://example.com/resource',
        roots: [
          {
            kind: 'resource',
            subjectSource: { mode: 'column', value: 'person' },
            triples: [
              {
                predicateSource: { mode: 'fixed', value: 'hasAge' },
                object: {
                  kind: 'literal',
                  valueSource: { mode: 'column', value: 'age' },
                  datatype: 'xsd:integer',
                },
              },
            ],
          },
        ],
      },
      ',',
    );

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes[1]).toMatchObject({
      data: {
        label: '34',
        type: 'xsd:integer',
        value: '34',
      },
    });
  });
});
