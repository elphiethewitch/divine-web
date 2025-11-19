// ABOUTME: Hook for fetching video social interaction metrics (likes, reposts, views)
// ABOUTME: Provides efficient batched queries to minimize relay requests

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

export interface VideoSocialMetrics {
  likeCount: number;
  repostCount: number;
  viewCount: number;
  commentCount: number;
}

/**
 * Fetch social interaction metrics for a video event
 * Uses batched queries to efficiently fetch likes, reposts, and views
 *
 * Note: videoPubkey is required for kind 34236 (addressable) events to build the 'a' tag reference
 */
export function useVideoSocialMetrics(videoId: string, videoPubkey?: string, vineId?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-social-metrics', videoId, videoPubkey, vineId],
    queryFn: async (context) => {
      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(3000)]);

      try {
        // Build addressable event reference for kind 34236 videos
        // Format: "34236:pubkey:d-tag-value"
        const addressableRef = videoPubkey && vineId ? `34236:${videoPubkey}:${vineId}` : null;

        // Build filter array - we need multiple queries because Nostr filters are OR within a filter, AND between filters
        const filters = [];

        // Query 1: Events that reference this video by event ID (e/E tags) - for backwards compatibility
        filters.push({
          kinds: [1, 6, 7, 1111, 9735], // comments, reposts, reactions, NIP-22 comments, zap receipts
          '#e': [videoId], // lowercase e tag
          limit: 500,
        });

        filters.push({
          kinds: [1, 6, 7, 1111, 9735],
          '#E': [videoId], // uppercase E tag (NIP-22 uses this)
          limit: 500,
        });

        // Query 2: Events that reference this video by addressable reference (a/A tags) - correct way for kind 34236
        if (addressableRef) {
          filters.push({
            kinds: [1, 6, 7, 1111, 9735],
            '#a': [addressableRef], // lowercase a tag
            limit: 500,
          });

          filters.push({
            kinds: [1, 6, 7, 1111, 9735],
            '#A': [addressableRef], // uppercase A tag (NIP-22 uses this for root)
            limit: 500,
          });
        }

        // Execute all queries
        const allEvents = await nostr.query(filters, { signal });

        // Deduplicate events by ID (same event might be returned from multiple filter queries)
        const uniqueEvents = new Map<string, typeof allEvents[0]>();
        for (const event of allEvents) {
          uniqueEvents.set(event.id, event);
        }
        const events = Array.from(uniqueEvents.values());

        let likeCount = 0;
        let repostCount = 0;
        let viewCount = 0;
        let commentCount = 0;

        // Process each event type
        for (const event of events) {
          switch (event.kind) {
            case 7: // Reaction events (likes)
              // Check if it's a positive reaction (like)
              if (event.content === '+' || event.content === '❤️' || event.content === '👍') {
                likeCount++;
              }
              break;

            case 6: // Repost events
              repostCount++;
              break;

            case 1: // Text note comments
            case 1111: // NIP-22 comments
              commentCount++;
              break;

            case 9735: // Zap receipts (using as view indicator)
              // For now, count zap receipts as views
              // In a more sophisticated implementation, we might have dedicated view events
              viewCount++;
              break;
          }
        }

        // For view count, we could also implement a custom approach
        // For now, we'll use zap receipts as a proxy, but this could be enhanced
        // with dedicated kind 34236 view events or other mechanisms

        const metrics: VideoSocialMetrics = {
          likeCount,
          repostCount,
          viewCount,
          commentCount,
        };

        return metrics;
      } catch (error) {
        console.error('Failed to fetch video social metrics:', error);
        // Return default values on error
        return {
          likeCount: 0,
          repostCount: 0,
          viewCount: 0,
          commentCount: 0,
        } as VideoSocialMetrics;
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
  });
}

/**
 * Check if the current user has liked a specific video and get the event IDs for deletion
 */
export function useVideoUserInteractions(videoId: string, userPubkey?: string, videoPubkey?: string, vineId?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-user-interactions', videoId, userPubkey, videoPubkey, vineId],
    queryFn: async (context) => {
      if (!userPubkey) {
        return { hasLiked: false, hasReposted: false, likeEventId: null, repostEventId: null };
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(2000)]);

      try {
        // Build addressable event reference for kind 34236 videos
        const addressableRef = videoPubkey && vineId ? `34236:${videoPubkey}:${vineId}` : null;

        const filters = [];

        // Query for user's interactions with this video by event ID
        filters.push({
          kinds: [6, 7], // reposts, reactions
          authors: [userPubkey],
          '#e': [videoId],
          limit: 10,
        });

        // Query for user's interactions with this video by addressable reference
        if (addressableRef) {
          filters.push({
            kinds: [6, 7],
            authors: [userPubkey],
            '#a': [addressableRef],
            limit: 10,
          });
        }

        const allEvents = await nostr.query(filters, { signal });

        // Deduplicate events by ID
        const uniqueEvents = new Map<string, typeof allEvents[0]>();
        for (const event of allEvents) {
          uniqueEvents.set(event.id, event);
        }
        const events = Array.from(uniqueEvents.values());

        let hasLiked = false;
        let hasReposted = false;
        let likeEventId: string | null = null;
        let repostEventId: string | null = null;

        // Filter out deleted events by checking for delete events (kind 5)
        const deleteEvents = await nostr.query([
          {
            kinds: [5], // Delete events (NIP-09)
            authors: [userPubkey],
            '#e': events.map(e => e.id), // Check if any of our events are deleted
            limit: 20,
          }
        ], { signal });

        const deletedEventIds = new Set();
        deleteEvents.forEach(deleteEvent => {
          deleteEvent.tags.forEach(tag => {
            if (tag[0] === 'e' && tag[1]) {
              deletedEventIds.add(tag[1]);
            }
          });
        });

        // Process events, ignoring deleted ones
        for (const event of events) {
          if (deletedEventIds.has(event.id)) continue; // Skip deleted events

          if (event.kind === 7 && (event.content === '+' || event.content === '❤️' || event.content === '👍')) {
            hasLiked = true;
            likeEventId = event.id;
          }
          if (event.kind === 6) {
            hasReposted = true;
            repostEventId = event.id;
          }
        }

        return { hasLiked, hasReposted, likeEventId, repostEventId };
      } catch (error) {
        console.error('Failed to fetch user video interactions:', error);
        return { hasLiked: false, hasReposted: false, likeEventId: null, repostEventId: null };
      }
    },
    enabled: !!userPubkey,
    staleTime: 30000, // Consider data stale after 30 seconds (faster refresh for interactive features)
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}