// ABOUTME: Centralized relay configuration constants
// ABOUTME: Single source of truth for relay URLs and metadata

/**
 * Primary Divine Video relay with NIP-50 search support
 */
export const DIVINE_RELAY_URL = 'wss://relay.divine.video';

/**
 * Relay configuration object with name and URL
 */
export interface RelayConfig {
  url: string;
  name: string;
}

/**
 * Primary relay configuration for Divine Video
 */
export const DIVINE_RELAY: RelayConfig = {
  url: DIVINE_RELAY_URL,
  name: 'Divine Video',
};

/**
 * Default relay list for the application
 */
export const DEFAULT_RELAYS: string[] = [
  DIVINE_RELAY_URL,
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

/**
 * Available relay options for user selection
 */
export const RELAY_OPTIONS: RelayConfig[] = [
  DIVINE_RELAY,
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://nos.lol', name: 'nos.lol' },
  { url: 'wss://relay.nostr.band', name: 'Nostr Band' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
];

/**
 * Relays known to support NIP-50 full-text search
 */
export const NIP50_SUPPORTED_RELAYS = [
  'relay.divine.video',
  'relay.nostr.band',
  'relay.primal.net',
  'relay.nostr.wine',
  'relay.openvine.co',
  'relay2.openvine.co',
  'relay3.openvine.co',
];

/**
 * Check if a relay URL supports NIP-50 search
 */
export function supportsNIP50(relayUrl: string): boolean {
  try {
    const url = new URL(relayUrl);
    const hostname = url.hostname;
    return NIP50_SUPPORTED_RELAYS.includes(hostname);
  } catch {
    return false;
  }
}
