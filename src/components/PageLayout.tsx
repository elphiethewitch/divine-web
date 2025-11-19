// ABOUTME: Reusable page layout component with consistent container and max-width
// ABOUTME: Reduces duplicate layout code across feed and content pages

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type MaxWidth = '2xl' | '4xl' | '6xl' | '7xl' | 'full';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
  /** Custom max-width for the inner content container */
  contentMaxWidth?: MaxWidth;
  /** Skip the inner max-width wrapper entirely */
  noContentWrapper?: boolean;
}

const maxWidthClasses: Record<MaxWidth, string> = {
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': 'max-w-full',
};

/**
 * Standard page layout with container and configurable max-width
 * 
 * @example
 * // Standard feed page (max-w-2xl)
 * <PageLayout>
 *   <h1>Page Title</h1>
 *   <VideoFeed />
 * </PageLayout>
 * 
 * @example
 * // Wider layout for hashtag explorer
 * <PageLayout maxWidth="6xl">
 *   <HashtagExplorer />
 * </PageLayout>
 * 
 * @example
 * // Dynamic max-width based on condition
 * <PageLayout maxWidth={showGrid ? '6xl' : '2xl'}>
 *   <Content />
 * </PageLayout>
 */
export function PageLayout({
  children,
  maxWidth = '2xl',
  className,
  contentMaxWidth,
  noContentWrapper = false,
}: PageLayoutProps) {
  const maxWidthClass = maxWidthClasses[maxWidth];
  const contentMaxWidthClass = contentMaxWidth ? maxWidthClasses[contentMaxWidth] : maxWidthClass;

  return (
    <div className={cn('container mx-auto px-4 py-6', className)}>
      {noContentWrapper ? (
        children
      ) : (
        <div className={cn(contentMaxWidthClass, 'mx-auto')}>
          {children}
        </div>
      )}
    </div>
  );
}
