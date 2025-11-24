import React, { useState, useEffect, useMemo } from 'react';
import { TimeEntry } from '../types';

interface TimesheetRowProps {
  entry: TimeEntry;
  onChange: (id: number, field: keyof TimeEntry, value: string) => void;
  timeOptions: string[];
  validationError?: { rowId: number; message: string; invalidValue?: string } | null;
  onDismissError?: () => void;
  name: string;
  isTextMode: boolean;
  autoCorrectWarning?: { rowId: number; message: string } | null;
  onDismissAutoCorrect?: () => void;
}

const inputClass = "w-full h-full bg-transparent text-center focus:outline-none focus:bg-white/50 text-base font-bold font-[Arial] text-gray-800 appearance-none rounded-none";

const DAY_MAPPING: Record<string, number> = {
  'Sun.': 0, 'Mon.': 1, 'Tues.': 2, 'Wed.': 3, 'Thurs.': 4, 'Fri.': 5, 'Sat.': 6
};

export const TimesheetRow: React.FC<TimesheetRowProps> = ({ entry, onChange, timeOptions, validationError, onDismissError, name, isTextMode, autoCorrectWarning, onDismissAutoCorrect }) => {
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [showNameWarning, setShowNameWarning] = useState(false);

  useEffect(() => {
    if (showSkipWarning || showDateWarning || showNameWarning) {
      const handleDismiss = () => {
        setShowSkipWarning(false);
        setShowDateWarning(false);
        setShowNameWarning(false);
      };
      document.addEventListener('click', handleDismiss);
      return () => document.removeEventListener('click', handleDismiss);
    }
  }, [showSkipWarning, showDateWarning, showNameWarning]);

  const handleChange = (field: keyof TimeEntry) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;

    // Input Masking for Financial Columns
    if (field === 'sales' || field === 'tips') {
      const isValidFinancial = /^\$?[0-9]*\.?[0-9]*$/.test(val);
      if (!isValidFinancial) {
        return; 
      }
    }

    // Input Masking for Date in Text Mode (MM/DD/YYYY)
    if (field === 'date' && isTextMode) {
        const prevLen = entry.date ? entry.date.length : 0;
        const currentLen = val.length;

        // Only format if adding characters (typing/pasting), not deleting
        if (currentLen > prevLen) {
            const digits = val.replace(/\D/g, '');
            
            if (digits.length < 2) {
                val = digits;
            } else if (digits.length >= 2 && digits.length < 4) {
                val = digits.slice(0, 2) + '/' + digits.slice(2);
            } else if (digits.length >= 4) {
                val = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
            }
        }
    }

    onChange(entry.id, field, val);
  };

  // Format as currency on blur (e.g. $100.00)
  const handleBlur = (field: keyof TimeEntry) => (e: React.FocusEvent<HTMLInputElement>) => {
     const val = e.target.value;
     if (!val.trim()) return;
     const num = parseFloat(val.replace(/[^0-9.]/g, ''));
     if (!isNaN(num)) {
       onChange(entry.id, field, `$${num.toFixed(2)}`);
     }
  };

  const handleFixPreviousMonday = () => {
    if (!validationError?.invalidValue) return;
    
    // Parse the invalid date (format is typically MM/DD/YYYY)
    const val = validationError.invalidValue;
    const parts = val.split('/');
    if (parts.length !== 3) return;
    
    const m = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    
    // Create date object (noon to avoid timezone issues)
    const date = new Date(y, m - 1, d, 12, 0, 0);
    
    // Calculate days to subtract to get to the previous Monday
    // If it's currently Monday (1), go back 7 days.
    // If it's Tuesday (2), go back 1 day.
    const currentDay = date.getDay(); // 0-6
    let daysToSubtract = (currentDay + 6) % 7;
    if (daysToSubtract === 0) daysToSubtract = 7;
    
    date.setDate(date.getDate() - daysToSubtract);
    
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const newDateStr = `${mm}/${dd}/${yyyy}`;
    
    onChange(entry.id, 'date', newDateStr);
    
    if (onDismissError) onDismissError();
  };

  // Dynamic filtering for time dropdowns
  const getFilteredOptions = (prevTime: string) => {
    if (!prevTime) return timeOptions;
    const index = timeOptions.indexOf(prevTime);
    return index === -1 ? timeOptions : timeOptions.slice(index + 1);
  };

  // Generate valid dates for this row's day of the week
  const dateOptions = useMemo(() => {
    const targetDay = DAY_MAPPING[entry.day];
    if (targetDay === undefined) return [];

    const options = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const start = new Date(today);
    start.setDate(today.getDate() - 14); 

    const end = new Date(today.getFullYear(), today.getMonth() + 6, 31); 

    let current = new Date(start);
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    while (current <= end) {
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const yyyy = current.getFullYear();
      options.push(`${mm}/${dd}/${yyyy}`);
      current.setDate(current.getDate() + 7);
    }
    return options;
  }, [entry.day]);

  const isErrorTarget = validationError && validationError.rowId === entry.id;
  const isAutoCorrectTarget = autoCorrectWarning && autoCorrectWarning.rowId === entry.id;
  
  const disabledClass = "opacity-50 bg-gray-200 cursor-not-allowed";

  // --- COLOR BANDING ---
  // Row Banding: Alternating Orange/White normally, Purple theme when in Text Mode
  const rowBgClass = isTextMode 
    ? (entry.id % 2 !== 0 ? 'bg-purple-100' : 'bg-purple-50')
    : (entry.id % 2 !== 0 ? 'bg-orange-100' : 'bg-white');
  
  // Column Banding: Vertical stripes for data grouping
  // Using semi-transparent colors to let the row banding show through (plaid effect)
  const shiftColClass = 'bg-blue-50/50'; 
  const moneyColClass = 'bg-emerald-50/50';

  return (
    <tr className={`group hover:bg-yellow-200 relative ${rowBgClass} transition-colors duration-75`}>
      <td className="border-r-2 border-b border-black p-0 h-8 bg-gray-100 font-bold text-center text-sm w-10">{entry.id + 1}</td>
      <td className="border-r-2 border-b border-black p-0 h-8 bg-gray-100 font-bold text-center text-sm w-16">{entry.day}</td>
      
      {/* DATE COLUMN */}
      <td className="border-r-2 border-b border-black p-0 h-8 w-32 relative">
        {isTextMode ? (
          <input
            type="text"
            className={inputClass}
            value={entry.date}
            onChange={handleChange('date')}
            placeholder="MM/DD/YYYY"
            maxLength={10}
          />
        ) : (
          <select 
            className={entry.date ? inputClass : inputClass.replace('text-gray-800', 'text-transparent')} 
            value={entry.date} 
            onChange={handleChange('date')}
          >
            <option value="" className="text-gray-800">Delete</option>
            {dateOptions.map((d) => (
              <option key={d} value={d} className="text-gray-800">{d}</option>
            ))}
          </select>
        )}

        {/* Name Warning Overlay - Blocks interaction if name is empty */}
        {(!name || !name.trim()) && (
           <div
             className="absolute inset-0 z-20 cursor-pointer"
             onClick={(e) => {
               e.stopPropagation();
               setShowNameWarning(true);
             }}
           ></div>
        )}

        {/* Name Warning Popup */}
        {showNameWarning && (
           <div
            onClick={() => setShowNameWarning(false)}
            className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border-4 border-black shadow-xl p-3 text-left origin-top-left animate-in fade-in zoom-in-95 duration-200"
           >
             <div className="absolute -top-[10px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black"></div>
             <div className="absolute -top-[4px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
             <h4 className="text-red-600 font-bold font-[Arial] uppercase text-xs mb-1 tracking-wider">Name Required!</h4>
             <p className="text-xs font-[Arial] mb-0 leading-snug text-gray-800 font-medium">Fill out Name before entering date information.</p>
           </div>
        )}

        {/* Validation Error Tooltip */}
        {isErrorTarget && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border-4 border-black shadow-xl p-3 text-left origin-top-left animate-in fade-in zoom-in-95 duration-200">
             <div className="absolute -top-[10px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black"></div>
             <div className="absolute -top-[4px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
             
             <h4 className="text-red-600 font-bold font-[Arial] uppercase text-xs mb-1 tracking-wider">Date Mismatch!</h4>
             <p className="text-xs font-[Arial] mb-3 leading-snug text-gray-800 font-medium">{validationError!.message}</p>
             <div className="flex gap-2">
               <button 
                  onClick={handleFixPreviousMonday}
                  className="flex-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-1 py-1 border-2 border-black hover:bg-blue-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
               >
                  Previous Monday
               </button>
               <button 
                  onClick={onDismissError}
                  className="flex-1 bg-red-600 text-white text-[10px] font-bold px-1 py-1 border-2 border-black hover:bg-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
               >
                  OK, I'LL FIX IT
               </button>
             </div>
          </div>
        )}

        {/* Auto-Correct Notification Tooltip */}
        {isAutoCorrectTarget && (
           <div 
             className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border-4 border-blue-600 shadow-xl p-3 text-left origin-top-left animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
             onClick={onDismissAutoCorrect}
           >
              <div className="absolute -top-[10px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-blue-600"></div>
              <div className="absolute -top-[4px] left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
              
              <h4 className="text-blue-600 font-bold font-[Arial] uppercase text-xs mb-1 tracking-wider">Auto-Corrected!</h4>
              <p className="text-xs font-[Arial] mb-0 leading-snug text-gray-800 font-medium">{autoCorrectWarning!.message}</p>
           </div>
        )}
      </td>
      
      {/* IN 1 Column with Date Check (Banded) */}
      <td className={`border-r-2 border-b border-black p-0 h-8 w-28 relative ${shiftColClass}`}>
        {isTextMode ? (
           <input type="text" className={inputClass} value={entry.in1} onChange={handleChange('in1')} />
        ) : (
          <select
            className={inputClass}
            value={entry.in1}
            onChange={handleChange('in1')}
          >
            <option value="">{entry.in1 ? "Delete" : ""}</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {/* Overlay for Missing Date */}
        {!entry.date && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowDateWarning(true);
            }}
          ></div>
        )}

        {/* Date Warning Popup */}
        {showDateWarning && (
          <div 
            onClick={() => setShowDateWarning(false)}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 bg-white border-4 border-black shadow-xl p-3 text-left origin-bottom animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
          >
             <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black"></div>
             <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white"></div>
             <h4 className="text-red-600 font-bold font-[Arial] uppercase text-xs mb-1 tracking-wider">Date Required!</h4>
             <p className="text-xs font-[Arial] mb-0 leading-snug text-gray-800 font-medium">
               Please fill out date first.
             </p>
          </div>
        )}
      </td>

      {/* OUT 1 Column */}
      <td className={`border-r-2 border-b border-black p-0 h-8 w-28 ${shiftColClass}`}>
        {isTextMode ? (
           <input type="text" className={`${inputClass} ${!entry.in1 ? disabledClass : ''}`} value={entry.out1} onChange={handleChange('out1')} disabled={!entry.in1} />
        ) : (
          <select
            className={`${inputClass} ${!entry.in1 ? disabledClass : ''}`}
            value={entry.out1}
            onChange={handleChange('out1')}
            disabled={!entry.in1}
          >
            <option value="">{entry.out1 ? "Delete" : ""}</option>
            {getFilteredOptions(entry.in1).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </td>

      {/* BREAK Column (Gray) */}
      <td className="border-r-2 border-b border-black p-0 h-8 w-20 bg-gray-100">
        <input type="text" className={inputClass} value={entry.break} readOnly />
      </td>

      {/* IN 2 Column (Banded) */}
      <td className={`border-r-2 border-b border-black p-0 h-8 w-28 ${shiftColClass}`}>
        {isTextMode ? (
           <input type="text" className={`${inputClass} ${!entry.out1 ? disabledClass : ''}`} value={entry.in2} onChange={handleChange('in2')} disabled={!entry.out1} />
        ) : (
          <select
            className={`${inputClass} ${!entry.out1 ? disabledClass : ''}`}
            value={entry.in2}
            onChange={handleChange('in2')}
            disabled={!entry.out1}
          >
            <option value="">{entry.in2 ? "Delete" : ""}</option>
            {getFilteredOptions(entry.out1).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </td>
      
      {/* Out 2 Column with Warning */}
      <td className={`border-r-2 border-b border-black p-0 h-8 w-28 relative ${shiftColClass}`}>
        {isTextMode ? (
           <input type="text" className={`${inputClass} ${!entry.in2 ? disabledClass : ''}`} value={entry.out2} onChange={handleChange('out2')} disabled={!entry.in2} />
        ) : (
          <select
            className={`${inputClass} ${!entry.in2 ? disabledClass : ''}`}
            value={entry.out2}
            onChange={handleChange('out2')}
            disabled={!entry.in2}
          >
            <option value="">{entry.out2 ? "Delete" : ""}</option>
            {getFilteredOptions(entry.in2).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        
        {!entry.out1 && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowSkipWarning(true);
            }}
          ></div>
        )}

        {/* Warning Popup */}
        {showSkipWarning && (
          <div 
            onClick={() => setShowSkipWarning(false)}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 bg-white border-4 border-black shadow-xl p-3 text-left origin-bottom animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
          >
             <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black"></div>
             <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white"></div>
             <h4 className="text-red-600 font-bold font-[Arial] uppercase text-xs mb-1 tracking-wider">Hold on!</h4>
             <p className="text-xs font-[Arial] mb-0 leading-snug text-gray-800 font-medium">
               Please fill out your final clock out time on Out - 1 if you haven't taken a break.
             </p>
          </div>
        )}
      </td>
      
      {/* Hours (Yellow) */}
      <td className="border-r-2 border-b border-black p-0 h-8 w-20 bg-amber-100">
        <input type="text" className={inputClass} value={entry.hours} readOnly />
      </td>
      
      {/* OT Hours (Yellow) */}
      <td className="border-r-2 border-b border-black p-0 h-8 w-20 bg-amber-100">
        <input type="text" className={inputClass} value={entry.otHours} readOnly />
      </td>

      {/* Spacer (Stone) */}
      <td className="border-r-2 border-b border-black h-8 w-4 bg-stone-200"></td>

      {/* Sales (Banded) */}
      <td className={`border-r-2 border-b border-black p-0 h-8 w-24 ${moneyColClass}`}>
        <input 
          type="text" 
          inputMode="decimal"
          className={inputClass} 
          value={entry.sales} 
          onChange={handleChange('sales')} 
          onBlur={handleBlur('sales')}
        />
      </td>
      
      {/* Tips */}
      <td className={`border-b border-black p-0 h-8 w-24 ${moneyColClass}`}>
        <input 
          type="text" 
          inputMode="decimal"
          className={inputClass} 
          value={entry.tips} 
          onChange={handleChange('tips')} 
          onBlur={handleBlur('tips')}
        />
      </td>
    </tr>
  );
};