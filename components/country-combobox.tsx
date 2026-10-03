"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { countries } from "@/lib/lifespan";
import { countryName } from "@/lib/format";

type Option = { code: string; name: string };

const options: Option[] = countries
  .map((c) => ({ code: c.code, name: countryName(c.code) }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

export function CountryCombobox({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const selected = options.find((o) => o.code === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(option) => option && onChange(option.code)}
      itemToStringLabel={(o) => o.name}
      itemToStringValue={(o) => o.code}
      autoHighlight
    >
      <ComboboxInput id={id} placeholder="Search for a country…" triggerLabel="Show all countries" className="h-9 w-full bg-card px-2 *:text-sm" />
      <ComboboxContent>
        <ComboboxEmpty>No country found.</ComboboxEmpty>
        <ComboboxList>
          {(o: Option) => (
            <ComboboxItem key={o.code} value={o}>
              {o.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
