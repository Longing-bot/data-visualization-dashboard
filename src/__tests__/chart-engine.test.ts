// Mock d3
jest.mock('d3', () => {
  const createEl = () => ({
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    datum: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    node: jest.fn().mockReturnValue({
      outerHTML: '<svg>mock</svg>'
    })
  });

  return {
    __esModule: true,
    create: jest.fn(() => createEl()),
    scaleBand: jest.fn(() => {
      const fn: any = jest.fn(() => 100);
      fn.domain = jest.fn().mockReturnThis();
      fn.range = jest.fn().mockReturnThis();
      fn.padding = jest.fn().mockReturnThis();
      fn.bandwidth = jest.fn(() => 100);
      return fn;
    }),
    scaleLinear: jest.fn(() => {
      const fn: any = jest.fn(() => 200);
      fn.domain = jest.fn().mockReturnThis();
      fn.range = jest.fn().mockReturnThis();
      return fn;
    }),
    scaleOrdinal: jest.fn(() => jest.fn(() => '#3498db')),
    max: jest.fn((arr: number[]) => Math.max(...arr)),
    axisBottom: jest.fn(() => jest.fn()),
    axisLeft: jest.fn(() => jest.fn()),
    line: jest.fn(() => {
      const fn: any = jest.fn(() => 'M0,0L1,1');
      fn.x = jest.fn().mockReturnThis();
      fn.y = jest.fn().mockReturnThis();
      fn.curve = jest.fn().mockReturnThis();
      return fn;
    }),
    pie: jest.fn(() => {
      const fn: any = jest.fn(() => []);
      fn.value = jest.fn().mockReturnThis();
      fn.sort = jest.fn().mockReturnThis();
      return fn;
    }),
    arc: jest.fn(() => {
      const fn: any = jest.fn(() => 'M0,0');
      fn.innerRadius = jest.fn().mockReturnThis();
      fn.outerRadius = jest.fn().mockReturnThis();
      fn.centroid = jest.fn(() => [0, 0]);
      return fn;
    }),
    curveCardinal: 'curveCardinal'
  };
});

// Mock chart.js
jest.mock('chart.js', () => ({}));

import { ChartEngine } from '../chart-engine';

describe('ChartEngine', () => {
  describe('createBarChart', () => {
    it('should create a bar chart with valid data', async () => {
      const result = await ChartEngine.createBarChart({
        type: 'bar',
        data: [10, 20, 30, 40],
        labels: ['A', 'B', 'C', 'D'],
        title: 'Test Chart'
      });

      expect(result).toHaveProperty('svg');
      expect(result).toHaveProperty('width', 800);
      expect(result).toHaveProperty('height', 500);
      expect(result.svg).toContain('<svg');
    });

    it('should create bar chart without title', async () => {
      const result = await ChartEngine.createBarChart({
        type: 'bar',
        data: [5, 15, 25]
      });

      expect(result.svg).toContain('<svg');
      expect(result.width).toBe(800);
    });
  });

  describe('createLineChart', () => {
    it('should create a line chart', async () => {
      const result = await ChartEngine.createLineChart({
        type: 'line',
        data: [10, 20, 15, 25, 30],
        title: 'Line Test'
      });

      expect(result.svg).toContain('<svg');
    });
  });

  describe('createPieChart', () => {
    it('should create a pie chart', async () => {
      const result = await ChartEngine.createPieChart({
        type: 'pie',
        data: [30, 20, 50],
        labels: ['A', 'B', 'C'],
        title: 'Pie Test'
      });

      expect(result.svg).toContain('<svg');
      expect(result.width).toBe(600);
      expect(result.height).toBe(600);
    });
  });

  describe('generateChart', () => {
    it('should dispatch to correct chart type', async () => {
      const barResult = await ChartEngine.generateChart('bar', {
        data: [1, 2, 3]
      });
      expect(barResult.svg).toContain('<svg');

      const lineResult = await ChartEngine.generateChart('line', {
        data: [1, 2, 3]
      });
      expect(lineResult.svg).toContain('<svg');

      const pieResult = await ChartEngine.generateChart('pie', {
        data: [1, 2, 3]
      });
      expect(pieResult.svg).toContain('<svg');
    });

    it('should throw on unsupported chart type', async () => {
      await expect(
        ChartEngine.generateChart('radar', { data: [1, 2, 3] })
      ).rejects.toThrow('Unsupported chart type');
    });
  });
});
