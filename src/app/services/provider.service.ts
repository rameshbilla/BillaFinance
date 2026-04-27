import { Injectable } from '@angular/core';
import { DEFAULT_PROVIDERS, BILL_CATEGORIES, TELANGANA_CITIES } from '../models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  
  getCategories(): string[] {
    return BILL_CATEGORIES;
  }

  getProvidersByCategory(category: string): string[] {
    return DEFAULT_PROVIDERS[category] || [];
  }

  getTelanganaCities(): string[] {
    return TELANGANA_CITIES;
  }

  // Helper to suggest a provider based on category and city (e.g. for Electricity in Hyderabad)
  suggestProvider(category: string, city: string): string {
    if (category === 'Electricity') {
      const southern = ['Hyderabad', 'Mahabubnagar', 'Nalgonda'];
      return southern.includes(city) ? 'TGSPDCL' : 'TGNPDCL';
    }
    if (category === 'Water' && city === 'Hyderabad') {
      return 'HMWSSB';
    }
    return '';
  }
}
