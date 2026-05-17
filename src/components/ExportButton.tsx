import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any, row: any) => string;
}

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
}

export default function ExportButton({ data, columns, filename, title }: ExportButtonProps) {
  function formatRow(row: any): Record<string, string> {
    const result: Record<string, string> = {};
    columns.forEach(col => {
      result[col.header] = col.formatter ? col.formatter(row[col.key], row) : String(row[col.key] ?? '');
    });
    return result;
  }

  function exportCSV() {
    try {
      const formatted = data.map(formatRow);
      const headers = columns.map(c => c.header);
      const csvRows = [headers.join(',')];
      formatted.forEach(row => {
        csvRows.push(headers.map(h => {
          const val = row[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Failed to export CSV');
    }
  }

  function exportPDF() {
    try {
      const doc = new jsPDF();
      const formatted = data.map(formatRow);
      const headers = columns.map(c => c.header);
      const body = formatted.map(row => headers.map(h => row[h] ?? ''));

      if (title) {
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        autoTable(doc, {
          head: [headers],
          body,
          startY: 34,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
        });
      } else {
        autoTable(doc, {
          head: [headers],
          body,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
        });
      }

      doc.save(`${filename}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to export PDF');
    }
  }

  function exportExcel() {
    try {
      const formatted = data.map(formatRow);
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Failed to export Excel');
    }
  }

  if (data.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-500" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
