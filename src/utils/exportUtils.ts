import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

// Função para exportar dados para Excel
export const exportToExcel = (data: any[][], filename: string, sheetName: string = 'Relatorio') => {
  try {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const formattedFilename = `${filename}-${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, formattedFilename);
    
    return { success: true, message: 'Arquivo exportado com sucesso!' };
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return { success: false, message: 'Erro ao exportar arquivo' };
  }
};

// Função para exportar dados para PDF
export const exportToPDF = (data: any[][], filename: string, title: string = 'Relatório') => {
  try {
    const doc = new jsPDF();
    
    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 20;
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 15;
    
    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, yPosition);
    yPosition += 20;
    
    // Separador
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
    
    // Processar dados
    data.forEach((row, index) => {
      if (row.length === 0) {
        // Linha vazia - adicionar espaço
        yPosition += 10;
        return;
      }
      
      if (row.length === 1 && row[0] && typeof row[0] === 'string' && row[0].toUpperCase() === row[0]) {
        // Título de seção
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], margin, yPosition);
        yPosition += 15;
        return;
      }
      
      if (row.length > 1) {
        // Linha de tabela - verificar se cabe na página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Desenhar linha da tabela
        const colWidth = (pageWidth - 2 * margin) / row.length;
        let xPosition = margin;
        
        row.forEach((cell, cellIndex) => {
          // Cabeçalho da tabela (primeira linha com múltiplas colunas)
          if (index === 0 || (index > 0 && data[index - 1].length === 1)) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(66, 98, 74);
            doc.rect(xPosition, yPosition - 5, colWidth, 10, 'F');
            doc.setTextColor(255, 255, 255);
          } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
          }
          
          // Truncar texto se muito longo
          const cellText = String(cell || '').substring(0, 20);
          doc.text(cellText, xPosition + 2, yPosition);
          xPosition += colWidth;
        });
        
        yPosition += 10;
      } else {
        // Linha simples
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(row[0], margin, yPosition);
        yPosition += 8;
      }
    });
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 0, 0);
      doc.text('Sistema Platinum - Gestão de Salão de Beleza', margin, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }
    
    // Salvar arquivo
    const formattedFilename = `${filename}-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    doc.save(formattedFilename);
    
    return { success: true, message: 'PDF exportado com sucesso!' };
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    return { success: false, message: 'Erro ao exportar PDF' };
  }
};

// Função para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar porcentagens
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Função para formatar datas
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
};

// Função para formatar data e hora
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm');
};
