const fs = require('fs');
const filePath = 'c:/Billa works/BillaFinance/src/app/admin/dashboard/dashboard.component.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find exact position of the buttons block
const searchStr = 'viewHouseBills(house.id!)';
const idx = content.indexOf(searchStr);
if (idx === -1) { console.log('Not found'); process.exit(1); }

// Find start of the containing <div class="flex items-center gap-4">
const divStart = content.lastIndexOf('<div class="flex items-center gap-4">', idx);
// Find end of the containing </div> after the buttons
let depth = 0, pos = divStart;
while (pos < content.length) {
  if (content[pos] === '<') {
    if (content.substring(pos, pos+5) === '<div ') depth++;
    else if (content.substring(pos, pos+6) === '</div>') {
      if (depth === 1) { pos += 6; break; }
      depth--;
    }
  }
  pos++;
}

const original = content.substring(divStart, pos);
console.log('Captured block (first 200 chars):', JSON.stringify(original.substring(0, 200)));

const billsPanel = `<!-- Linked Utility Bills on Card -->
                    @if (getLinkedServicesForHouse(house).length > 0) {
                      <div class="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
                            Linked Bills
                          </span>
                          <button (click)="syncLinkedBillsForHouse(house); $event.stopPropagation()" [disabled]="isSyncing"
                                  class="flex items-center gap-1 text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-all disabled:opacity-50">
                            <svg class="w-3 h-3" [class.animate-spin]="isSyncing" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            Sync All
                          </button>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          @for (s of getLinkedServicesForHouse(house); track s.id) {
                            <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                              <span class="text-xs">{{ s.serviceType === 'electricity' ? '⚡' : s.serviceType === 'water' ? '💧' : '📡' }}</span>
                              <div>
                                <p class="text-[8px] font-black text-gray-700 dark:text-gray-300 uppercase leading-none">{{ s.provider }}</p>
                                @if (s.lastAmount) {
                                  <p class="text-[8px] font-bold text-rose-500 leading-none mt-0.5">₹{{ s.lastAmount }}</p>
                                } @else {
                                  <p class="text-[8px] text-gray-400 leading-none mt-0.5">No data</p>
                                }
                              </div>
                              <button (click)="handleFetchLiveBill(s); $event.stopPropagation()"
                                      class="ml-0.5 p-1 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                      title="Fetch latest bill">
                                <svg class="w-3 h-3" [class.animate-spin]="syncingServices[s.id!]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                              </button>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    ` + original;

content = content.substring(0, divStart) + billsPanel + content.substring(pos);
fs.writeFileSync(filePath, content);
console.log('SUCCESS: Linked bills panel injected before action buttons.');
