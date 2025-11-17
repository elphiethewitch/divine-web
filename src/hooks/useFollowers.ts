// ABOUTME: Hook for fetching the list of users who follow a given pubkey
// ABOUTME: Returns array of follower pubkeys with real-time updates from relays

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { debugLog, debugError } from '@/lib/debug';

/**
 * Get the list of users who follow the specified pubkey
 * Returns an array of follower pubkeys
 */
export function useFollowers(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<string[]>({
    queryKey: ['followers', pubkey],

    queryFn: async (context) => {
      if (!pubkey) {
        return [];
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(15000)]);

      try {
        debugLog(`[useFollowers] ========== FETCHING FOLLOWERS ==========`);
        debugLog(`[useFollowers] Target pubkey: ${pubkey}`);

        const queryFilter = {
          kinds: [3],
          '#p': [pubkey],
          limit: 10000, // High limit to capture all followers
        };
        debugLog(`[useFollowers] Query filter:`, queryFilter);

        const contactListEvents = await nostr.query([queryFilter], { signal });

        debugLog(`[useFollowers] Received ${contactListEvents.length} kind 3 events`);

        if (contactListEvents.length === 0) {
          debugLog(`[useFollowers] ⚠️ No followers found for ${pubkey}`);
          return [];
        }

        // Extract unique follower pubkeys
        const followerPubkeys = new Set<string>();
        contactListEvents.forEach(event => {
          followerPubkeys.add(event.pubkey);
        });

        const followers = Array.from(followerPubkeys);
        debugLog(`[useFollowers] ✅ Found ${followers.length} unique followers`);

        if (followers.length > 0) {
          debugLog(`[useFollowers] Sample followers (first 5):`);
          followers.slice(0, 5).forEach((pk, i) => {
            debugLog(`[useFollowers]   ${i + 1}. ${pk}`);
          });
          if (followers.length > 5) {
            debugLog(`[useFollowers]   ... and ${followers.length - 5} more`);
          }
        }

        return followers;
      } catch (error) {
        debugError(`[useFollowers] Error fetching followers:`, error);
        return [];
      }
    },

    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
