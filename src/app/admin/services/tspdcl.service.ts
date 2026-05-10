import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Capacitor } from '@capacitor/core';

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
  
  private get baseUrl() {
    // For native platforms, we use the absolute URL. 
    // CapacitorHttp (enabled in config) will automatically handle this call using native networking.
    return Capacitor.getPlatform() === 'web' ? '/api/tspdcl' : 'https://www.tgsouthernpower.org';
  }

  fetchBillDetails(uscNo: string): Observable<TspdclBillDetails | null> {
    const fullUrl = `${this.baseUrl}/billinginfo?ukscno=${uscNo}&submit=SUBMIT`;

    return this.http.get(fullUrl, { 
      responseType: 'text',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      }
    }).pipe(
      map(html => {
        if (html && html.length > 100) { // Basic check for meaningful content
          const parsed = this.parseTspdclHtml(html, uscNo);
          if (parsed && parsed.totalAmountPayable >= 0) {
            return parsed;
          }
        }
        console.error('TSPDCL: Received invalid or empty HTML response.');
        return null;
      }),
      catchError(err => {
        console.error('TSPDCL Connection Error:', err);
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
