/**
 * Shared signal + scam-stage metadata.
 *
 * Single source of truth for how a detected rule signal is presented across
 * the evidence map, signal cards, ScamDNA, autopsy, and safety actions.
 *
 * Wording stays cautious: "appears to", "may", "commonly associated with".
 * Nothing here claims certainty about the sender's identity or intent.
 */

export const SIGNAL_META = {
  'otp-request': {
    label: 'OTP / credential request',
    short: 'Credential theft',
    severity: 'critical',
    weight: 30,
    accent: 'cyan',
    stage: 'datatheft',
    why: 'Banks and companies never ask for an OTP, PIN, CVV, or password. A request for these is a direct path to account takeover.',
    autopsy: 'The message appears to request authentication details. If shared, these may be used to access an account before the recipient realises what happened.',
    action: 'Never share OTP, PIN, CVV, or passwords. End the conversation and contact the organisation using its official number.'
  },
  'upfront-payment': {
    label: 'Upfront payment demand',
    short: 'Payment trap',
    severity: 'high',
    weight: 25,
    accent: 'amber',
    stage: 'paymenttrap',
    why: 'Legitimate internships, jobs, scholarships, and refunds do not require a fee to release money or confirm a role. Upfront fees are a common loss point.',
    autopsy: 'The message appears to ask for money before delivering a promised benefit. This resembles an advance-fee pattern, where the promised job, prize, or refund does not materialise.',
    action: 'Do not pay registration fees, deposits, or processing charges. Verify the opportunity on the organisation\u2019s official website first.'
  },
  'suspicious-url': {
    label: 'Suspicious link',
    short: 'Link trap',
    severity: 'high',
    weight: 20,
    accent: 'violet',
    stage: 'linktrap',
    why: 'Shortened, non-HTTPS, lookalike, or brand-like domains can lead to credential-harvesting pages. The link itself is the attack surface.',
    autopsy: 'The message appears to route the recipient to a link that may imitate an official service. The page may ask for credentials or payment on a domain the organisation does not control.',
    action: 'Do not open the link. Navigate to the official website by typing the address yourself.'
  },
  'impersonation': {
    label: 'Authority impersonation',
    short: 'Fake authority',
    severity: 'medium',
    weight: 15,
    accent: 'violet',
    stage: 'fakeauthority',
    why: 'Claiming to be a bank, company, government body, or courier borrows trust the recipient already has. The claim is not proof of identity.',
    autopsy: 'The message appears to borrow the authority of a known organisation. This may lower scrutiny, because the recipient already associates the name with legitimacy.',
    action: 'Verify the sender through an independent official channel before responding.'
  },
  'urgency': {
    label: 'Artificial urgency',
    short: 'Pressure',
    severity: 'medium',
    weight: 10,
    accent: 'amber',
    stage: 'urgency',
    why: 'Time pressure discourages verification. Legitimate organisations rarely require an immediate decision by message.',
    autopsy: 'The message appears to create a deadline so the recipient acts before checking. The urgency may be real, but it is also a common lever in deceptive messages.',
    action: 'Slow down. A real deadline will survive a five-minute verification call.'
  },
  'off-platform': {
    label: 'Off-platform contact',
    short: 'Off-platform',
    severity: 'medium',
    weight: 10,
    accent: 'violet',
    stage: 'offplatform',
    why: 'Moving to Telegram, WhatsApp-only, or personal email removes platform protections and makes the sender harder to trace.',
    autopsy: 'The message appears to move the conversation away from monitored channels. This may reduce accountability and make recovery harder if something goes wrong.',
    action: 'Use official company channels only. Be wary of recruiters who insist on personal messaging apps.'
  }
};

export const SIGNAL_ORDER = [
  'otp-request',
  'upfront-payment',
  'suspicious-url',
  'impersonation',
  'urgency',
  'off-platform'
];

export const ACCENTS = {
  cyan: {
    text: 'text-cyan',
    bg: 'bg-cyan/10',
    border: 'border-cyan/25',
    dot: 'bg-cyan',
    ring: 'ring-cyan/30',
    soft: 'bg-cyan/[0.06]',
    stroke: 'stroke-cyan',
    fill: 'fill-cyan'
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/30',
    soft: 'bg-amber-500/[0.06]',
    stroke: 'stroke-amber-400',
    fill: 'fill-amber-400'
  },
  violet: {
    text: 'text-violet',
    bg: 'bg-violet/10',
    border: 'border-violet/25',
    dot: 'bg-violet',
    ring: 'ring-violet/30',
    soft: 'bg-violet/[0.06]',
    stroke: 'stroke-violet',
    fill: 'fill-violet'
  },
  danger: {
    text: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/25',
    dot: 'bg-danger',
    ring: 'ring-danger/30',
    soft: 'bg-danger/[0.06]',
    stroke: 'stroke-danger',
    fill: 'fill-danger'
  },
  safe: {
    text: 'text-safe',
    bg: 'bg-safe/10',
    border: 'border-safe/25',
    dot: 'bg-safe',
    ring: 'ring-safe/30',
    soft: 'bg-safe/[0.06]',
    stroke: 'stroke-safe',
    fill: 'fill-safe'
  }
};

export function getSignalMeta(id) {
  return (
    SIGNAL_META[id] || {
      label: id || 'Unrecognised signal',
      short: 'Signal',
      severity: 'medium',
      weight: 0,
      accent: 'violet',
      stage: null,
      why: 'This pattern is commonly associated with deceptive messages.',
      action: 'Verify the sender independently before acting.'
    }
  );
}

export function getSignalAccent(id) {
  return ACCENTS[getSignalMeta(id).accent] || ACCENTS.violet;
}

export const SCAM_STAGES = [
  {
    id: 'datatheft',
    label: 'Data theft',
    short: 'Data theft',
    description: 'Asks for OTP, password, PIN, or identity details.',
    signalIds: ['otp-request'],
    accent: 'cyan'
  },
  {
    id: 'paymenttrap',
    label: 'Payment trap',
    short: 'Payment trap',
    description: 'Demands a fee, deposit, or processing charge.',
    signalIds: ['upfront-payment'],
    accent: 'amber'
  },
  {
    id: 'fakeauthority',
    label: 'Fake authority',
    short: 'Fake authority',
    description: 'Claims to be a bank, company, government body, or courier.',
    signalIds: ['impersonation'],
    accent: 'violet'
  },
  {
    id: 'urgency',
    label: 'Urgency',
    short: 'Urgency',
    description: 'Uses time pressure to prevent verification.',
    signalIds: ['urgency'],
    accent: 'amber'
  },
  {
    id: 'offplatform',
    label: 'Off-platform shift',
    short: 'Off-platform',
    description: 'Pushes contact to Telegram, WhatsApp-only, or personal email.',
    signalIds: ['off-platform'],
    accent: 'violet'
  },
  {
    id: 'linktrap',
    label: 'Link trap',
    short: 'Link trap',
    description: 'Contains a shortened, insecure, or lookalike link.',
    signalIds: ['suspicious-url'],
    accent: 'violet'
  }
];

/**
 * Returns the ScamDNA stages supported by the detected signals.
 * A stage is active only when at least one matching signal exists.
 */
export function getActiveStages(signals = []) {
  const ids = new Set(
    (Array.isArray(signals) ? signals : []).map((signal) => signal && signal.id)
  );
  return SCAM_STAGES.filter((stage) =>
    stage.signalIds.some((signalId) => ids.has(signalId))
  );
}

export function getActiveStageIds(signals = []) {
  return new Set(getActiveStages(signals).map((stage) => stage.id));
}
