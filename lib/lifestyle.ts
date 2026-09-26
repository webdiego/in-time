/*
 * Lifestyle factors as hazard ratios (HR) relative to the *average* person,
 * because the country figures already include smokers, sedentary people and so
 * on. Each factor lists the HR of every option against the study's reference
 * group plus a rough population mix; dividing by the mix-weighted mean turns
 * them into "compared with the average". Unanswered factors count as average.
 *
 * Combining factors by multiplication overstates things a bit (smoking,
 * inactivity and weight are correlated), so the total is clamped.
 */

export type FactorId = "smoking" | "activity" | "alcohol" | "diet" | "social" | "sleep" | "bmi";

type Option = { id: string; label: string; hint?: string; hr: number; share: number };

type Factor = {
  id: FactorId;
  title: string;
  question: string;
  source: string;
  options: Option[];
  /** Filled from a number the user types (BMI, sleep hours) rather than asked as a multiple choice. */
  derived?: true;
};

export const factors: Factor[] = [
  {
    id: "smoking",
    title: "Smoking",
    question: "Do you smoke?",
    source: "Jha et al., NEJM 2013; Doll et al., BMJ 2004",
    options: [
      { id: "never", label: "Never smoked", hr: 1, share: 0.55 },
      { id: "quit-long", label: "Former smoker", hint: "quit more than 10 years ago", hr: 1.1, share: 0.13 },
      { id: "quit-recent", label: "Former smoker", hint: "quit less than 10 years ago", hr: 1.6, share: 0.07 },
      { id: "current", label: "Yes, I smoke", hr: 2.8, share: 0.25 },
    ],
  },
  {
    id: "activity",
    title: "Physical activity",
    question: "How much do you exercise?",
    source: "Arem et al., JAMA Internal Medicine 2015",
    options: [
      { id: "none", label: "Almost never", hint: "sedentary", hr: 1, share: 0.3 },
      { id: "some", label: "A little", hint: "less than 150 min a week", hr: 0.8, share: 0.25 },
      { id: "guidelines", label: "Regularly", hint: "150–300 min a week", hr: 0.69, share: 0.25 },
      { id: "high", label: "A lot", hint: "more than 300 min a week", hr: 0.63, share: 0.2 },
    ],
  },
  {
    id: "alcohol",
    title: "Alcohol",
    question: "How much alcohol do you drink?",
    // Wood et al. studied current drinkers; 100 g of alcohol ≈ 7 standard (14 g) drinks.
    source: "Wood et al., The Lancet 2018",
    options: [
      { id: "low", label: "None or little", hint: "up to 7 drinks a week", hr: 1, share: 0.65 },
      { id: "moderate", label: "Moderate", hint: "7–14 drinks a week", hr: 1.07, share: 0.18 },
      { id: "heavy", label: "Heavy", hint: "14–25 drinks a week", hr: 1.19, share: 0.11 },
      { id: "very-heavy", label: "Very heavy", hint: "more than 25 drinks a week", hr: 1.37, share: 0.06 },
    ],
  },
  {
    id: "diet",
    title: "Fruit & vegetables",
    question: "Portions of fruit and vegetables a day?",
    // A portion is about 80 g; the meta-analysis reports ~10% lower risk per 200 g/day.
    source: "Aune et al., International Journal of Epidemiology 2017",
    options: [
      { id: "0-1", label: "0–1 portions", hr: 1, share: 0.3 },
      { id: "2-4", label: "2–4 portions", hr: 0.88, share: 0.5 },
      { id: "5+", label: "5 or more", hr: 0.8, share: 0.2 },
    ],
  },
  {
    id: "social",
    title: "Social connection",
    question: "How connected do you feel to other people?",
    source: "Holt-Lunstad et al., Perspectives on Psychological Science 2015",
    options: [
      { id: "connected", label: "Well connected", hr: 1, share: 0.6 },
      { id: "sometimes", label: "Sometimes lonely", hr: 1.13, share: 0.25 },
      { id: "isolated", label: "Often lonely or isolated", hr: 1.27, share: 0.15 },
    ],
  },
  {
    id: "sleep",
    title: "Sleep",
    question: "Hours of sleep a night",
    source: "Cappuccio et al., Sleep 2010",
    derived: true,
    options: [
      { id: "<6", label: "Short sleep", hint: "under 6 hours", hr: 1.12, share: 0.12 },
      { id: "6-7", label: "A bit short", hint: "6–7 hours", hr: 1.06, share: 0.25 },
      { id: "7-9", label: "Recommended", hint: "7–9 hours", hr: 1, share: 0.55 },
      { id: "9+", label: "Long sleep", hint: "over 9 hours", hr: 1.3, share: 0.08 },
    ],
  },
  {
    id: "bmi",
    title: "Weight",
    question: "Your body mass index",
    source: "Global BMI Mortality Collaboration, The Lancet 2016",
    derived: true,
    options: [
      { id: "<18.5", label: "Underweight", hr: 1.51, share: 0.02 },
      { id: "18.5-20", label: "Low-normal weight", hr: 1.13, share: 0.06 },
      { id: "20-25", label: "Normal weight", hr: 1, share: 0.38 },
      { id: "25-27.5", label: "Slightly overweight", hr: 1.07, share: 0.2 },
      { id: "27.5-30", label: "Overweight", hr: 1.2, share: 0.14 },
      { id: "30-35", label: "Obesity I", hr: 1.45, share: 0.13 },
      { id: "35-40", label: "Obesity II", hr: 1.94, share: 0.05 },
      { id: "40+", label: "Obesity III", hr: 2.76, share: 0.02 },
    ],
  },
];

export type Lifestyle = Partial<Record<FactorId, string>>;

function relativeHr(factor: Factor, optionId: string | undefined): number {
  const option = factor.options.find((o) => o.id === optionId);
  if (!option) return 1;
  const mean = factor.options.reduce((sum, o) => sum + o.hr * o.share, 0);
  return option.hr / mean;
}

export function factorHr(id: FactorId, lifestyle: Lifestyle): number {
  return relativeHr(factors.find((f) => f.id === id)!, lifestyle[id]);
}

export function combinedHr(lifestyle: Lifestyle): number {
  const hr = factors.reduce((product, f) => product * relativeHr(f, lifestyle[f.id]), 1);
  return Math.min(4, Math.max(0.4, hr));
}

export function bmiFrom(heightCm: number, weightKg: number): number | null {
  if (!(heightCm >= 100 && heightCm <= 250 && weightKg >= 25 && weightKg <= 350)) return null;
  return weightKg / (heightCm / 100) ** 2;
}

export function bmiBand(bmi: number): string {
  if (bmi < 18.5) return "<18.5";
  if (bmi < 20) return "18.5-20";
  if (bmi < 25) return "20-25";
  if (bmi < 27.5) return "25-27.5";
  if (bmi < 30) return "27.5-30";
  if (bmi < 35) return "30-35";
  if (bmi < 40) return "35-40";
  return "40+";
}

export function sleepBand(hours: number): string {
  if (hours < 6) return "<6";
  if (hours < 7) return "6-7";
  if (hours <= 9) return "7-9";
  return "9+";
}

export function optionLabel(id: FactorId, optionId: string | undefined): string | undefined {
  const option = factors.find((f) => f.id === id)?.options.find((o) => o.id === optionId);
  return option && (option.hint ? `${option.label} (${option.hint})` : option.label);
}
