'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

export function FilterCombobox({ value, onChange, options, placeholder = 'Lọc…' }: FilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(value.toLowerCase()) ||
      opt.value.toLowerCase().includes(value.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative group/filter w-full">
      <Filter className="w-2.5 h-2.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] group-focus-within/filter:text-[var(--navy)] transition-colors z-10" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full h-8 pl-7 pr-12 py-1.5 bg-[var(--surface)] border border-[var(--line-soft)] rounded-lg text-[11px] text-[var(--ink)] outline-none focus:border-[var(--navy)]/40 transition-all placeholder:text-[var(--mute)]"
      />

      <div className="absolute right-0 top-0 h-full flex items-center pr-1.5 gap-1">
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="w-5 h-5 flex items-center justify-center rounded-md text-[var(--mute)] hover:bg-rose-50 hover:text-[var(--rose)] transition-colors"
            title="Xóa lọc"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-5 h-5 flex items-center justify-center rounded-md text-[var(--mute)] hover:text-[var(--navy)] transition-colors"
        >
          <ChevronDown className={cn('w-2.5 h-2.5 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence>
        {open && (filteredOptions.length > 0 || value) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] left-0 right-0 top-[calc(100%+4px)] bg-[var(--surface)] border border-[var(--line-strong)] rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-[11.5px] transition-colors flex items-center justify-between',
                      value === opt.value
                        ? 'bg-[var(--navy)] text-white font-bold'
                        : 'text-[var(--ink-soft)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]',
                    )}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-[11px] text-[var(--mute)]">Không tìm thấy kết quả</p>
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setOpen(false);
                    }}
                    className="text-[10px] font-bold text-[var(--navy)] mt-2 hover:underline"
                  >
                    Xóa lọc
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
