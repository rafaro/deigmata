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
        predicate: 'http://example.com/resource/livesin',
        source: 'http://example.com/resource/ana',
        target: 'http://example.com/resource/sao-paulo',
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

  it('slugifies node ids while keeping labels readable', () => {
    const result = service.transform(
      'person,city\nAna Maria,São Paulo',
      {
        baseIri: 'http://example.com/resource',
        roots: [
          {
            kind: 'resource',
            subjectSource: { mode: 'column', value: 'person' },
            triples: [
              {
                predicateSource: { mode: 'fixed', value: 'livesIn' },
                object: {
                  kind: 'resource',
                  subjectSource: { mode: 'column', value: 'city' },
                },
              },
              {
                predicateSource: { mode: 'fixed', value: 'full name' },
                object: {
                  kind: 'literal',
                  valueSource: { mode: 'column', value: 'person' },
                },
              },
            ],
          },
        ],
      },
      ',',
    );

    expect(result.nodes).toHaveLength(3);
    expect(
      result.nodes.every((node) => !/\s/.test(String((node as any).data?.id))),
    ).toBe(true);
    expect(result.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/resource/sao-paulo',
            label: 'São Paulo',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/resource/ana-maria',
          }),
        }),
      ]),
    );
  });

  it('removes dots from slugified ids', () => {
    const result = service.transform(
      'person,city\nDr. João,St. Louis',
      {
        baseIri: 'http://example.com/resource',
        roots: [
          {
            kind: 'resource',
            subjectSource: { mode: 'column', value: 'person' },
            triples: [
              {
                predicateSource: { mode: 'fixed', value: 'lives.in' },
                object: {
                  kind: 'resource',
                  subjectSource: { mode: 'column', value: 'city' },
                },
              },
            ],
          },
        ],
      },
      ',',
    );

    expect(result.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/resource/dr-joao',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/resource/st-louis',
          }),
        }),
      ]),
    );
    expect(result.edges[0]).toMatchObject({
      data: {
        predicate: 'http://example.com/resource/lives-in',
      },
    });
  });
});
