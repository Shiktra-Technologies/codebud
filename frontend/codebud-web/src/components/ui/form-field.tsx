"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * FormField — §6 error state + §D20b accessibility.
 *
 * §6: an invalid control shows a signal-500 border and the message BELOW it in
 * body-sm — never a bare red outline. Error text uses --signal-400 (§D20a), not
 * signal-500, which fails contrast as text on carbon-elevated (dialogs) and
 * carbon-input (wells).
 *
 * §D20b: aria-invalid alone fails axe. The message carries an id, the control
 * gets aria-describedby pointing at it, and the message region is role="alert"
 * so it announces on appearance. Wiring is injected into the child control via
 * cloneElement so callers just nest their <Input>/<Textarea>/<Select>.
 *
 * Vertical space for the message is NOT reserved (§D20b) — it would waste the
 * form's rhythm. The reveal grows downward, so it never displaces a control
 * above it.
 */

export interface FormFieldProps {
    label: React.ReactNode;
    /** The field's error message, if any. Presence flips the field into the error state. */
    error?: React.ReactNode;
    /** Optional non-error helper text (field hint). Hidden while an error shows. */
    hint?: React.ReactNode;
    htmlFor?: string;
    /** A single control element (Input/Textarea/Select trigger). */
    children: React.ReactElement;
    className?: string;
}

export function FormField({ label, error, hint, htmlFor, children, className }: FormFieldProps) {
    const reactId = React.useId();
    const id = htmlFor ?? `${reactId}-control`;
    const errorId = `${reactId}-error`;
    const hintId = `${reactId}-hint`;
    const invalid = error != null && error !== false;

    const describedBy = [invalid ? errorId : hint ? hintId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    const control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": invalid || undefined,
        "aria-describedby": describedBy,
    });

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={id} className="text-label text-carbon-secondary">
                {label}
            </label>
            {control}
            {invalid ? (
                <p id={errorId} role="alert" className="text-body-sm text-signal-400">
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className="text-body-sm text-carbon-secondary">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
