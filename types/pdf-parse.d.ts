declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: Date;
    ModDate?: Date;
    [key: string]: unknown;
  }

  interface PDFMetadata {
    [key: string]: unknown;
  }

  interface PDFParseOptions {
    max?: number;
    version?: string;
    [key: string]: unknown;
  }

  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info?: PDFInfo;
    metadata?: PDFMetadata;
    version?: string;
  }

  function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;
  export = pdfParse;
}
