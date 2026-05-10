import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Capacitor } from '@capacitor/core';

export interface HmwssbBillDetails {
  consumerName: string;
  uniqueServiceNumber: string;
  can: string;
  address: string;
  billAmount?: number;
  totalAmountPayable: number;
  dueDate: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HmwssbService {
  private http = inject(HttpClient);
  
  private get baseUrl() {
    // For native platforms, we use the absolute URL. 
    // CapacitorHttp (enabled in config) will automatically handle this call using native networking.
    return Capacitor.getPlatform() === 'web' ? '/api/hmwssb' : 'https://www.hyderabadwater.gov.in';
  }

  fetchBillDetails(can: string): Observable<HmwssbBillDetails | null> {
    const fullUrl = `${this.baseUrl}/en/index.php/customer-care/online-bill-payment/?can=${can}`;

    return this.http.get(fullUrl, { 
      responseType: 'text',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      }
    }).pipe(
      map(html => {
        if (html && html.length > 200) { // HMWSSB page is usually larger
          const parsed = this.parseHmwssbHtml(html, can);
          if (parsed && parsed.totalAmountPayable >= 0) {
            return parsed;
          }
        }
        console.error('HMWSSB: Received invalid or empty HTML response.');
        return null;
      }),
      catchError(err => {
        console.error('HMWSSB Connection Error:', err);
        return of(null);
      })
    );
  }

  private parseHmwssbHtml(html: string, can: string): HmwssbBillDetails | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (html.includes('Invalid') || html.includes('not found')) {
      return null;
    }

    try {
      const details: HmwssbBillDetails = {
        consumerName: 'Unknown',
        uniqueServiceNumber: can,
        can: can,
        address: '',
        totalAmountPayable: 0,
        dueDate: '--',
        success: true
      };

      const rows = Array.from(doc.querySelectorAll('tr, div, span'));
      
      rows.forEach(row => {
        const text = row.textContent?.trim() || '';
        const lowerText = text.toLowerCase();

        if (lowerText.includes('consumer name')) {
          details.consumerName = this.extractValueAfterColon(text) || details.consumerName;
        }
        if (lowerText.includes('total payable') || lowerText.includes('amount payable') || lowerText.includes('total amount')) {
          const amtStr = text.replace(/[^\d.]/g, '');
          const amt = parseFloat(amtStr);
          if (!isNaN(amt)) details.totalAmountPayable = amt;
        }
        if (lowerText.includes('due date')) {
          details.dueDate = this.extractValueAfterColon(text) || details.dueDate;
        }
        if (lowerText.includes('address')) {
          details.address = this.extractValueAfterColon(text) || details.address;
        }
      });

      return details;
    } catch (e) {
      console.error('HMWSSB Parsing Error:', e);
      return null;
    }
  }

  private extractValueAfterColon(text: string): string {
    const parts = text.split(':');
    return parts.length > 1 ? parts[1].trim() : '';
  }
}
