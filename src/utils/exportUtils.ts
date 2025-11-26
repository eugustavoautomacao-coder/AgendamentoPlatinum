import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Função para exportar dados para PDF usando autoTable
export const exportToPDF = (data: any[][], filename: string, title: string = 'Relatório') => {
  try {
    const doc = new jsPDF();
    
    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPosition = 20;
    
    // Cabeçalho principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Data de geração
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Processar dados em seções
    let currentSection: string | null = null;
    let tableData: any[][] = [];
    let tableHeaders: any[] = [];
    
    data.forEach((row, index) => {
      // Linha vazia - separador
      if (row.length === 0) {
        if (tableData.length > 0 && tableHeaders.length > 0) {
          // Renderizar tabela acumulada
          autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            styles: { 
              fontSize: 9,
              cellPadding: 3,
              overflow: 'linebreak',
              halign: 'left'
            },
            headStyles: { 
              fillColor: [66, 98, 74],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: { 
              fillColor: [245, 245, 245] 
            },
            didDrawPage: (data) => {
              // Rodapé em cada página
              doc.setFontSize(8);
              doc.setTextColor(100);
              doc.text(
                'Sistema Platinum - Gestão de Salão de Beleza', 
                margin, 
                pageHeight - 10
              );
              doc.text(
                `Página ${doc.getCurrentPageInfo().pageNumber}`, 
                pageWidth - margin - 15, 
                pageHeight - 10
              );
            }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
          tableData = [];
          tableHeaders = [];
        }
        return;
      }
      
      // Título de seção (texto em maiúsculas, linha única)
      if (row.length === 1 && row[0] && typeof row[0] === 'string' && row[0].toUpperCase() === row[0]) {
        // Renderizar tabela anterior se existir
        if (tableData.length > 0 && tableHeaders.length > 0) {
          autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            styles: { 
              fontSize: 9,
              cellPadding: 3,
              overflow: 'linebreak',
              halign: 'left'
            },
            headStyles: { 
              fillColor: [66, 98, 74],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: { 
              fillColor: [245, 245, 245] 
            }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
          tableData = [];
          tableHeaders = [];
        }
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Desenhar seção
        currentSection = row[0];
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(currentSection, margin, yPosition);
        yPosition += 10;
        return;
      }
      
      // Linha de dados simples (key: value)
      if (row.length <= 2 && !row.every(cell => typeof cell === 'string' && cell.includes(':'))) {
        // Linha de informação simples
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        const text = row.join(': ');
        doc.text(text, margin, yPosition);
        yPosition += 7;
        return;
      }
      
      // Linhas de tabela
      if (row.length > 1) {
        // Primeira linha após seção = cabeçalho
        if (tableData.length === 0) {
          tableHeaders = row;
        } else {
          tableData.push(row);
        }
      }
    });
    
    // Renderizar última tabela se existir
    if (tableData.length > 0 && tableHeaders.length > 0) {
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: { 
          fillColor: [66, 98, 74],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245] 
        }
      });
    }
    
    // Adicionar rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Sistema Platinum - Gestão de Salão de Beleza', margin, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
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
  if (!date) return 'Data inválida';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  return format(dateObj, 'dd/MM/yyyy');
};

// Função para formatar data e hora
export const formatDateTime = (date: string | Date): string => {
  if (!date) return 'Data inválida';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  return format(dateObj, 'dd/MM/yyyy HH:mm');
};
