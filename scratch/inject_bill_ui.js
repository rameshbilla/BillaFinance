const fs = require('fs');
const filePath = 'c:/Billa works/BillaFinance/src/app/admin/dashboard/dashboard.component.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Use the exact 3-space indented form we see in the file
const target = '                       </div>\r\n                    </div>\r\n                    <div class="pt-8 flex gap-4">';

const replacement = `                       </div>
                    </div>

                    <!-- Link Utility Bills -->
                    <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
                       <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Link Utility Bills</label>
                       @if (trackedServices.length === 0) {
                          <p class="text-[10px] text-gray-400 italic py-2">No tracked services found in Bills section. Add them there first to link here.</p>
                       }
                       <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          @for (s of trackedServices; track s.id) {
                             <div (click)="toggleServiceLink(s.id!)"
                                  class="p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group"
                                  [class.bg-indigo-50]="isServiceLinked(s.id!)"
                                  [class.border-indigo-300]="isServiceLinked(s.id!)"
                                  [class.border-gray-100]="!isServiceLinked(s.id!)"
                                  [class.dark:border-gray-800]="!isServiceLinked(s.id!)">
                                <div class="flex items-center gap-3">
                                   <div class="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                                      {{ s.serviceType === 'electricity' ? '⚡' : s.serviceType === 'water' ? '💧' : '📡' }}
                                   </div>
                                   <div>
                                      <p class="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none">{{ s.provider }}</p>
                                      <p class="text-[9px] font-bold text-gray-400 mt-0.5">#{{ s.serviceNumber }}</p>
                                   </div>
                                </div>
                                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                                     [class.bg-indigo-600]="isServiceLinked(s.id!)"
                                     [class.border-indigo-600]="isServiceLinked(s.id!)"
                                     [class.border-gray-300]="!isServiceLinked(s.id!)">
                                   @if (isServiceLinked(s.id!)) {
                                      <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>
                                   }
                                </div>
                             </div>
                          }
                       </div>
                    </div>

                    <div class="pt-8 flex gap-4">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log('SUCCESS: Bill linking UI inserted.');
} else {
  console.log('Target not found. Trying CRLF variant...');
  // Windows CRLF
  const lines = content.split('\n');
  const idx = lines.findIndex(l => l.includes('renterPhone') && l.includes('formControlName'));
  if (idx !== -1) {
    // Insert after line idx+1 (closing div) and idx+2 (closing grid div)
    const insertAfter = idx + 2; // after </div> for renterPhone and </div> for grid
    const billUI = `
                    <!-- Link Utility Bills -->
                    <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
                       <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Link Utility Bills</label>
                       @if (trackedServices.length === 0) {
                          <p class="text-[10px] text-gray-400 italic py-2">No tracked services found in Bills section. Add them there first to link here.</p>
                       }
                       <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          @for (s of trackedServices; track s.id) {
                             <div (click)="toggleServiceLink(s.id!)"
                                  class="p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group"
                                  [class.bg-indigo-50]="isServiceLinked(s.id!)"
                                  [class.border-indigo-300]="isServiceLinked(s.id!)"
                                  [class.border-gray-100]="!isServiceLinked(s.id!)"
                                  [class.dark:border-gray-800]="!isServiceLinked(s.id!)">
                                <div class="flex items-center gap-3">
                                   <div class="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                                      {{ s.serviceType === 'electricity' ? '⚡' : s.serviceType === 'water' ? '💧' : '📡' }}
                                   </div>
                                   <div>
                                      <p class="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none">{{ s.provider }}</p>
                                      <p class="text-[9px] font-bold text-gray-400 mt-0.5">#{{ s.serviceNumber }}</p>
                                   </div>
                                </div>
                                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                                     [class.bg-indigo-600]="isServiceLinked(s.id!)"
                                     [class.border-indigo-600]="isServiceLinked(s.id!)"
                                     [class.border-gray-300]="!isServiceLinked(s.id!)">
                                   @if (isServiceLinked(s.id!)) {
                                      <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>
                                   }
                                </div>
                             </div>
                          }
                       </div>
                    </div>`;
    lines.splice(insertAfter, 0, billUI);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('SUCCESS via line splice at', insertAfter + 1);
  }
}
