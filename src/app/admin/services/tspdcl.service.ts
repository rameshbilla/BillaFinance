import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

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
  dueDate: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TspdclService {
  private http = inject(HttpClient);
  // Using local proxy configured in proxy.conf.json to bypass CORS professionally
  private localProxyPath = '/api/tspdcl/billinginfo';

  fetchBillDetails(uscNo: string): Observable<TspdclBillDetails | null> {
    const fullUrl = `${this.localProxyPath}?ukscno=${uscNo}&submit=SUBMIT`;

    return this.http.get(fullUrl, { responseType: 'text' }).pipe(
      map(html => {
        if (html) {
          return this.parseTspdclHtml(html, uscNo);
        }
        return null;
      }),
      catchError(err => {
        console.error('TSPDCL Local Proxy Error:', err);
        return of(null);
      })
    );
  }

  private parseTspdclHtml(html: string, uscNo: string): TspdclBillDetails | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (html.includes('Invalid') || html.includes('not found')) {
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

        const cells = Array.from(row.querySelectorAll('th, td'));
        for (let i = 0; i < cells.length; i++) {
          const cellText = cells[i].textContent?.trim() || '';
          const nextCellText = cells[i+1]?.textContent?.trim() || '';

          if (cellText.toLowerCase().includes('consumer name')) {
            details.consumerName = nextCellText;
          }
          if (cellText.toLowerCase() === 'service number') {
            details.serviceNumber = nextCellText;
          }
          if (cellText.toLowerCase() === 'ero') {
            details.ero = nextCellText;
          }
          if (cellText.toLowerCase() === 'address') {
            details.address = nextCellText;
          }
          if (cellText.toLowerCase().includes('section name')) {
            details.sectionName = nextCellText;
          }
          if (cellText.toLowerCase().includes('due date')) {
            details.dueDate = nextCellText;
          }

          if (cellText.toLowerCase() === 'amount') {
            const amtStr = nextCellText.replace(/[^\d.]/g, '');
            const amt = parseFloat(amtStr);
            if (!isNaN(amt)) {
              if (currentSection === 'arrears') details.arrearsAmount = amt;
              else if (currentSection === 'current') details.currentMonthAmount = amt;
              else if (currentSection === 'total') details.totalAmountPayable = amt;
            }
          }
        }
      });

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
}
