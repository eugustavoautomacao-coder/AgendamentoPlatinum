/**
 * Função utilitária para corrigir fuso horário UTC
 * Remove o offset UTC (+00:00) das strings de data e trata como horário local
 * 
 * @param dateStr - String da data no formato ISO com ou sem offset UTC
 * @returns Date object tratado como horário local
 */
export const fixTimezone = (dateStr: string): Date => {
  if (!dateStr) {
    return new Date();
  }
  
  // Se a string tem offset UTC (+00:00), remover e tratar como local
  let localDateStr = dateStr;
  if (dateStr.includes('+00:00')) {
    localDateStr = dateStr.replace('+00:00', '');
  }
  
  // Criar data sem conversão de fuso horário
  const date = new Date(localDateStr);
  
  // Verificar se a data é válida
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return date;
};

/**
 * Formata uma data corrigindo o fuso horário UTC
 * 
 * @param dateStr - String da data no formato ISO
 * @param formatStr - String de formatação do date-fns
 * @param locale - Locale do date-fns (padrão: ptBR)
 * @returns String formatada da data
 */
export const formatFixedDate = (
  dateStr: string, 
  formatStr: string, 
  locale: any = null
): string => {
  const { format } = require('date-fns');
  const { ptBR } = require('date-fns/locale');
  
  const fixedDate = fixTimezone(dateStr);
  return format(fixedDate, formatStr, { locale: locale || ptBR });
};






