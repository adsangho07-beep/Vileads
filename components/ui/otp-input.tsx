'use client';

import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, value, onChange, disabled = false }: OTPInputProps) {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!val) {
      e.preventDefault();
      return;
    }

    const valChar = val.substring(val.length - 1);
    
    // update the value
    const newValue = value.split('');
    newValue[index] = valChar;
    const finalValue = newValue.join('');
    onChange(finalValue);

    // move focus to next
    if (index < length - 1) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));
      if (index > 0) {
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < length - 1) {
        setActiveInput(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOnPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim().substring(0, length);
    if (pastedData) {
      onChange(pastedData.padEnd(length, ' ').substring(0, length).replace(/ /g, ''));
      const nextIndex = Math.min(pastedData.length, length - 1);
      setActiveInput(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center items-center">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleOnChange(e, index)}
          onKeyDown={(e) => handleOnKeyDown(e, index)}
          onFocus={() => setActiveInput(index)}
          onPaste={handleOnPaste}
          disabled={disabled}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 text-center text-xl font-bold bg-white border rounded-xl transition-all outline-none",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            disabled ? "opacity-50 cursor-not-allowed" : "",
            value[index] ? "border-brand-300" : "border-slate-200"
          )}
        />
      ))}
    </div>
  );
}
