import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.9)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ],
  template: `
    <div class="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none sm:max-w-md w-full sm:w-auto px-4 sm:px-0">
      @for (toast of toastService.toasts(); track toast.id) {
        <div @toastAnimation
             class="pointer-events-auto flex items-center w-full sm:min-w-[300px] sm:max-w-md p-4 rounded-xl shadow-2xl border text-sm font-semibold"
             [ngClass]="{
               'bg-emerald-600 border-emerald-500 text-white': toast.type === 'success',
               'bg-red-600 border-red-500 text-white': toast.type === 'error',
               'bg-amber-500 border-amber-400 text-white': toast.type === 'warning',
               'bg-blue-600 border-blue-500 text-white': toast.type === 'info'
             }">
          
          <div class="mr-3">
             @if (toast.type === 'success') {
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                   <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </span>
             } @else if (toast.type === 'error') {
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400">
                   <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </span>
             } @else if (toast.type === 'warning') {
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                   <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </span>
             } @else {
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                   <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
             }
          </div>
          <div class="flex-1">
             {{ toast.message }}
          </div>
          <button (click)="toastService.remove(toast.id)" class="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
             <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
