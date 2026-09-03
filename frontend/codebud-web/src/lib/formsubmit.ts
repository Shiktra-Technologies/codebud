/*
 * FormSubmit (formsubmit.co) delivery — mail without an SMTP mailbox.
 *
 * The browser posts straight to FormSubmit, which relays the message to
 * info@mycodebud.in. There is no server hop, so this keeps working even if the
 * app is exported statically and no SMTP credentials ever exist.
 *
 * ACTIVATION: the very first submission to a new target does NOT arrive as a
 * message. FormSubmit instead emails the target a confirmation link, and only
 * delivers mail once that link is clicked. Submit the form once after deploy
 * and confirm from the info@mycodebud.in inbox.
 *
 * HIDING THE ADDRESS: posting to the bare address puts info@mycodebud.in in the
 * client bundle for scrapers to find. That activation email also contains a
 * random token that addresses the same inbox; set it as
 * NEXT_PUBLIC_FORMSUBMIT_TOKEN and the address stops being shipped. It is a
 * public identifier either way, not a secret — anyone can read it from the
 * bundle and post to it, which is why the honeypot below still matters.
 */

/** Target for the relay: the opaque token when configured, else the address. */
const TARGET = process.env.NEXT_PUBLIC_FORMSUBMIT_TOKEN || "info@mycodebud.in";

const ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(TARGET)}`;

/** Fields prefixed with `_` configure FormSubmit; the rest become the mail body. */
export type FormSubmitFields = Record<string, string>;

export type FormSubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Relay one submission. Never throws — a network failure and a rejection come
 * back the same way, so callers render one error path.
 */
export async function sendViaFormSubmit(fields: FormSubmitFields): Promise<FormSubmitResult> {
    let response: Response;

    try {
        response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                // FormSubmit's own honeypot. A non-empty `_honey` is dropped on
                // their side, so bots never reach the inbox.
                _honey: "",
                // Without this the AJAX response is a captcha page rather than JSON.
                _captcha: "false",
                _template: "table",
                ...fields,
            }),
        });
    } catch {
        return { ok: false, error: "Network error. Please try again, or email us directly." };
    }

    if (!response.ok) {
        // 403 is the usual answer for a target that was never activated.
        return {
            ok: false,
            error: "Could not send your message. Please email us directly at info@mycodebud.in.",
        };
    }

    return { ok: true };
}
