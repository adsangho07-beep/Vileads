import Papa from 'papaparse';
import { DbLead } from '@/types/db';

export function exportLeadsToCsv(leads: DbLead[], filename = 'vileads-export.csv') {
  if (!leads || leads.length === 0) {
    return false;
  }

  // Format and isolate lead fields only (exclude raw, messages, user_id, search_id)
  const rows = leads.map((lead) => ({
    Nom: lead.name || '',
    'Catégorie': lead.category || '',
    'Adresse': lead.address || '',
    'Téléphone': lead.phone || '',
    'Site Web': lead.website || '',
    'Note Google': lead.rating !== null ? lead.rating : '',
    'Nombre d\'avis': lead.reviews_count !== null ? lead.reviews_count : '',
  }));

  const csvString = Papa.unparse(rows, {
    quotes: true,
    delimiter: ';', // Standard for Excel in French/European locale with UTF-8 BOM
  });

  // Prepend UTF-8 BOM for perfect accent support in Microsoft Excel
  const blob = new Blob(['\ufeff' + csvString], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
