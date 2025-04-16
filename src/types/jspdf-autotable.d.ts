
declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';

  interface UserOptions {
    head?: any[];
    body?: any[];
    foot?: any[];
    startY?: number;
    margin?: any;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid' | 'always';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineWidth?: number;
    tableLineColor?: string;
    tableId?: string;
    theme?: 'striped' | 'grid' | 'plain';
    styles?: any;
    columnStyles?: any;
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    columnWidth?: 'auto' | 'wrap' | number;
    horizontalPageBreak?: boolean;
    horizontalPageBreakRepeat?: number | string;
    didParseCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    didDrawPage?: (data: any) => void;
  }

  interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: UserOptions) => jsPDFWithAutoTable;
    previousAutoTable: UserOptions;
    lastAutoTable: {
      finalY?: number;
      pageNumber?: number;
      pageCount?: number;
      settings?: UserOptions;
      cursor?: {
        y?: number;
      };
    };
  }

  function autoTable(doc: jsPDF, options: UserOptions): jsPDFWithAutoTable;
  export default autoTable;
}
