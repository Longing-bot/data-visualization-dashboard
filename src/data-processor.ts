import * as Papa from 'papaparse';
import moment = require('moment');
import * as _ from 'lodash';

export interface ProcessedData {
  summary: {
    totalRows: number;
    totalColumns: number;
    numericColumns: string[];
    categoricalColumns: string[];
    dateColumns: string[];
  };
  statistics: Record<string, any>;
  transformed: any[];
}

export class DataProcessor {
  static async processCSV(csvData: string): Promise<ProcessedData> {
    return new Promise((resolve, reject) => {
      try {
        const results = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          transform: (value: string) => value.trim()
        });

        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }

        const data = results.data;
        if (data.length === 0) {
          throw new Error('No data found in CSV');
        }

        const processed = this.analyzeAndTransform(data);
        resolve(processed);

      } catch (error) {
        reject(error);
      }
    });
  }

  static async processJSON(jsonData: any[]): Promise<ProcessedData> {
    try {
      if (!Array.isArray(jsonData)) {
        jsonData = [jsonData];
      }

      if (jsonData.length === 0) {
        throw new Error('No data found in JSON');
      }

      const processed = this.analyzeAndTransform(jsonData);
      return processed;

    } catch (error) {
      throw error;
    }
  }

  static async processRequest(request: any): Promise<any> {
    switch (request.type) {
      case 'csv':
        return await this.processCSV(request.data);
      case 'json':
        return await this.processJSON(request.data);
      case 'aggregate':
        return this.aggregateData(request.data, request.groupBy);
      case 'filter':
        return this.filterData(request.data, request.filters);
      case 'sort':
        return this.sortData(request.data, request.field, request.order);
      default:
        throw new Error(`Unsupported processing type: ${request.type}`);
    }
  }

  private static analyzeAndTransform(data: any[]): ProcessedData {
    const headers = Object.keys(data[0] || {});
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const dateColumns: string[] = [];

    // Analyze each column
    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (this.isNumericColumn(values)) {
        numericColumns.push(header);
      } else if (this.isDateColumn(values)) {
        dateColumns.push(header);
      } else {
        categoricalColumns.push(header);
      }
    });

    // Calculate statistics for numeric columns
    const statistics: Record<string, any> = {};
    numericColumns.forEach(col => {
      const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
      if (values.length > 0) {
        statistics[col] = {
          mean: _.mean(values),
          median: values.length > 0 ? values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0,
          min: _.min(values),
          max: _.max(values),
          sum: _.sum(values),
          count: values.length,
          stdDev: this.calculateStdDev(values)
        };
      }
    });

    // Transform data for visualization
    const transformed = this.transformForVisualization(data, headers);

    return {
      summary: {
        totalRows: data.length,
        totalColumns: headers.length,
        numericColumns,
        categoricalColumns,
        dateColumns
      },
      statistics,
      transformed
    };
  }

  private static isNumericColumn(values: any[]): boolean {
    const numericValues = values.slice(0, 100).map(val => Number(val)).filter(val => !isNaN(val));
    return numericValues.length / values.length > 0.8; // At least 80% numeric
  }

  private static isDateColumn(values: any[]): boolean {
    const dateValues = values.slice(0, 100).filter(val => {
      const date = moment(val, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true) || moment(val, 'YYYY-MM-DD', true);
      return date.isValid();
    });
    return dateValues.length / values.length > 0.7; // At least 70% valid dates
  }

  private static calculateStdDev(values: number[]): number {
    const mean = _.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(_.mean(squaredDiffs));
  }

  private static transformForVisualization(data: any[], headers: string[]): any[] {
    return data.map((row, index) => ({
      id: index,
      ..._.mapValues(row, (value, key) => {
        if (typeof value === 'string' && !isNaN(Date.parse(value))) {
          return moment(value).format('YYYY-MM-DD');
        }
        return value;
      })
    }));
  }

  private static aggregateData(data: any[], groupByField?: string): any[] {
    if (!groupByField) {
      return data;
    }

    return _.chain(data)
      .groupBy(groupByField)
      .map((group, key) => ({
        [groupByField]: key,
        count: group.length,
        values: group
      }))
      .value();
  }

  private static filterData(data: any[], filters: any): any[] {
    return data.filter(row => {
      return Object.entries(filters).every(([field, condition]: [string, any]) => {
        const value = row[field];
        
        switch (condition.operator) {
          case 'eq':
            return value == condition.value;
          case 'ne':
            return value != condition.value;
          case 'gt':
            return Number(value) > Number(condition.value);
          case 'lt':
            return Number(value) < Number(condition.value);
          case 'contains':
            return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  private static sortData(data: any[], field: string, order: 'asc' | 'desc'): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (order === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }
}