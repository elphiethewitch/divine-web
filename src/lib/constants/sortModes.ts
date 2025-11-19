// ABOUTME: Centralized sort mode configurations for NIP-50 search
// ABOUTME: Provides consistent sort options across feed pages

import { Flame, TrendingUp, Zap, Scale, Clock, Search } from 'lucide-react';
import type { SortMode } from '@/types/nostr';
import type { LucideIcon } from 'lucide-react';

export interface SortModeConfig {
  value: SortMode | undefined;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface SearchSortModeConfig {
  value: SortMode | 'relevance';
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Standard sort modes for video feeds (hot, top, rising, controversial)
 * Used in: TrendingPage, HashtagPage
 */
export const STANDARD_SORT_MODES: SortModeConfig[] = [
  {
    value: 'hot',
    label: 'Hot',
    description: 'Recent + high engagement',
    icon: Flame
  },
  {
    value: 'top',
    label: 'Top',
    description: 'Most popular all-time',
    icon: TrendingUp
  },
  {
    value: 'rising',
    label: 'Rising',
    description: 'Gaining traction',
    icon: Zap
  },
  {
    value: 'controversial',
    label: 'Controversial',
    description: 'Mixed reactions',
    icon: Scale
  },
];

/**
 * Sort modes for home feed (includes "Recent" chronological option)
 * Used in: HomePage
 */
export const HOME_SORT_MODES: SortModeConfig[] = [
  {
    value: 'hot',
    label: 'Hot',
    description: 'Recent + high engagement',
    icon: Flame
  },
  {
    value: 'top',
    label: 'Top',
    description: 'Most popular',
    icon: TrendingUp
  },
  {
    value: 'rising',
    label: 'Rising',
    description: 'Gaining traction',
    icon: Zap
  },
  {
    value: undefined,
    label: 'Recent',
    description: 'Latest videos',
    icon: Clock
  },
];

/**
 * Sort modes for search (includes "Relevance" option)
 * Used in: SearchPage
 */
export const SEARCH_SORT_MODES: SearchSortModeConfig[] = [
  {
    value: 'relevance',
    label: 'Relevance',
    description: 'Best matches',
    icon: Search
  },
  {
    value: 'hot',
    label: 'Hot',
    description: 'Recent + high engagement',
    icon: Flame
  },
  {
    value: 'top',
    label: 'Top',
    description: 'Most popular all-time',
    icon: TrendingUp
  },
  {
    value: 'rising',
    label: 'Rising',
    description: 'Gaining traction',
    icon: Zap
  },
  {
    value: 'controversial',
    label: 'Controversial',
    description: 'Mixed reactions',
    icon: Scale
  },
];

/**
 * Compact sort modes without descriptions (for space-constrained UIs)
 * Used in: HashtagPage (select dropdown)
 */
export const COMPACT_SORT_MODES = STANDARD_SORT_MODES.map(mode => ({
  value: mode.value,
  label: mode.label,
  icon: mode.icon,
}));
