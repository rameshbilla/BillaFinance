import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
      return await firstValueFrom(this.http.post(this.apiUrl, body));
    } catch (error) {
      console.error('Failed to send WhatsApp message', error);
      throw error;
    }
  }
}
