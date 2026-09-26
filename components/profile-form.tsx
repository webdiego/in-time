"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BirthDatePicker } from "@/components/birth-date-picker";
import { CountryCombobox } from "@/components/country-combobox";
import { findCountry, type Sex } from "@/lib/lifespan";
import { bmiBand, bmiFrom, factors, optionLabel, sleepBand, type FactorId, type Lifestyle } from "@/lib/lifestyle";
import { DEFAULT_RETIREMENT_AGE, DEFAULT_SLEEP_HOURS, weekFits } from "@/lib/time-budget";
import { saveProfile, type Profile } from "@/lib/profile";

// Must not collide with any option id in lib/lifestyle.ts.
const NO_ANSWER = "__skip";

// Asked as multiple choice; the derived ones (BMI, sleep) come from numbers typed elsewhere.
const askedFactors = factors.filter((f) => !f.derived);

/** Parses an optional numeric field: empty → undefined, out of range → NaN. */
function optionalNumber(raw: string, min: number, max: number): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return n >= min && n <= max ? n : NaN;
}

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
  const [answers, setAnswers] = useState<Partial<Record<FactorId, string>>>(() =>
    Object.fromEntries(askedFactors.map((f) => [f.id, initial?.lifestyle[f.id] ?? NO_ANSWER])),
  );
  const [height, setHeight] = useState(initial?.heightCm?.toString() ?? "");
  const [weight, setWeight] = useState(initial?.weightKg?.toString() ?? "");
  const [sleep, setSleep] = useState(initial?.sleepHours?.toString() ?? "");
  const [work, setWork] = useState(initial?.workHoursPerWeek?.toString() ?? "");
  const [retirement, setRetirement] = useState(initial?.retirementAge?.toString() ?? "");
  const [showErrors, setShowErrors] = useState(false);
  // Recreated only when the local calendar day actually changes, not on every
  // clock tick: react-day-picker treats a new Date reference here as a reason
  // to recompute its months, which was remounting the year/month pickers ~4x/s.
  const localDay = new Date(now).toDateString();
  const today = useMemo(() => new Date(localDay), [localDay]);

  const bmi = bmiFrom(Number(height), Number(weight));
  const answered =
    askedFactors.filter((f) => answers[f.id] !== NO_ANSWER).length + (bmi !== null ? 1 : 0);
  const totalQuestions = askedFactors.length + 1;

  const sleepHours = optionalNumber(sleep, 3, 14);
  const workHours = optionalNumber(work, 0, 100);
  const retirementAge = optionalNumber(retirement, 40, 90);
  const weekError =
    Number.isNaN(sleepHours)
      ? "Sleep must be between 3 and 14 hours."
      : Number.isNaN(workHours)
        ? "Work must be between 0 and 100 hours a week."
        : Number.isNaN(retirementAge)
          ? "Retirement age must be between 40 and 90."
          : !weekFits(sleepHours ?? DEFAULT_SLEEP_HOURS, workHours ?? 0)
            ? "Sleep and work add up to more hours than a week has."
            : null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!birthDate || weekError) {
      setShowErrors(true);
      document.getElementById(!birthDate ? `${ids}-birth` : `${ids}-sleep`)?.focus();
      return;
    }
    const lifestyle: Lifestyle = {};
    for (const f of askedFactors) if (answers[f.id] !== NO_ANSWER) lifestyle[f.id] = answers[f.id];
    if (bmi !== null) lifestyle.bmi = bmiBand(bmi);
    if (sleepHours !== undefined) lifestyle.sleep = sleepBand(sleepHours);
    saveProfile({
      birthDate,
      country,
      sex,
      lifestyle,
      heightCm: bmi !== null ? Number(height) : undefined,
      weightKg: bmi !== null ? Number(weight) : undefined,
      sleepHours,
      workHoursPerWeek: workHours,
      retirementAge,
    });
    onDone?.();
  }

  return (
    <section className="hud-frame mx-auto w-full max-w-3xl" aria-labelledby="profile-heading">
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
        <div className="grid gap-7 sm:grid-cols-2 sm:gap-6">
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
                  {answered > 0 && (
                    <span className="text-glow">
                      · {answered}/{totalQuestions}
                    </span>
                  )}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  Optional. Makes the estimate personal instead of average.
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex h-auto flex-col gap-7 pt-2 pb-5">
              <div className="grid gap-7 sm:grid-cols-2 sm:gap-x-6">
                {askedFactors.map((f) => (
                  <LifestyleQuestion
                    key={f.id}
                    id={f.id}
                    value={answers[f.id] ?? NO_ANSWER}
                    onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))}
                  />
                ))}
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="label mb-3">Weight</legend>
                <div className="grid max-w-sm grid-cols-2 gap-3">
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

        <fieldset className="flex flex-col gap-3" aria-describedby={`${ids}-week-hint`}>
          <legend className="label mb-3">
            <span className="step-index mr-2">05</span>Your week
          </legend>
          <p id={`${ids}-week-hint`} className="-mt-1 text-sm text-muted-foreground">
            Optional. Subtracts sleep and work to show the time that&apos;s actually yours.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              id={`${ids}-sleep`}
              label="Sleep (h/night)"
              value={sleep}
              onChange={setSleep}
              placeholder={String(DEFAULT_SLEEP_HOURS)}
              min={3}
              max={14}
              step="0.5"
              invalid={showErrors && (Number.isNaN(sleepHours) || weekError?.startsWith("Sleep and"))}
            />
            <NumberField
              id={`${ids}-work`}
              label="Work (h/week)"
              value={work}
              onChange={setWork}
              placeholder="0"
              min={0}
              max={100}
              invalid={showErrors && (Number.isNaN(workHours) || weekError?.startsWith("Sleep and"))}
            />
            <NumberField
              id={`${ids}-retire`}
              label="Retire at"
              value={retirement}
              onChange={setRetirement}
              placeholder={String(DEFAULT_RETIREMENT_AGE)}
              min={40}
              max={90}
              invalid={showErrors && Number.isNaN(retirementAge)}
            />
          </div>
          <p
            className={`text-sm ${showErrors && weekError ? "text-destructive" : "text-muted-foreground"}`}
            role={showErrors && weekError ? "alert" : undefined}
          >
            {showErrors && weekError
              ? weekError
              : sleepHours !== undefined && !Number.isNaN(sleepHours)
                ? `${optionLabel("sleep", sleepBand(sleepHours))} · also used in the estimate`
                : "Leave blank to skip. Sleep unlocks your waking time, sleep + work your free time."}
          </p>
        </fieldset>

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

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min: number;
  max: number;
  step?: string;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        className="h-11 bg-card px-3 font-mono text-base md:text-base"
      />
    </div>
  );
}

function LifestyleQuestion({ id, value, onChange }: { id: FactorId; value: string; onChange: (v: string) => void }) {
  const factor = factors.find((f) => f.id === id)!;
  return (
    <ChoiceGroup
      legend={factor.question}
      value={value}
      onChange={onChange}
      options={factor.options.map((o) => ({ value: o.id, label: o.label, hint: o.hint }))}
      skipValue={NO_ANSWER}
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
  skipValue,
  skipLabel = "Prefer not to say",
}: {
  step?: string;
  legend: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint?: string }[];
  columns?: 1 | 2;
  /** Rendered as a slim toggle spanning the full width, instead of a card matching the others. */
  skipValue?: string;
  skipLabel?: string;
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
        {skipValue && (
          <label className={`choice-compact${columns === 2 ? " col-span-2" : ""}`}>
            <RadioGroupItem value={skipValue} />
            <span>{skipLabel}</span>
          </label>
        )}
      </RadioGroup>
    </fieldset>
  );
}
