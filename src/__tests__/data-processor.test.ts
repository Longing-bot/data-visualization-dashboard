// Create a callable mock for moment that works with `import * as moment`
// The trick: return an object with __esModule=true so __importStar returns it directly,
// but also make it callable by using a class that extends Function
jest.mock('moment', () => {
  class MomentMock extends Function {
    constructor() {
      super();
      return new Proxy(this, {
        apply(target, thisArg, args) {
          const val = args[0];
          return {
            isValid: () => !isNaN(Date.parse(val)),
            format: (f: string) => val
          };
        }
      });
    }
  }
  const instance = new (MomentMock as any)();
  instance.ISO_8601 = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
  instance.__esModule = true;
  return instance;
});

// Lodash mock
const lodashMock: any = {
  mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
  median: (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  min: (arr: number[]) => Math.min(...arr),
  max: (arr: number[]) => Math.max(...arr),
  sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
  chain: (arr: any[]) => ({
    groupBy: (fn: any) => ({
      map: (mapper: any) => ({
        value: () => {
          const groups: Record<string, any[]> = {};
          arr.forEach(item => {
            const key = typeof fn === 'function' ? fn(item) : item[fn];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          });
          return Object.entries(groups).map(([key, values]) => mapper(values, key));
        }
      })
    })
  }),
  mapValues: (obj: any, fn: any) => {
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([key, val]) => {
      result[key] = fn(val, key);
    });
    return result;
  }
};
jest.mock('lodash', () => lodashMock);

// Papa parse mock
jest.mock('papaparse', () => ({
  parse: (csv: string, options: any) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return { data: [], errors: [] };
    const headers = lines[0].split(',').map((h: string) => h.trim());
    const data = lines.slice(1).map((line: string) => {
      const values = line.split(',').map((v: string) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i]; });
      return row;
    });
    return { data, errors: [] };
  }
}));

import { DataProcessor } from '../data-processor';

describe('DataProcessor', () => {
  describe('processCSV', () => {
    it('should parse CSV data correctly', async () => {
      const csv = 'name,age,score\nAlice,25,90\nBob,30,85\nCharlie,35,95';
      const result = await DataProcessor.processCSV(csv);

      expect(result.summary.totalRows).toBe(3);
      expect(result.summary.totalColumns).toBe(3);
      expect(result.summary.numericColumns).toContain('age');
      expect(result.summary.numericColumns).toContain('score');
      expect(result.summary.categoricalColumns).toContain('name');
    });

    it('should calculate statistics for numeric columns', async () => {
      const csv = 'value\n10\n20\n30\n40\n50';
      const result = await DataProcessor.processCSV(csv);

      expect(result.statistics.value).toBeDefined();
      expect(result.statistics.value.mean).toBe(30);
      expect(result.statistics.value.min).toBe(10);
      expect(result.statistics.value.max).toBe(50);
      expect(result.statistics.value.sum).toBe(150);
      expect(result.statistics.value.count).toBe(5);
    });

    it('should throw on empty CSV', async () => {
      await expect(DataProcessor.processCSV('')).rejects.toThrow();
    });
  });

  describe('processJSON', () => {
    it('should process JSON array', async () => {
      const data = [
        { name: 'Alice', score: 90 },
        { name: 'Bob', score: 85 }
      ];
      const result = await DataProcessor.processJSON(data);

      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.numericColumns).toContain('score');
    });

    it('should wrap single object in array', async () => {
      const data = { name: 'Alice', score: 90 };
      const result = await DataProcessor.processJSON(data);

      expect(result.summary.totalRows).toBe(1);
    });

    it('should throw on empty array', async () => {
      await expect(DataProcessor.processJSON([])).rejects.toThrow('No data found');
    });
  });

  describe('processRequest', () => {
    it('should handle csv type', async () => {
      const result = await DataProcessor.processRequest({
        type: 'csv',
        data: 'a,b\n1,2\n3,4'
      });
      expect(result.summary.totalRows).toBe(2);
    });

    it('should handle json type', async () => {
      const result = await DataProcessor.processRequest({
        type: 'json',
        data: [{ a: 1 }, { a: 2 }]
      });
      expect(result.summary.totalRows).toBe(2);
    });

    it('should handle aggregate type', async () => {
      const result = await DataProcessor.processRequest({
        type: 'aggregate',
        data: [
          { category: 'A', value: 10 },
          { category: 'A', value: 20 },
          { category: 'B', value: 30 }
        ],
        groupBy: 'category'
      });
      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(2);
      expect(result[1].count).toBe(1);
    });

    it('should handle filter type', async () => {
      const result = await DataProcessor.processRequest({
        type: 'filter',
        data: [
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 30 },
          { name: 'Charlie', age: 35 }
        ],
        filters: { age: { operator: 'gt', value: 28 } }
      });
      expect(result).toHaveLength(2);
      expect(result.map((r: any) => r.name)).toContain('Bob');
      expect(result.map((r: any) => r.name)).toContain('Charlie');
    });

    it('should handle sort type', async () => {
      const result = await DataProcessor.processRequest({
        type: 'sort',
        data: [
          { name: 'Charlie', age: 35 },
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 30 }
        ],
        field: 'age',
        order: 'asc'
      });
      expect(result[0].name).toBe('Alice');
      expect(result[2].name).toBe('Charlie');
    });

    it('should throw on unsupported type', async () => {
      await expect(
        DataProcessor.processRequest({ type: 'unknown', data: [] })
      ).rejects.toThrow('Unsupported processing type');
    });
  });
});
