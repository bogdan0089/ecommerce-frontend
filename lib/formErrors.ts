"use client";

import { useState } from "react";

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function messageFor(el: Control): string {
  const v = el.validity;
  if (v.valueMissing) return "This field is required";
  if (v.typeMismatch) return el.type === "email" ? "Enter a valid email address" : "Enter a valid value";
  if (v.rangeUnderflow) return `Must be ${(el as HTMLInputElement).min} or more`;
  if (v.rangeOverflow) return `Must be ${(el as HTMLInputElement).max} or less`;
  if (v.tooShort) return `At least ${(el as HTMLInputElement).minLength} characters`;
  if (v.tooLong) return `At most ${(el as HTMLInputElement).maxLength} characters`;
  if (v.stepMismatch) return "Enter a valid amount";
  if (v.patternMismatch) return "Enter it in the expected format";
  if (v.badInput) return "Enter a valid value";
  return "Check this field";
}

function isControl(el: Element): el is Control {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

export function collectErrors(form: HTMLFormElement): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const el of Array.from(form.elements)) {
    if (!isControl(el) || !el.name || el.disabled || el.validity.valid) continue;
    errors[el.name] = messageFor(el);
  }
  return errors;
}

export function useFieldErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(onValid: (form: HTMLFormElement) => void | Promise<void>) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const found = collectErrors(form);
      setErrors(found);
      if (Object.keys(found).length > 0) {
        const first = form.querySelector<Control>(`[name="${CSS.escape(Object.keys(found)[0])}"]`);
        first?.focus();
        return;
      }
      return onValid(form);
    };
  }

  function clear(name: string) {
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  }

  return { errors, setErrors, onSubmit, clear };
}
