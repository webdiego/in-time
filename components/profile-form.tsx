"use client";

import { useId, useState, type FormEvent } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BirthDatePicker } from "@/components/birth-date-picker";
import { CountryCombobox } from "@/components/country-combobox";
import { findCountry, type Sex } from "@/lib/lifespan";
import { bmiBand, bmiFrom, factors, optionLabel, type FactorId, type Lifestyle } from "@/lib/lifestyle";
import { saveProfile, type Profile } from "@/lib/profile";

// Must not collide with any option id in lib/lifestyle.ts.
const NO_ANSWER = "__skip";

function guessCountry(): string {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const region = lang.split("-")[1]?.toUpperCase();
    if (region && findCountry(region)) return region;
  }
  return "US";
}

export function ProfileForm({ now, initial, onDone }: { now: number; initial?: Profile | null; onDone?: () => void }) {
  const ids = useId();
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [country, setCountry] = useState(() => initial?.country ?? guessCountry());
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "male");
  const [smoking, setSmoking] = useState(initial?.lifestyle.smoking ?? NO_ANSWER);
  const [activity, setActivity] = useState(initial?.lifestyle.activity ?? NO_ANSWER);
  const [height, setHeight] = useState(initial?.heightCm?.toString() ?? "");
  const [weight, setWeight] = useState(initial?.weightKg?.toString() ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const today = new Date(now);

  const bmi = bmiFrom(Number(height), Number(weight));
  const answered = [smoking !== NO_ANSWER, activity !== NO_ANSWER, bmi !== null].filter(Boolean).length;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!birthDate) {
      setShowErrors(true);
      document.getElementById(`${ids}-birth`)?.focus();
      return;
    }
    const lifestyle: Lifestyle = {};
    if (smoking !== NO_ANSWER) lifestyle.smoking = smoking;
    if (activity !== NO_ANSWER) lifestyle.activity = activity;
    if (bmi !== null) lifestyle.bmi = bmiBand(bmi);
    saveProfile({
      birthDate,
      country,
      sex,
      lifestyle,
      heightCm: bmi !== null ? Number(height) : undefined,
      weightKg: bmi !== null ? Number(weight) : undefined,
    });
    onDone?.();
  }

  return (
    <section className="hud-frame mx-auto w-full max-w-md" aria-labelledby="profile-heading">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3 sm:px-8">
        <h2
          id="profile-heading"
          className="font-mono text-xs tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
        >
          {initial ? "Edit profile" : "Calibrate clock"}
        </h2>
        <span
          className="font-mono text-xs tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
          aria-hidden
        >
          {birthDate ? <span className="text-glow">Ready</span> : "Awaiting input"}
        </span>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-7 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-birth`} className="label gap-0">
            <span className="step-index mr-2">01</span>Date of birth
          </Label>
          <BirthDatePicker
            id={`${ids}-birth`}
            value={birthDate}
            onChange={setBirthDate}
            today={today}
            invalid={showErrors && !birthDate}
            describedBy={showErrors && !birthDate ? `${ids}-birth-error` : undefined}
          />
          {showErrors && !birthDate && (
            <p id={`${ids}-birth-error`} className="text-sm text-destructive" role="alert">
              Pick your date of birth.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-country`} className="label gap-0">
            <span className="step-index mr-2">02</span>Where you live
          </Label>
          <CountryCombobox id={`${ids}-country`} value={country} onChange={setCountry} />
        </div>

        <ChoiceGroup
          step="03"
          legend="Biological sex"
          value={sex}
          onChange={(v) => setSex(v as Sex)}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
          columns={2}
        />

        <Accordion defaultValue={answered > 0 ? ["lifestyle"] : []}>
          <AccordionItem value="lifestyle" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-base hover:no-underline">
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="step-index text-sm">04</span> Lifestyle
                  {answered > 0 && <span className="text-glow">· {answered}/3</span>}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  Optional. Makes the estimate personal instead of average.
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex h-auto flex-col gap-7 pt-2 pb-5">
              <LifestyleQuestion id="smoking" value={smoking} onChange={setSmoking} />
              <LifestyleQuestion id="activity" value={activity} onChange={setActivity} />

              <fieldset className="flex flex-col gap-3">
                <legend className="label mb-3">Weight</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${ids}-height`} className="text-muted-foreground">
                      Height (cm)
                    </Label>
                    <Input
                      id={`${ids}-height`}
                      type="number"
                      inputMode="numeric"
                      min={100}
                      max={250}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="h-11 bg-card px-3 text-base md:text-base"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${ids}-weight`} className="text-muted-foreground">
                      Weight (kg)
                    </Label>
                    <Input
                      id={`${ids}-weight`}
                      type="number"
                      inputMode="decimal"
                      min={25}
                      max={350}
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="h-11 bg-card px-3 text-base md:text-base"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {bmi !== null
                    ? `BMI ${bmi.toFixed(1)} · ${optionLabel("bmi", bmiBand(bmi))}`
                    : "Leave it blank to skip it."}
                </p>
              </fieldset>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" className="cta mt-2 h-12 rounded-full">
          {initial ? "Update my time" : "Show me my time"}
        </Button>
        {initial && onDone && (
          <Button type="button" variant="ghost" onClick={onDone} className="text-muted-foreground">
            Cancel
          </Button>
        )}
      </form>
    </section>
  );
}

function LifestyleQuestion({ id, value, onChange }: { id: FactorId; value: string; onChange: (v: string) => void }) {
  const factor = factors.find((f) => f.id === id)!;
  return (
    <ChoiceGroup
      legend={factor.question}
      value={value}
      onChange={onChange}
      options={[
        ...factor.options.map((o) => ({ value: o.id, label: o.label, hint: o.hint })),
        { value: NO_ANSWER, label: "Prefer not to say" },
      ]}
    />
  );
}

function ChoiceGroup({
  step,
  legend,
  value,
  onChange,
  options,
  columns = 1,
}: {
  step?: string;
  legend: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint?: string }[];
  columns?: 1 | 2;
}) {
  const ids = useId();
  return (
    <fieldset className="flex flex-col">
      <legend id={`${ids}-legend`} className="label mb-3">
        {step && <span className="step-index mr-2">{step}</span>}
        {legend}
      </legend>
      <RadioGroup
        aria-labelledby={`${ids}-legend`}
        value={value}
        onValueChange={(v) => onChange(v as string)}
        className={columns === 2 ? "grid-cols-2 gap-3" : "gap-2"}>
        {options.map((o) => (
          <label key={o.value} className="choice">
            <RadioGroupItem value={o.value} />
            <span className="flex flex-col">
              <span>{o.label}</span>
              {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
