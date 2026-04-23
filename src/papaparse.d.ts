declare module 'papaparse' {
  export function parse(input: string, config?: any): {
    data: any[];
    errors: any[];
    meta: any;
  };
  export function unparse(data: any, config?: any): string;
}
