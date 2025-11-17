// ABOUTME: Hook for fetching the list of users that a given pubkey follows
// ABOUTME: Returns array of following pubkeys with real-time updates from relays

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { debugLog, debugError } from '@/lib/debug';

/**
 * Get the list of users that the specified pubkey follows
 * Returns an array of followed pubkeys
 */
export function useFollowing(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<string[]>({
    queryKey: ['following', pubkey],

    queryFn: async (context) => {
      if (!pubkey) {
        return [];
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(10000)]);

      try {
        debugLog(`[useFollowing] ========== FETCHING FOLLOWING ==========`);
        debugLog(`[useFollowing] Target pubkey: ${pubkey}`);

        const queryFilter = {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        };
        debugLog(`[useFollowing] Query filter:`, queryFilter);

        const contactListEvents = await nostr.query([queryFilter], { signal });

        debugLog(`[useFollowing] Received ${contactListEvents.length} kind 3 events`);

        if (contactListEvents.length === 0) {
          debugLog(`[useFollowing] ⚠️ No contact list found for ${pubkey}`);
          return [];
        }

        // Get the most recent contact list event
        const contactList = contactListEvents
          .sort((a, b) => b.created_at - a.created_at)[0];

        debugLog(`[useFollowing] Contact list event ID: ${contactList.id}`);
        debugLog(`[useFollowing] Contact list created at: ${new Date(contactList.created_at * 1000).toISOString()}`);
        debugLog(`[useFollowing] Contact list has ${contactList.tags.length} total tags`);

        // Extract followed pubkeys from 'p' tags
        const pTags = contactList.tags.filter(tag => tag[0] === 'p');
        debugLog(`[useFollowing] Found ${pTags.length} 'p' tags`);

        const following = pTags
          .filter(tag => tag[1]) // Must have pubkey value
          .map(tag => tag[1]);

        debugLog(`[useFollowing] ✅ Extracted ${following.length} valid followed pubkeys`);

        if (following.length > 0) {
          debugLog(`[useFollowing] Sample following (first 5):`);
          following.slice(0, 5).forEach((pk, i) => {
            debugLog(`[useFollowing]   ${i + 1}. ${pk}`);
          });
          if (following.length > 5) {
            debugLog(`[useFollowing]   ... and ${following.length - 5} more`);
          }
        }

        return following;
      } catch (error) {
        debugError(`[useFollowing] Error fetching following list:`, error);
        return [];
      }
    },

    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
