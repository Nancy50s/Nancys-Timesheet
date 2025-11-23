import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TimesheetRow } from './components/TimesheetRow';
import { TimeEntry } from './types';

// Declare html2canvas globally as it's loaded via script tag in index.html
declare const html2canvas: any;

const DAYS = ['Mon.', 'Tues.', 'Wed.', 'Thurs.', 'Fri.', 'Sat.', 'Sun.'];

const DAY_MAPPING: Record<string, number> = {
  'Sun.': 0, 'Mon.': 1, 'Tues.': 2, 'Wed.': 3, 'Thurs.': 4, 'Fri.': 5, 'Sat.': 6
};
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STORAGE_KEY = 'nancy_mays_timesheet_v1';

// Function to generate fresh empty rows
const generateEmptyRows = (): TimeEntry[] => {
  return Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    day: DAYS[i % 7],
    date: '',
    in1: '',
    out1: '',
    in2: '',
    out2: '',
    break: '',
    hours: '',
    otHours: '',
    sales: '',
    tips: ''
  }));
};

// Generate 15-minute increments for the datalist starting at 4:30 AM and ending at 4:30 PM
const TIME_OPTIONS: string[] = [];
const startMinutes = 4 * 60 + 30; // 4:30 AM
const endMinutes = 16 * 60 + 30;  // 4:30 PM

for (let m = startMinutes; m <= endMinutes; m += 15) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minuteStr = min.toString().padStart(2, '0');
  
  TIME_OPTIONS.push(`${hour12}:${minuteStr} ${ampm}`);
}

