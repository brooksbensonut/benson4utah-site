/**
 * SMS consent: the single source for the text-message disclosure shown on every
 * opt-in form and recorded with every submission as consent evidence.
 * Changing TEXT requires a new VERSION so stored consent can be tied to the exact wording shown.
 */
(function (root) {
    const SMS_CONSENT = {
        VERSION: '2026-09-24.v1',
        SENDER: 'Brooks Benson 4 Utah',
        TEXT: 'By checking this box, I agree to receive recurring automated text messages from ' +
            'Brooks Benson 4 Utah at the mobile number provided, including campaign updates, ' +
            'event and volunteer invitations, get-out-the-vote reminders, and requests for donations. ' +
            'Consent is not a condition of any donation, purchase, or support. ' +
            'Message frequency varies. Message & data rates may apply. ' +
            'Reply HELP for help or STOP to opt out at any time. ' +
            'See our SMS Terms and Privacy Policy.'
    };

    const MESSAGES = {
        consentWithoutPhone: 'Enter your mobile number to get texts, or uncheck the text box.',
        invalidPhone: 'Enter a 10-digit U.S. mobile number.',
        invalidEmail: 'Please enter a valid email address.',
        sendFailed: 'Something went wrong. Please try again.'
    };

    function normalizeUsPhone(input) {
        const digits = String(input || '').replace(/\D/g, '');
        if (digits.length === 10) return '+1' + digits;
        if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
        return null;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
    }

    /**
     * @param {{email?: string, phone?: string, smsConsent: boolean, requireEmail?: boolean}} input
     * @returns {{ok: true, phone: string|null} | {ok: false, error: string}}
     */
    function validateSignup(input) {
        const requireEmail = input.requireEmail !== false;
        if (requireEmail && !isValidEmail(input.email)) {
            return { ok: false, error: MESSAGES.invalidEmail };
        }
        const rawPhone = String(input.phone || '').trim();
        if (input.smsConsent && rawPhone === '') {
            return { ok: false, error: MESSAGES.consentWithoutPhone };
        }
        if (rawPhone === '') {
            return { ok: true, phone: null };
        }
        const phone = normalizeUsPhone(rawPhone);
        if (!phone) {
            return { ok: false, error: MESSAGES.invalidPhone };
        }
        return { ok: true, phone: phone };
    }

    /**
     * Consent evidence attached to every submission; consent is never inferred from a phone number.
     * @param {{smsConsent: boolean, pageUrl: string, now: Date}} input
     */
    function buildConsentRecord(input) {
        const consented = input.smsConsent === true;
        return {
            sms_consent: consented,
            sms_consent_text: consented ? SMS_CONSENT.TEXT : null,
            sms_consent_version: consented ? SMS_CONSENT.VERSION : null,
            sms_consent_at: consented ? input.now.toISOString() : null,
            page_url: input.pageUrl
        };
    }

    const api = {
        SMS_CONSENT: SMS_CONSENT,
        MESSAGES: MESSAGES,
        normalizeUsPhone: normalizeUsPhone,
        isValidEmail: isValidEmail,
        validateSignup: validateSignup,
        buildConsentRecord: buildConsentRecord
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.SmsConsent = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
