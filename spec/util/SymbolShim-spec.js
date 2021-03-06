/* globals __root__ */
var SymbolShim = require('../../dist/cjs/util/SymbolShim');
var Map = require('../../dist/cjs/util/Map').Map;
var Rx = require('../../dist/cjs/Rx');
var polyfillSymbol = SymbolShim.polyfillSymbol;
var ensureIterator = SymbolShim.ensureIterator;

describe('SymbolShim.polyfillSymbol', function () {
  it('should polyfill Symbol to be a function that returns a primitive that is unique', function () {
    var Symbol = polyfillSymbol({ });

    expect(typeof Symbol).toBe('function');
    var x = Symbol('test');
    var y = Symbol('test');
    expect(x !== y).toBe(true); // should be obvious, but this is the important part.

    expect(x).toBe('@@Symbol(test):0');
    expect(y).toBe('@@Symbol(test):1');
  });

  it('should setup symbol if root does not have it', function () {
    var root = {};

    var result = polyfillSymbol(root);
    expect(root.Symbol).toBeDefined();
    expect(result.observable).toBeDefined();
    expect(result.iterator).toBeDefined();
    expect(result.for).toBeDefined();
  });

  it('should add a for method', function () {
    var root = {};
    var result = polyfillSymbol(root);
    expect(typeof result.for).toBe('function');

    var test = result.for('test');
    expect(test).toBe('@@test');
  });

  it('should add a for method even if Symbol already exists but does not have for', function () {
    var root = {
      Symbol: {}
    };
    var result = polyfillSymbol(root);

    expect(typeof result.for).toBe('function');

    var test = result.for('test');
    expect(test).toBe('@@test');
  });

  describe('when symbols exists on root', function () {
    it('should use symbols from root', function () {
      var root = {
        Symbol: {
          observable: {},
          iterator: {}
        }
      };

      var result = polyfillSymbol(root);
      expect(result.observable).toBe(root.Symbol.observable);
      expect(result.iterator).toBe(root.Symbol.iterator);
    });
  });

  describe('observable symbol', function () {
    it('should patch root using for symbol if exist', function () {
      var root = {
        Symbol: {
          for: function (x) { return x; }
        }
      };

      var result = polyfillSymbol(root);
      expect(result.observable).toBe(root.Symbol.for('observable'));
    });

    it('should patch root if for symbol does not exist', function () {
      var root = {};

      var result = polyfillSymbol(root);
      expect(result.observable).toBe('@@observable');
    });
  });

  it('should patch root using Symbol.for if exist', function () {
    var root = {
      Symbol: {
        for: function (x) { return x; }
      }
    };
    var result = polyfillSymbol(root);
    expect(result.iterator).toBe(root.Symbol.for('iterator'));
  });

  it('should patch using Set for mozilla bug', function () {
    function Set() {
    }
    Set.prototype['@@iterator'] = function () {};

    var root = {
      Set: Set,
      Symbol: {}
    };

    var result = polyfillSymbol(root);
    expect(result.iterator).toBe('@@iterator');
  });

  it('should patch using map for es6-shim', function () {
    var root = {
      Map: Map,
      Symbol: {}
    };

    root.Map.prototype.key = 'iteratorValue';
    root.Map.prototype.entries = 'iteratorValue';

    var result = polyfillSymbol(root);
    expect(result.iterator).toBe('key');
  });
});
