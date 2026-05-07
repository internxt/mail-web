import type { EmailDomainsResponse } from '@internxt/sdk/dist/mail/types';
import { Dropdown } from '@internxt/ui';
import { CaretDownIcon, CaretUpIcon, CheckIcon } from '@phosphor-icons/react';
import { useState } from 'react';

interface SelectMailInputProps {
  value: string;
  selectedDomain: string;
  domains: EmailDomainsResponse;
  onChangeValue: (value: string) => void;
  onChangeDomain: (domain: string) => void;
}

const SelectMailInput = ({ value, onChangeValue, selectedDomain, domains, onChangeDomain }: SelectMailInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const menuItems = domains.map(({ domain }) => (
    <button
      key={domain}
      className={`flex w-full items-center gap-1 py-1 ${domain === selectedDomain ? 'font-bold' : 'font-normal'} text-sm text-gray-100`}
      onClick={() => onChangeDomain(domain)}
    >
      <span className={'w-5 shrink-0 '}>{domain === selectedDomain && <CheckIcon size={16} weight="bold" />}</span>@
      {domain}
    </button>
  ));

  return (
    <div
      className={`relative flex h-11 w-full items-center rounded-lg border bg-surface transition-all duration-150 ${
        isFocused ? 'border-primary ring-3 ring-primary/10 dark:ring-primary/20' : 'border-gray-20 hover:border-gray-30'
      }`}
    >
      <input
        type="text"
        autoComplete="off"
        spellCheck="false"
        className="h-full min-w-0 flex-1 bg-transparent pl-3 text-lg text-gray-100 outline-none placeholder:text-gray-40"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <div className="flex flex-col z-10">
        <Dropdown
          classButton="flex items-center gap-1 px-3 text-sm font-medium text-gray-60transition-colors whitespace-nowrap"
          classMenuItems="right-0 top-1 min-w-[160px] rounded-lg shadow-subtle-hard text-gray-100"
          openDirection="right"
          menuItems={menuItems}
        >
          {({ open }) => (
            <span className="flex items-center gap-1">
              @{selectedDomain}
              {open ? <CaretUpIcon weight="fill" size={12} /> : <CaretDownIcon weight="fill" size={12} />}
            </span>
          )}
        </Dropdown>
      </div>
    </div>
  );
};

export default SelectMailInput;
