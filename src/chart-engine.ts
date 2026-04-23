import * as d3 from 'd3';
import * as Chart from 'chart.js';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  data: any[];
  labels?: string[];
  title?: string;
  colors?: string[];
  options?: any;
}

export interface D3ChartData {
  svg: string;
  width: number;
  height: number;
}

export class ChartEngine {
  private static readonly DEFAULT_COLORS = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
  ];

  static async createBarChart(config: ChartConfig): Promise<D3ChartData> {
    return new Promise((resolve, reject) => {
      try {
        const { data, labels, title, colors = this.DEFAULT_COLORS } = config;

        // Create SVG container
        const svg = d3.create('svg')
          .attr('width', 800)
          .attr('height', 500);

        // Set up scales
        const xScale = d3.scaleBand()
          .domain(labels || data.map((_, i) => i.toString()))
          .range([50, 750])
          .padding(0.2);

        const yScale = d3.scaleLinear()
          .domain([0, d3.max(data) || 0])
          .range([450, 50]);

        // Add title if provided
        if (title) {
          svg.append('text')
            .attr('x', 400)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text(title);
        }

        // Create bars
        svg.selectAll('.bar')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', (_, i) => xScale(i.toString()) || 0)
          .attr('y', d => yScale(d))
          .attr('width', xScale.bandwidth())
          .attr('height', d => 450 - yScale(d))
          .attr('fill', (_, i) => colors[i % colors.length])
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7);
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
          });

        // Add value labels on bars
        svg.selectAll('.value-label')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'value-label')
          .attr('x', (_, i) => (xScale(i.toString()) || 0) + xScale.bandwidth() / 2)
          .attr('y', d => yScale(d) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', '#333')
          .text(d => d.toFixed(1));

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append('g')
          .attr('transform', 'translate(0, 450)')
          .call(xAxis);

        svg.append('g')
          .attr('transform', 'translate(50, 0)')
          .call(yAxis);

        resolve({
          svg: svg.node()?.outerHTML || '',
          width: 800,
          height: 500
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static async createLineChart(config: ChartConfig): Promise<D3ChartData> {
    return new Promise((resolve, reject) => {
      try {
        const { data, labels, title, colors = this.DEFAULT_COLORS } = config;

        const svg = d3.create('svg')
          .attr('width', 800)
          .attr('height', 500);

        // Line generator
        const line = d3.line<number>()
          .x((_, i) => 50 + (i * 700) / (data.length - 1))
          .y(d => 450 - (d * 400) / Math.max(...data))
          .curve(d3.curveCardinal);

        // Path for the line
        svg.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', colors[0])
          .attr('stroke-width', 3)
          .attr('d', line);

        // Data points
        svg.selectAll('.point')
          .data(data)
          .enter()
          .append('circle')
          .attr('class', 'point')
          .attr('cx', (_, i) => 50 + (i * 700) / (data.length - 1))
          .attr('cy', d => 450 - (d * 400) / Math.max(...data))
          .attr('r', 5)
          .attr('fill', colors[0]);

        // Title
        if (title) {
          svg.append('text')
            .attr('x', 400)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text(title);
        }

        resolve({
          svg: svg.node()?.outerHTML || '',
          width: 800,
          height: 500
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static async createPieChart(config: ChartConfig): Promise<D3ChartData> {
    return new Promise((resolve, reject) => {
      try {
        const { data, labels, title, colors = this.DEFAULT_COLORS } = config;

        const width = 600;
        const height = 600;
        const radius = Math.min(width, height) / 2 - 50;

        const svg = d3.create('svg')
          .attr('width', width)
          .attr('height', height);

        // Pie layout
        const pie = d3.pie<any>()
          .value(d => d)
          .sort(null);

        const arc = d3.arc<any>()
          .innerRadius(0)
          .outerRadius(radius);

        const arcs = pie(data);

        // Color scale
        const color = d3.scaleOrdinal(colors);

        // Create pie slices
        const g = svg.append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`);

        g.selectAll('.arc')
          .data(arcs)
          .enter()
          .append('path')
          .attr('class', 'arc')
          .attr('d', arc)
          .attr('fill', (_, i) => color(String(i)))
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7);
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
          });

        // Labels
        const labelArc = d3.arc<any>()
          .innerRadius(radius - 40)
          .outerRadius(radius - 40);

        g.selectAll('.label')
          .data(arcs)
          .enter()
          .append('text')
          .attr('transform', d => `translate(${labelArc.centroid(d)})`)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', '#333')
          .text((_, i) => labels ? labels[i] : data[i].toFixed(1));

        // Title
        if (title) {
          svg.append('text')
            .attr('x', width / 2)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text(title);
        }

        resolve({
          svg: svg.node()?.outerHTML || '',
          width,
          height
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateChart(type: string, config: any): Promise<any> {
    switch (type) {
      case 'bar':
        return await this.createBarChart(config);
      case 'line':
        return await this.createLineChart(config);
      case 'pie':
        return await this.createPieChart(config);
      default:
        throw new Error(`Unsupported chart type: ${type}`);
    }
  }
}