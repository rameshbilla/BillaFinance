import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, from } from 'rxjs';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export interface TspdclBillDetails {
  consumerName: string;
  uniqueServiceNumber: string;
  serviceNumber: string;
  ero: string;
  address: string;
  sectionName: string;
  billDate?: string;
  billAmount?: number;
  arrearsAmount: number;
  currentMonthAmount: number;
  totalAmountPayable: number;
  amountLabel?: string;
  isPaid?: boolean;
  paidAmount?: number;
  paidDate?: string;
  dueDate: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TspdclService {
  private http = inject(HttpClient);
  
  private get baseUrl() {
    // For native platforms, we use the absolute URL. 
    // CapacitorHttp (enabled in config) will automatically handle this call using native networking.
    return Capacitor.getPlatform() === 'web' ? '/api/tspdcl' : 'https://www.tgsouthernpower.org';
  }

  fetchBillDetails(uscNo: string): Observable<TspdclBillDetails | null> {
    if (Capacitor.getPlatform() === 'web') {
      const fullUrl = `${this.baseUrl}/billinginfo?ukscno=${uscNo}&submit=SUBMIT`;
      return this.http.get(fullUrl, { 
        responseType: 'text',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache'
        }
      }).pipe(
        map(html => this.processTspdclResponse(html, uscNo)),
        catchError(err => {
          console.error('TSPDCL Connection Error:', err);
          return of(null);
        })
      );
    } else {
      // Use native CapacitorHttp explicitly since global network interception is disabled
      const fullUrl = `${this.baseUrl}/billinginfo?ukscno=${uscNo}&submit=SUBMIT`;
      const options = {
        url: fullUrl,
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache'
        },
        responseType: 'text' as const
      };
      
      return from(CapacitorHttp.get(options)).pipe(
        map(response => this.processTspdclResponse(response.data, uscNo)),
        catchError(err => {
          console.error('TSPDCL Native Connection Error:', err);
          return of(null);
        })
      );
    }
  }

  private processTspdclResponse(html: any, uscNo: string): TspdclBillDetails | null {
    if (html && typeof html === 'string' && html.length > 100) { 
      const parsed = this.parseTspdclHtml(html, uscNo);
      if (parsed && parsed.totalAmountPayable >= 0) {
        return parsed;
      }
    }
    console.error('TSPDCL: Received invalid or empty HTML response.');
    return null;
  }

  private parseTspdclHtml(html: string, uscNo: string): TspdclBillDetails | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const lowerHtml = html.toLowerCase();
    if (lowerHtml.includes('invalid') 
        || lowerHtml.includes('not found') 
        || lowerHtml.includes('enter valid')
        || lowerHtml.includes('no records')
        || lowerHtml.includes('error')
        || lowerHtml.includes('does not exist')) {
      return null;
    }

    try {
      const details: TspdclBillDetails = {
        consumerName: 'Unknown',
        uniqueServiceNumber: uscNo,
        serviceNumber: '',
        ero: '',
        address: '',
        sectionName: '',
        arrearsAmount: 0,
        currentMonthAmount: 0,
        totalAmountPayable: 0,
        amountLabel: 'Payable Amount',
        dueDate: '--',
        success: true
      };

      const rows = Array.from(doc.querySelectorAll('tr'));
      let currentSection = '';

      rows.forEach(row => {
        const rowText = row.textContent || '';
        // Exact matches for the headers shown in the screenshot
        if (rowText.includes('Your Arrears as on')) currentSection = 'arrears';
        else if (rowText.includes('Current Month Bill')) currentSection = 'current';
        else if (rowText.includes('Total Amount Payable')) currentSection = 'total';
        else if (rowText.includes('Total Amount Paid')) currentSection = 'paid';

        const cells = Array.from(row.querySelectorAll('th, td'));
        for (let i = 0; i < cells.length; i++) {
          const cellText = cells[i].textContent?.trim() || '';
          const nextCellText = cells[i+1]?.textContent?.trim() || '';
          const normalizedCellText = cellText.toLowerCase();

          if (normalizedCellText.includes('consumer name')) {
            details.consumerName = nextCellText;
          }
          if (normalizedCellText === 'service number') {
            details.serviceNumber = nextCellText;
          }
          if (normalizedCellText === 'ero') {
            details.ero = nextCellText;
          }
          if (normalizedCellText === 'address') {
            details.address = nextCellText;
          }
          if (normalizedCellText.includes('section name')) {
            details.sectionName = nextCellText;
          }
          if (normalizedCellText.includes('paid date')) {
            details.paidDate = nextCellText;
            details.isPaid = true;
          } else if (normalizedCellText.includes('due date')) {
            details.dueDate = nextCellText;
          }

          const labelAmount = this.parseAmount(nextCellText || cellText);
          if (this.isPayableAmountLabel(cellText) && labelAmount !== null) {
            details.amountLabel = this.formatAmountLabel(cellText);
            if (normalizedCellText.includes('paid amount')) {
              details.paidAmount = labelAmount;
              details.isPaid = true;
            } else {
              details.totalAmountPayable = labelAmount;
            }
          }

          const isAmountCell = normalizedCellText === 'amount'
            || normalizedCellText === 'amount:'
            || normalizedCellText === 'amount(rs.)'
            || normalizedCellText === 'amount (rs.)'
            || normalizedCellText.includes('amount(')
            || normalizedCellText.includes('amount (');
          if (isAmountCell) {
            const amt = this.parseAmount(nextCellText);
            if (amt !== null) {
              if (currentSection === 'arrears') details.arrearsAmount = amt;
              else if (currentSection === 'current') details.currentMonthAmount = amt;
              else if (currentSection === 'total') {
                details.totalAmountPayable = amt;
                details.amountLabel = 'Payable Amount';
              } else if (currentSection === 'paid') {
                details.paidAmount = amt;
                details.isPaid = true;
                details.amountLabel = 'Paid Amount';
              }
            }
          }
        }
      });

      if (details.totalAmountPayable === 0) {
        const allText = (doc.body.textContent || '').replace(/\s+/g, ' ');
        const fallback = this.extractLabeledAmount(allText, [
          'Paid Amount',
          'Total Amount Payable',
          'Amount Payable',
          'Payable Amount',
          'Net Amount'
        ]);
        if (fallback) {
          details.amountLabel = fallback.label;
          if (fallback.label.toLowerCase().includes('paid amount')) {
            details.paidAmount = fallback.amount;
            details.isPaid = true;
          } else {
            details.totalAmountPayable = fallback.amount;
          }
        }
      }

      if (details.isPaid && details.paidAmount !== undefined) {
        details.totalAmountPayable = details.paidAmount;
        details.amountLabel = 'Paid Amount';
      }

      // Fallback: If total is 0, sum the components
      if (details.totalAmountPayable === 0) {
        details.totalAmountPayable = details.arrearsAmount + details.currentMonthAmount;
      }

      return details;
    } catch (e) {
      console.error('Parsing Error:', e);
      return null;
    }
  }

  private isPayableAmountLabel(label: string): boolean {
    const normalized = label.toLowerCase();
    return normalized.includes('paid amount')
      || normalized.includes('total amount payable')
      || normalized.includes('amount payable')
      || normalized.includes('payable amount')
      || normalized.includes('net amount');
  }

  private formatAmountLabel(label: string): string {
    const cleaned = label.replace(/[:*]/g, '').replace(/\s+/g, ' ').trim();
    return cleaned || 'Payable Amount';
  }

  private parseAmount(value: string): number | null {
    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;

    const amount = parseFloat(match[0]);
    return Number.isNaN(amount) ? null : amount;
  }

  private extractLabeledAmount(text: string, labels: string[]): { label: string; amount: number } | null {
    for (const label of labels) {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`${escapedLabel}\\s*[:\\-]?\\s*[^0-9-]{0,20}([0-9,]+(?:\\.\\d+)?)`, 'i');
      const match = text.match(regex);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount !== null) return { label, amount };
      }
    }

    return null;
  }
}
