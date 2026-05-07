import { Injectable, inject } from '@angular/core';
import { WhatsAppService } from './whatsapp.service';
import { SmsService } from './sms.service';
import { ToastService } from '../../shared/toast.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private whatsappService = inject(WhatsAppService);
  private smsService = inject(SmsService);
  private toast = inject(ToastService);

  async sendReminder(phone: string, name: string, loanName: string, amount: number, dueDate: Date | null, preferredType: 'whatsapp' | 'sms' = 'whatsapp') {
    const formattedAmount = amount.toLocaleString('en-IN');
    const formattedDate = dueDate ? dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    
    const message = `Hello ${name}, this is a reminder from FinServe for your interest payment regarding ${loanName}. ` +
      `Amount due: ₹${formattedAmount}. ` +
      (formattedDate ? `Due date: ${formattedDate}. ` : '') +
      `Please pay to avoid penalties. Thank you!`;

    try {
      if (preferredType === 'whatsapp') {
        await this.whatsappService.sendMessage(phone, message);
        this.toast.success('WhatsApp reminder sent successfully!');
      } else {
        await this.smsService.sendSms(phone, message);
        this.toast.success('SMS reminder sent successfully!');
      }
      return true;
    } catch (error) {
      console.error(`Failed to send ${preferredType} reminder:`, error);
      
      // If WhatsApp fails, we DON'T fall back to manual wa.me link as per user request to hide personal number
      // Instead, we can try SMS as a fallback if it was WhatsApp that failed
      if (preferredType === 'whatsapp') {
        this.toast.info('WhatsApp API failed. Attempting SMS fallback...');
        try {
          await this.smsService.sendSms(phone, message);
          this.toast.success('SMS fallback sent!');
          return true;
        } catch (smsError) {
          this.toast.error('Both WhatsApp and SMS failed to send.');
        }
      } else {
        this.toast.error(`Failed to send ${preferredType} reminder.`);
      }
      return false;
    }
  }
}
