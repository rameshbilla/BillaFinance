import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private http = inject(HttpClient);
  
  // UltraMsg API URL
  private apiUrl = `https://api.ultramsg.com/${environment.whatsappInstance}/messages/chat`;

  async sendMessage(to: string, message: string): Promise<any> {
    if (environment.whatsappInstance === 'YOUR_INSTANCE_ID') {
      console.warn('WhatsApp API not configured. Message:', message);
      return { status: 'mocked' };
    }

    const body = {
      token: environment.whatsappToken,
      to: `91${to.replace(/\D/g, '')}`,
      body: message,
      priority: 1
    };

    try {
      if (Capacitor.getPlatform() === 'web') {
        return await firstValueFrom(this.http.post(this.apiUrl, body));
      } else {
        const response = await CapacitorHttp.post({
          url: this.apiUrl,
          data: body,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message', error);
      throw error;
    }
  }
}
