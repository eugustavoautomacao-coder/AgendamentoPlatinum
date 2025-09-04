import * as XLSX from 'xlsx';
import { format } from 'date-fns';

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

// Função para exportar dados para PDF (simulada)
export const exportToPDF = (data: any[][], filename: string) => {
  try {
    // Simulação de exportação para PDF
    // Em produção, você pode usar bibliotecas como jsPDF ou react-pdf
    const formattedFilename = `${filename}-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    
    // Por enquanto, apenas mostra uma mensagem
    alert(`Exportação para PDF será implementada em breve!\nArquivo: ${formattedFilename}`);
    
    return { success: true, message: 'PDF será implementado em breve!' };
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
