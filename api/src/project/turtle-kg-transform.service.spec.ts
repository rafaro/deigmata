import { TurtleKgTransformService } from './turtle-kg-transform.service';

describe('TurtleKgTransformService', () => {
  const i18n = {
    t: (key: string, options?: { args?: Record<string, string | number> }) => {
      if (!options?.args) {
        return key;
      }

      return `${key}:${JSON.stringify(options.args)}`;
    },
  };

  let service: TurtleKgTransformService;

  beforeEach(() => {
    service = new TurtleKgTransformService(i18n as any);
  });

  it('transforms prefixed Turtle triples into KG nodes and edges', () => {
    const result = service.transform(`
      @prefix ex: <http://example.com/> .
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .

      ex:ana foaf:name "Ana" ;
        ex:livesIn ex:sao-paulo .
    `);

    expect(result.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/ana',
            label: 'Ana',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/sao-paulo',
            label: 'ex:sao-paulo',
          }),
        }),
      ]),
    );
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            predicate: 'http://xmlns.com/foaf/0.1/name',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            predicate: 'http://example.com/livesIn',
            source: 'http://example.com/ana',
            target: 'http://example.com/sao-paulo',
          }),
        }),
      ]),
    );
  });

  it('supports rdf:type and blank node property lists', () => {
    const result = service.transform(`
      @prefix ex: <http://example.com/> .
      @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

      ex:ana a ex:Person ;
        ex:address [ ex:city "Sao Paulo" ] .
    `);

    expect(result.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'http://example.com/ana',
            type: 'ex:Person',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: '_:b1',
            type: 'Blank node',
          }),
        }),
      ]),
    );
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            predicate: 'http://example.com/address',
            target: '_:b1',
          }),
        }),
      ]),
    );
  });

  it('creates typed literal nodes for numeric values', () => {
    const result = service.transform(`
      @prefix ex: <http://example.com/> .

      ex:item ex:score 9.5 .
    `);

    expect(result.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            value: '9.5',
            datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
          }),
        }),
      ]),
    );
    expect(result.edges).toHaveLength(1);
  });
});
