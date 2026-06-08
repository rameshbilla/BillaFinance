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

  async sendRentReminder(phone: string, name: string, houseName: string, amount: number, month: string, year: number, preferredType: 'whatsapp' | 'sms' = 'whatsapp') {
    const formattedAmount = amount.toLocaleString('en-IN');
    const message = `Hello ${name}, this is a reminder from BillaFinance regarding rent & utilities due for ${houseName} (${month} ${year}). ` +
      `Total pending: ₹${formattedAmount}. ` +
      `Please clear the dues at your earliest convenience. Thank you!`;

    try {
      if (preferredType === 'whatsapp') {
        await this.whatsappService.sendMessage(phone, message);
        this.toast.success('WhatsApp rent reminder sent successfully!');
      } else {
        await this.smsService.sendSms(phone, message);
        this.toast.success('SMS rent reminder sent successfully!');
      }
      return true;
    } catch (error) {
      console.error(`Failed to send ${preferredType} rent reminder:`, error);
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
        this.toast.error(`Failed to send ${preferredType} rent reminder.`);
      }
      return false;
    }
  }

  async sendRentReceiptNotification(phone: string, name: string, houseName: string, amount: number, month: string, year: number, preferredType: 'whatsapp' | 'sms' = 'whatsapp') {
    const formattedAmount = amount.toLocaleString('en-IN');
    const message = `Hello ${name}, thank you! We have received your rent payment of ₹${formattedAmount} for ${houseName} (${month} ${year}). ` +
      `Your payment record is updated on BillaFinance. You can download the receipt from your dashboard.`;

    try {
      if (preferredType === 'whatsapp') {
        await this.whatsappService.sendMessage(phone, message);
      } else {
        await this.smsService.sendSms(phone, message);
      }
      return true;
    } catch (error) {
      console.error('Failed to send payment receipt notification:', error);
      return false;
    }
  }
}
