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
export class HmwssbService {
  private http = inject(HttpClient);
  
  private get billdeskUrl() {
    return Capacitor.getPlatform() === 'web' ? '/api/billdesk' : 'https://www.billdesk.com';
  }

  fetchBillDetails(can: string): Observable<HmwssbBillDetails | null> {
    // New specific endpoint approach to resolve proxy 404s
    const fullUrl = Capacitor.getPlatform() === 'web' 
      ? '/api/billdesk-water' 
      : 'https://billdesk.com/pgidsk/pgmerc/hmwssb/HMWSSBNPaymentoption.jsp';
      
    const body = new URLSearchParams();
    body.set('canNumber', can);

    return this.http.post(fullUrl, body.toString(), { 
      responseType: 'text',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      }
    }).pipe(
      map(html => {
        if (html && html.length > 200) { 
          const parsed = this.parseHmwssbHtml(html, can);
          if (parsed && (parsed.totalAmountPayable >= 0 || (parsed.consumerName && parsed.consumerName !== 'Unknown'))) {
            return parsed;
          }
        }
        console.error('HMWSSB: Received invalid response from BillDesk Payment Option page.');
        return null;
      }),
      catchError(err => {
        console.error('HMWSSB BillDesk Fetch Error:', err);
        return of(null);
      })
    );
  }

  private parseHmwssbHtml(html: string, can: string): HmwssbBillDetails | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Target the specific container provided by the user
    const container = doc.querySelector('.content-container');
    if (!container) {
      console.warn('HMWSSB: .content-container not found in response. Falling back to body search.');
    }

    try {
      const details: HmwssbBillDetails = {
        consumerName: 'Unknown',
        uniqueServiceNumber: can,
        can: can,
        address: '',
        totalAmountPayable: 0,
        amountLabel: 'Total Arrears',
        dueDate: 'Check Portal',
        success: true
      };

      // Search for specific label/content pairs
      const searchScope = container || doc.body;
      const labels = Array.from(searchScope.querySelectorAll('.label.col'));
      
      labels.forEach(labelEl => {
        const labelText = labelEl.textContent?.trim().toLowerCase() || '';
        const contentEl = labelEl.nextElementSibling;
        if (!contentEl) return;
        
        const contentText = contentEl.textContent?.trim() || '';

        if (labelText.includes('name')) {
          details.consumerName = contentText || details.consumerName;
        } else if (this.isPayableAmountLabel(labelText)) {
          const amt = this.parseAmount(contentText);
          if (amt !== null) {
            details.amountLabel = this.formatAmountLabel(labelEl.textContent || '');
            if (labelText.includes('paid amount')) {
              details.paidAmount = amt;
              details.isPaid = true;
            } else {
              details.totalAmountPayable = amt;
            }
          }
        } else if (labelText.includes('address')) {
          details.address = contentText || details.address;
        } else if (labelText.includes('paid date')) {
          details.paidDate = contentText || details.paidDate;
          details.isPaid = true;
        } else if (labelText.includes('due date')) {
          details.dueDate = contentText || details.dueDate;
        }
      });

      // Secondary fallback if specific classes failed
      if (details.consumerName === 'Unknown' || details.totalAmountPayable === 0) {
        const allElements = Array.from(searchScope.querySelectorAll('div, td, span'));
        allElements.forEach(el => {
          const text = el.textContent?.trim() || '';
          const lowerText = text.toLowerCase();
          
          if (details.consumerName === 'Unknown' && lowerText.includes('name :')) {
            details.consumerName = this.extractValueAfterColon(text);
          }
          if (details.totalAmountPayable === 0 && this.isPayableAmountLabel(lowerText)) {
            const val = this.extractValueAfterColon(text);
            const amt = this.parseAmount(val || text);
            if (amt !== null) {
              details.amountLabel = this.formatAmountLabel(text.split(':')[0] || text);
              if (lowerText.includes('paid amount')) {
                details.paidAmount = amt;
                details.isPaid = true;
              } else {
                details.totalAmountPayable = amt;
              }
            }
          }
          if (!details.paidDate && lowerText.includes('paid date')) {
            details.paidDate = this.extractValueAfterColon(text);
            details.isPaid = true;
          }
        });
      }

      if (details.totalAmountPayable === 0) {
        const allText = (searchScope.textContent || '').replace(/\s+/g, ' ');
        const fallback = this.extractLabeledAmount(allText, [
          'Paid Amount',
          'Total Arrears',
          'Total Amount Payable',
          'Amount Payable',
          'Payable Amount',
          'Total Amount'
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

  private isPayableAmountLabel(label: string): boolean {
    const normalized = label.toLowerCase();
    return normalized.includes('paid amount')
      || normalized.includes('total arrears')
      || normalized.includes('total amount payable')
      || normalized.includes('amount payable')
      || normalized.includes('payable amount')
      || normalized.includes('total amount');
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
      const regex = new RegExp(`${escapedLabel}\\s*[:\\-]?\\s*(?:₹|Rs\\.?\\s*)?([0-9,]+(?:\\.\\d+)?)`, 'i');
      const match = text.match(regex);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount !== null) return { label, amount };
      }
    }

    return null;
  }
}