// Helper to parse date string into Date object (Noon to avoid timezone shifts)
const parseDateString = (value: string): Date | null => {
  if (!value) return null;
  
  // Robust check for MM/DD/YYYY or M/D/YYYY from dropdown or text input
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
       const m = parseInt(parts[0], 10);
       const d = parseInt(parts[1], 10);
       const y = parseInt(parts[2], 10);
       // Ensure year is fully entered (4 digits) to prevent premature 19xx auto-complete
       if (!isNaN(m) && !isNaN(d) && !isNaN(y) && y > 999) {
          // Month is 0-indexed in JS Date
          return new Date(y, m - 1, d, 12, 0, 0);
       }
    }
  }
  
  // Fallback Try YYYY-MM-DD
  let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), 12, 0, 0);
  }

  // Fallback Try MM-DD-YYYY
  match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]), 12, 0, 0);
  }

  return null;
}

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [name, setName] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.name || '';
      }
    } catch (e) {
      console.error("Failed to load name from cache", e);
    }
    return '';
  });
  
  // Initialize periodEnding (Stores as MM/DD/YYYY string now)
  const [periodEnding, setPeriodEnding] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.periodEnding) return parsed.periodEnding;
      }
    } catch (e) {}
    return '';
  });

  const [rows, setRows] = useState<TimeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rows) return parsed.rows;
      }
    } catch (e) {
      console.error("Failed to load rows from cache", e);
    }
    return generateEmptyRows();
  });
  
  // Footer Totals
  const [regHours, setRegHours] = useState('');
  const [otHoursTotal, setOtHoursTotal] = useState('');
  const [totalSales, setTotalSales] = useState('');
  const [totalTips, setTotalTips] = useState('');

  // Validation & Modal State
  const [validationError, setValidationError] = useState<{ rowId: number; message: string; invalidValue?: string } | null>(null);
  const [autoCorrectWarning, setAutoCorrectWarning] = useState<{ rowId: number; message: string } | null>(null);
  const [showPeriodWarning, setShowPeriodWarning] = useState(false);

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  // Save feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
  // Text Entry Mode State
  const [isTextMode, setIsTextMode] = useState(false);
  
  // Ref for capturing screenshot
  const timesheetRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Persistence Effect
  useEffect(() => {
    try {
      const dataToSave = {
        name,
        rows,
        periodEnding
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Failed to save to cache", e);
    }
  }, [name, rows, periodEnding]);

  // Auto-update Pay Period Ending based on the last entered date
  useEffect(() => {
    // Priority: If Row 14 (index 13) has a date, that IS the Period Ending date.
    // This ensures that when the final date is entered, the header matches it.
    if (rows[13] && rows[13].date) {
       setPeriodEnding(rows[13].date);
       return;
    }

    const rowsWithDates = rows.filter(r => r.date && r.date.trim() !== '');
    if (rowsWithDates.length > 0) {
      // Get the last row that has a date
      const lastDate = rowsWithDates[rowsWithDates.length - 1].date;
      setPeriodEnding(lastDate);
    } else {
      setPeriodEnding('');
    }
  }, [rows]);

  // Handle outside clicks for period warning
  useEffect(() => {
    if (showPeriodWarning) {
      const handleDismiss = () => setShowPeriodWarning(false);
      document.addEventListener('click', handleDismiss);
      return () => document.removeEventListener('click', handleDismiss);
    }
  }, [showPeriodWarning]);

  // Helper to calculate totals locally
  const calculateTotals = useCallback(() => {
    let h = 0;
    let ot = 0;
    let s = 0;
    let t = 0;
    
    rows.forEach(r => {
      // Sum Hours
      const valH = parseFloat(r.hours);
      if (!isNaN(valH)) h += valH;
      
      // Sum OT Hours
      const valOT = parseFloat(r.otHours);
      if (!isNaN(valOT)) ot += valOT;

      // Sum Sales
      const cleanSales = r.sales.replace(/[^0-9.-]+/g, '');
      const valS = parseFloat(cleanSales);
      if (!isNaN(valS)) s += valS;

      // Sum Tips
      const cleanTips = r.tips.replace(/[^0-9.-]+/g, '');
      const valT = parseFloat(cleanTips);
      if (!isNaN(valT)) t += valT;
    });

    setRegHours(h.toFixed(2));
    setOtHoursTotal(ot.toFixed(2));
    setTotalSales('$' + s.toFixed(2));
    setTotalTips('$' + t.toFixed(2));
  }, [rows]);

  useEffect(() => {
    calculateTotals();
  }, [rows, calculateTotals]);

  // --- Actions ---

  const handleSave = () => {
    setIsSaving(true);
    // Data is auto-saved via useEffect, this provides visual feedback
    setTimeout(() => {
      setIsSaving(false);
    }, 2000);
  };
  
  const handleCopyScreenshot = async () => {
    if (!timesheetRef.current) return;
    setIsCopying(true);
    
    try {
      // html2canvas is loaded globally
      const canvas = await html2canvas(timesheetRef.current, {
         scale: 2, // Better quality
         useCORS: true,
         backgroundColor: '#ffffff',
         ignoreElements: (element: Element) => element.classList.contains('no-screenshot') // Ignore buttons
      });
      
      canvas.toBlob(async (blob: Blob | null) => {
         if (blob) {
           try {
             await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
             ]);
           } catch (err) {
             console.error("Clipboard write failed", err);
             alert("Failed to copy to clipboard. Your browser might not support this.");
           }
         }
         setTimeout(() => setIsCopying(false), 2000);
      });
    } catch (e) {
       console.error("Screenshot failed", e);
       setIsCopying(false);
    }
  };

  const requestReset = () => {
    setShowConfirmReset(true);
  };

  const performReset = () => {
    setRows(generateEmptyRows());
    setName('');
    setPeriodEnding('');
    setShowConfirmReset(false);
    setValidationError(null);
    setAutoCorrectWarning(null);
    setShowPeriodWarning(false);
  };

  const dismissError = () => {
    setValidationError(null);
  };

  const dismissAutoCorrect = () => {
    setAutoCorrectWarning(null);
  };

  const handlePeriodClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hasDates = rows.some(r => r.date && r.date.trim() !== '');
    if (!hasDates) {
      setShowPeriodWarning(true);
    }
  };

  const handleRowChange = (id: number, field: keyof TimeEntry, value: string) => {
    const numericId = Number(id);
    let finalValue = value;

    // --- VALIDATION LOGIC ---
    if (field === 'date' && value !== '') {
      const targetRow = rows.find(r => r.id === numericId);
      if (targetRow) {
        const dateObj = parseDateString(value);
        
        if (dateObj) {
            const actualDayIndex = dateObj.getDay();
            const expectedDayIndex = DAY_MAPPING[targetRow.day];

            if (actualDayIndex !== expectedDayIndex) {
              
              // AUTO-CORRECTION LOGIC FOR MONDAY IN TEXT MODE
              if (isTextMode && targetRow.day === 'Mon.') {
                  // Calculate days to subtract to reach previous Monday
                  let daysToSubtract = (actualDayIndex + 6) % 7;
                  if (daysToSubtract === 0) daysToSubtract = 7; // Should not happen in mismatch block, but safe fallback
                  
                  const correctedDate = new Date(dateObj);
                  correctedDate.setDate(dateObj.getDate() - daysToSubtract);
                  
                  const mm = String(correctedDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(correctedDate.getDate()).padStart(2, '0');
                  const yyyy = correctedDate.getFullYear();
                  const correctedDateStr = `${mm}/${dd}/${yyyy}`;
                  
                  finalValue = correctedDateStr;
                  
                  setAutoCorrectWarning({
                    rowId: numericId,
                    message: `Date adjusted to previous Monday (${correctedDateStr}) to maintain weekly schedule.`
                  });
                  
                  // Clear existing strict error if present
                  if (validationError?.rowId === numericId) setValidationError(null);

              } else {
                // Strict validation error
                setValidationError({
                  rowId: numericId,
                  message: `${value} is a ${FULL_DAY_NAMES[actualDayIndex]}, but this row is for ${targetRow.day}`,
                  invalidValue: value
                });
                return; // Stop processing so we don't update state with invalid date
              }
            } else {
              // Valid date entered
              if (validationError?.rowId === numericId) {
                setValidationError(null);
              }
              // Clear auto-correct warning if user manually corrects it or re-enters valid date
              if (autoCorrectWarning?.rowId === numericId) {
                setAutoCorrectWarning(null);
              }
            }
        }
      }
    }

    setRows(prev => {
      // Check if we are changing a date, which triggers a cascade update
      const isDateCascade = field === 'date' && finalValue !== '';
      
      let anchorDate: Date | null = null;
      if (isDateCascade) {
        const inputDate = parseDateString(finalValue);
        if (inputDate) {
           anchorDate = new Date(inputDate);
           anchorDate.setDate(anchorDate.getDate() - numericId);
        }
      }

      return prev.map(row => {
        const updatedRow = { ...row };

        if (row.id === numericId) {
          if (field !== 'id') {
            (updatedRow as any)[field] = finalValue;
          }
        }

        if (isDateCascade && anchorDate) {
          const rowDate = new Date(anchorDate);
          rowDate.setDate(anchorDate.getDate() + row.id);
          
          const yyyy = rowDate.getFullYear();
          const mm = String(rowDate.getMonth() + 1).padStart(2, '0');
          const dd = String(rowDate.getDate()).padStart(2, '0');
          updatedRow.date = `${mm}/${dd}/${yyyy}`;
        }

        if (row.id === numericId && ['in1', 'out1', 'in2', 'out2'].includes(field as string)) {
          
          const toMinutes = (timeStr: string): number | null => {
            if (!timeStr) return null;
            const [time, modifier] = timeStr.split(' ');
            if (!time || !modifier) return null;
            let [h, m] = time.split(':').map(Number);
            if (isNaN(h) || isNaN(m)) return null;
            if (h === 12 && modifier === 'AM') h = 0;
            if (h !== 12 && modifier === 'PM') h += 12;
            return h * 60 + m;
          };

          const tIn1 = toMinutes(updatedRow.in1);
          const tOut1 = toMinutes(updatedRow.out1);
          const tIn2 = toMinutes(updatedRow.in2);
          const tOut2 = toMinutes(updatedRow.out2);

          if (tOut1 !== null && tIn2 !== null) {
            let breakDiff = tIn2 - tOut1;
            if (breakDiff > 0) {
               const h = Math.floor(breakDiff / 60);
               const m = breakDiff % 60;
               updatedRow.break = `${h}:${m.toString().padStart(2, '0')}`;
            } else {
              updatedRow.break = '';
            }
          } else {
             if (field === 'out1' || field === 'in2') {
               updatedRow.break = '';
             }
          }

          let totalMinutes = 0;
          let hasCalculated = false;

          if (tIn1 !== null && tOut1 !== null) {
            let diff = tOut1 - tIn1;
            if (diff < 0) diff += 1440;
            totalMinutes += diff;
            hasCalculated = true;
          }

          if (tIn2 !== null && tOut2 !== null) {
            let diff = tOut2 - tIn2;
            if (diff < 0) diff += 1440;
            totalMinutes += diff;
            hasCalculated = true;
          }

          if (hasCalculated) {
            const decimalHours = totalMinutes / 60;
            updatedRow.hours = decimalHours.toFixed(2);
            if (decimalHours > 8) {
              updatedRow.otHours = (decimalHours - 8).toFixed(2);
            } else {
              updatedRow.otHours = '';
            }
          } else {
            updatedRow.hours = '';
            updatedRow.otHours = '';
          }
        }

        return updatedRow;
      });
    });
  };

  const totalInputClass = "w-full h-full bg-transparent text-center focus:outline-none text-base font-bold font-[Arial] text-gray-800 appearance-none rounded-none";
  
  return (
    <div className="min-h-screen bg-white flex flex-col w-full overflow-x-auto">
      
      {/* Main Content Wrapper */}
      <div ref={timesheetRef} className="bg-white relative shrink-0 w-max max-w-none inline-block px-4 pb-4 pt-2 mx-auto">
            
        {/* ACTION BUTTONS (SAVE / SCREENSHOT / TEXT MODE / CLEAR) */}
        {/* Added no-screenshot class so buttons don't appear in the captured image */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start print:hidden no-screenshot">
          
          <div className="flex flex-row gap-2">
            <button 
              onClick={handleSave} 
              className="text-xs font-bold text-green-600 border-2 border-green-600 px-3 py-2 hover:bg-green-50 rounded uppercase tracking-wider bg-white min-w-[80px]" 
              title="Save changes"
            >
              {isSaving ? 'Saved!' : 'Save'}
            </button>
            <button 
              onClick={handleCopyScreenshot} 
              className="text-xs font-bold text-cyan-600 border-2 border-cyan-600 px-3 py-2 hover:bg-cyan-50 rounded uppercase tracking-wider bg-white min-w-[80px]" 
              title="Copy image to clipboard"
            >
              {isCopying ? 'Copied!' : 'COPY IMAGE'}
            </button>
            <button 
              onClick={() => setIsTextMode(!isTextMode)} 
              className={`text-xs font-bold border-2 px-3 py-2 rounded uppercase tracking-wider bg-white min-w-[80px] ${
                isTextMode 
                  ? 'text-purple-600 border-purple-600 hover:bg-purple-50' 
                  : 'text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
              title="Toggle between dropdown and text input"
            >
              {isTextMode ? 'Dropdown Mode' : 'Text Entry Mode'}
            </button>
            <button 
              onClick={requestReset} 
              className="text-xs font-bold text-red-600 border-2 border-red-600 px-3 py-2 hover:bg-red-50 rounded uppercase tracking-wider bg-white min-w-[80px]" 
              title="Delete all data and reset form"
            >
              Clear Form
            </button>
          </div>

          {showConfirmReset && (
            <div className="mt-2 w-64 bg-white border-4 border-black shadow-xl p-3 text-center relative self-end">
               <div className="absolute -top-1 -left-1 w-full h-full bg-red-100 -z-10 border-4 border-black hidden sm:block"></div>
               
               {/* Caret pointing UP */}
               <div className="absolute top-[-10px] right-4 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black"></div>
               <div className="absolute top-[-4px] right-4 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
               
               <h4 className="text-red-600 font-bold font-[Arial] uppercase text-sm mb-2 tracking-wider">Wait a sec!</h4>
               <p className="text-xs font-[Arial] mb-3 leading-snug text-gray-800 font-medium">
                  Are you sure you want to clear the form? This will delete all your hard work.
               </p>
               <div className="flex justify-center gap-2">
                  <button onClick={() => setShowConfirmReset(false)} className="bg-gray-200 hover:bg-gray-300 text-black border-2 border-black font-bold py-1 px-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">Cancel</button>
                  <button onClick={performReset} className="bg-red-600 hover:bg-red-700 text-white border-2 border-black font-bold py-1 px-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">Yes, Clear</button>
               </div>
            </div>
          )}
        </div>

        <div className="mt-16 mb-6">
          <h1 className="text-xl font-black text-left uppercase tracking-widest font-[Arial] text-black leading-none">NANCY MAY'S 50'S CAFE</h1>
          <h2 className="text-xl font-black text-left uppercase tracking-widest font-[Arial] text-black leading-none mt-1">TIME SHEET</h2>
        </div>

        {/* --- HEADER --- */}
        <div className="flex flex-row justify-between items-end mb-6 gap-8 mt-0 px-2">
          <div className="flex-1 flex flex-row items-end mr-4">
            <span className="text-xl font-bold mr-2 whitespace-nowrap">Name:</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className="w-full border-b-4 border-black text-2xl font-bold font-[Arial] px-2 bg-transparent focus:bg-transparent focus:outline-none rounded-none appearance-none"/>
          </div>
          <div className="flex-1 flex flex-row items-end relative">
            <span className="text-xl font-bold mr-2 whitespace-nowrap">Pay Period Ending:</span>
            <div className="relative w-full flex items-center" onClick={handlePeriodClick}>
              
              {/* Text Input - Read Only */}
              <input 
                type="text" 
                value={periodEnding} 
                readOnly
                placeholder="MM/DD/YYYY"
                className="w-full border-b-4 border-black text-2xl font-bold font-[Arial] px-2 bg-transparent focus:outline-none text-center rounded-none appearance-none cursor-pointer"
              />

              {/* Period Warning Popup */}
              {showPeriodWarning && (
                <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-white border-4 border-black shadow-xl p-3 text-left origin-top-left animate-in fade-in zoom-in-95 duration-200 cursor-pointer">
                   <div className="absolute -top-[10px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black"></div>
                   <div className="absolute -top-[4px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
                   <h4 className="text-red-600 font-bold font-[Arial] uppercase text-xs mb-1 tracking-wider">Dates Missing!</h4>
                   <p className="text-xs font-[Arial] mb-0 leading-snug text-gray-800 font-medium">Enter the dates in the spreadsheet first.</p>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="flex flex-col border-t-4 border-black pt-2 md:pt-0">
          <div className="">
            <table className="border-collapse table-fixed w-max">
              <thead>
                <tr>
                  <th className="border-r-2 border-b-4 border-black text-center py-1 w-10">No.</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-16">Day</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-32">Date</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-28">In - 1</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-28">Out - 1</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-20">Break</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-28">In - 2</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-28">Out - 2</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-20">Hours</th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-20">O.T. Hours</th>
                  <th className="border-r-2 border-b-4 border-black w-4 bg-stone-200"></th>
                  <th className="border-r-2 border-b-4 border-black text-left pl-2 py-1 w-24">Sales</th>
                  <th className="border-b-4 border-black text-left pl-2 py-1 w-24">Tips</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <TimesheetRow 
                    key={row.id} 
                    entry={row} 
                    onChange={handleRowChange} 
                    timeOptions={TIME_OPTIONS} 
                    validationError={validationError?.rowId === row.id ? validationError : null}
                    onDismissError={dismissError}
                    name={name}
                    isTextMode={isTextMode}
                    autoCorrectWarning={autoCorrectWarning?.rowId === row.id ? autoCorrectWarning : null}
                    onDismissAutoCorrect={dismissAutoCorrect}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={8} className="border-r-2 border-b-4 border-black text-right p-2 font-bold text-sm align-middle">Totals:</td>
                  <td className="border-r-2 border-b-4 border-black p-0 h-10 bg-yellow-50/30"><input className={totalInputClass} value={regHours} readOnly /></td>
                  <td className="border-r-2 border-b-4 border-black p-0 h-10 bg-yellow-50/30"><input className={totalInputClass} value={otHoursTotal} readOnly /></td>
                  <td className="border-r-2 border-b-4 border-black bg-stone-200"></td>
                  <td className="border-r-2 border-b-4 border-black p-0 h-10"><input className={totalInputClass} value={totalSales} readOnly /></td>
                  <td className="border-b-4 border-black p-0 h-10"><input className={totalInputClass} value={totalTips} readOnly /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;