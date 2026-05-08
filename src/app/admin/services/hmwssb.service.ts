import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface HmwssbBillDetails {
  consumerName: string;
  canNumber: string;         // Consumer Account Number (service number)
  address: string;
  zone: string;
  division: string;
  section: string;
  meterNumber?: string;
  billDate?: string;
  billPeriod?: string;
  currentMonthAmount: number;
  arrearsAmount: number;
  totalAmountPayable: number;
  dueDate: string;
  connectionType?: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HmwssbService {
  private http = inject(HttpClient);

  // Proxy paths configured in proxy.conf.json
  private localProxyPath = '/api/hmwssb';
  private erpProxyPath = '/api/hmwssb-erp';

  /**
   * Fetch water bill details for a given CAN (Consumer Account Number).
   * Uses the HMWSSB public API endpoint via Angular proxy to bypass CORS.
   */
  fetchBillDetails(canNumber: string): Observable<HmwssbBillDetails | null> {
    const can = canNumber.trim();
    // Try primary portal first
    return this.fetchFromPortal(this.localProxyPath, can).pipe(
      catchError(() => {
        // Fallback to ERP portal
        console.log('HMWSSB Portal failed, trying ERP fallback...');
        return this.fetchFromPortal(this.erpProxyPath, can);
      }),
      catchError(() => {
        // Final fallback to JSON API
        console.log('HMWSSB Portal/ERP failed, trying JSON API fallback...');
        return this.fetchFromJsonApi(can);
      })
    );
  }

  private fetchFromPortal(basePath: string, canNumber: string): Observable<HmwssbBillDetails | null> {
    const url = `${basePath}/HmwssbOnlineNew/api/ConsumerBillInfo?can=${canNumber}`;
    
    // Comprehensive headers to mimic a browser request from the HMWSSB site itself
    const targetDomain = basePath.includes('erp') ? 'erp.hyderabadwater.gov.in' : 'www.hyderabadwater.gov.in';
    const headers = new HttpHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Referer': `https://${targetDomain}/HmwssbOnlineNew/`,
      'Origin': `https://${targetDomain}`
    });

    return this.http.get(url, { headers, responseType: 'text' }).pipe(
      map(response => {
        if (!response || response.includes('rejected') || response.includes('Consult with your administrator')) {
          throw new Error('Request Rejected by WAF');
        }
        return this.parseResponse(response, canNumber);
      })
    );
  }

  /**
   * Alternate: Try JSON API endpoint.
   */
  private fetchFromJsonApi(canNumber: string): Observable<HmwssbBillDetails | null> {
    const url = `${this.erpProxyPath}/HmwssbOnlineNew/api/CustomerBillInfo/${canNumber.trim()}`;
    
    const headers = new HttpHeaders({
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Referer': 'https://erp.hyderabadwater.gov.in/HmwssbOnlineNew/',
      'Origin': 'https://erp.hyderabadwater.gov.in'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(data => {
        if (!data) return null;
        return this.parseJsonResponse(data, canNumber);
      }),
      catchError(err => {
        console.error('HMWSSB JSON API Error:', err);
        return of(null);
      })
    );
  }

  /**
   * Parse HTML response from HMWSSB portal.
   */
  private parseResponse(response: string, canNumber: string): HmwssbBillDetails | null {
    // Try JSON first (API might return JSON even with text type)
    try {
      const json = JSON.parse(response);
      if (json) return this.parseJsonResponse(json, canNumber);
    } catch (_) {
      // Not JSON, try HTML
    }

    // HTML parsing
    if (response.toLowerCase().includes('invalid') || response.toLowerCase().includes('not found') || response.trim().length < 50) {
      return null;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(response, 'text/html');
      return this.parseHtmlDocument(doc, canNumber);
    } catch (e) {
      console.error('HMWSSB HTML Parse Error:', e);
      return null;
    }
  }

  /**
   * Parse JSON API response (HMWSSB REST API format).
   */
  private parseJsonResponse(data: any, canNumber: string): HmwssbBillDetails | null {
    if (!data) return null;

    // Handle array response
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) return null;

    const totalAmount = parseFloat(item.totalAmount || item.TotalAmount || item.payableAmount || item.PayableAmount || '0') || 0;
    const arrears = parseFloat(item.arrears || item.Arrears || item.arrearAmount || item.ArrearAmount || '0') || 0;
    const current = parseFloat(item.currentAmount || item.CurrentAmount || item.billAmount || item.BillAmount || '0') || 0;

    if (totalAmount === 0 && arrears === 0 && current === 0) return null;

    return {
      consumerName: item.consumerName || item.ConsumerName || item.name || item.Name || 'Unknown',
      canNumber: item.can || item.CAN || item.canNumber || canNumber,
      address: item.address || item.Address || item.consumerAddress || '',
      zone: item.zone || item.Zone || item.zoneName || '',
      division: item.division || item.Division || item.divisionName || '',
      section: item.section || item.Section || item.sectionName || '',
      meterNumber: item.meterNo || item.MeterNo || item.meterNumber || '',
      billDate: item.billDate || item.BillDate || '',
      billPeriod: item.billPeriod || item.BillPeriod || item.billingPeriod || '',
      currentMonthAmount: current || (totalAmount - arrears),
      arrearsAmount: arrears,
      totalAmountPayable: totalAmount || (arrears + current),
      dueDate: item.dueDate || item.DueDate || item.paymentDueDate || '--',
      connectionType: item.connectionType || item.ConnectionType || item.category || 'Domestic',
      success: true
    };
  }

  /**
   * Parse HTML document from HMWSSB portal.
   */
  private parseHtmlDocument(doc: Document, canNumber: string): HmwssbBillDetails | null {
    const details: HmwssbBillDetails = {
      consumerName: 'Unknown',
      canNumber,
      address: '',
      zone: '',
      division: '',
      section: '',
      currentMonthAmount: 0,
      arrearsAmount: 0,
      totalAmountPayable: 0,
      dueDate: '--',
      success: true
    };

    const rows = Array.from(doc.querySelectorAll('tr, .row, .field'));
    let currentSection = '';

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th, .label, .value'));
      for (let i = 0; i < cells.length; i++) {
        const label = cells[i]?.textContent?.trim()?.toLowerCase() || '';
        const value = cells[i + 1]?.textContent?.trim() || '';

        if (label.includes('consumer name') || label.includes('name')) {
          details.consumerName = value || details.consumerName;
        }
        if (label.includes('address')) {
          details.address = value;
        }
        if (label.includes('zone')) {
          details.zone = value;
        }
        if (label.includes('division')) {
          details.division = value;
        }
        if (label.includes('section')) {
          details.section = value;
        }
        if (label.includes('due date') || label.includes('last date')) {
          details.dueDate = value;
        }
        if (label.includes('arrear') || label.includes('previous')) {
          const amt = parseFloat(value.replace(/[^\d.]/g, ''));
          if (!isNaN(amt)) details.arrearsAmount = amt;
        }
        if (label.includes('current') && label.includes('month')) {
          const amt = parseFloat(value.replace(/[^\d.]/g, ''));
          if (!isNaN(amt)) details.currentMonthAmount = amt;
        }
        if (label.includes('total') || label.includes('payable') || label.includes('net amount')) {
          const amt = parseFloat(value.replace(/[^\d.]/g, ''));
          if (!isNaN(amt) && amt > 0) details.totalAmountPayable = amt;
        }
        if (label.includes('meter')) {
          details.meterNumber = value;
        }
        if (label.includes('bill date')) {
          details.billDate = value;
        }
        if (label.includes('period')) {
          details.billPeriod = value;
        }
        if (label.includes('connection') || label.includes('category')) {
          details.connectionType = value;
        }
      }
    });

    // Fallback total calculation
    if (details.totalAmountPayable === 0) {
      details.totalAmountPayable = details.arrearsAmount + details.currentMonthAmount;
    }

    // If nothing useful was parsed, return null
    if (details.totalAmountPayable === 0 && details.consumerName === 'Unknown') {
      return null;
    }

    return details;
  }

  /**
   * Build portal URL for manual verification.
   */
  buildPortalUrl(canNumber: string): string {
    return `https://www.hyderabadwater.gov.in/en/index.php/services/customers-services/pay-your-bill-online1`;
  }
}
