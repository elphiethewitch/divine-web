// ABOUTME: Dialog component for displaying followers or following lists
// ABOUTME: Shows list of users with avatars, names, and follow/unfollow buttons
// ABOUTME: Fetches fresh data from relays when opened

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, UserCheck } from 'lucide-react';
import { useFollowers } from '@/hooks/useFollowers';
import { useFollowing } from '@/hooks/useFollowing';
import { useFollowList } from '@/hooks/useFollowList';
import { useBatchedAuthors } from '@/hooks/useBatchedAuthors';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFollowRelationship } from '@/hooks/useFollowRelationship';
import { genUserName } from '@/lib/genUserName';
import { getSafeProfileImage } from '@/lib/imageUtils';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pubkey: string;
  type: 'followers' | 'following';
}

function UserListItem({ 
  pubkey, 
  currentUserPubkey 
}: { 
  pubkey: string; 
  currentUserPubkey: string | undefined;
}) {
  const navigate = useNavigate();
  const { metadata, isLoading: metadataLoading } = useBatchedAuthors([pubkey]);
  const { isFollowing, followUser, unfollowUser } = useFollowRelationship(pubkey);
  
  const userMetadata = metadata?.[pubkey];
  const displayName = userMetadata?.display_name || userMetadata?.name || genUserName(pubkey);
  const userName = userMetadata?.name || genUserName(pubkey);
  const profileImage = getSafeProfileImage(userMetadata?.picture) || `https://api.dicebear.com/7.x/identicon/svg?seed=${pubkey}`;
  const nip05 = userMetadata?.nip05;

  const isOwnProfile = currentUserPubkey === pubkey;

  const handleProfileClick = () => {
    const npub = nip19.npubEncode(pubkey);
    navigate(`/u/${npub}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
      onClick={handleProfileClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback className="text-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{displayName}</p>
          </div>
          {nip05 ? (
            <p className="text-sm text-muted-foreground truncate">{nip05}</p>
          ) : userName !== displayName ? (
            <p className="text-sm text-muted-foreground truncate">@{userName}</p>
          ) : null}
        </div>
      </div>

      {!isOwnProfile && (
        <Button
          onClick={handleFollowClick}
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          className="ml-2 flex-shrink-0"
        >
          {isFollowing ? (
            <>
              <UserCheck className="w-4 h-4 mr-1" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Follow
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

export function FollowListDialog({
  open,
  onOpenChange,
  pubkey,
  type,
}: FollowListDialogProps) {
  const { user } = useCurrentUser();
  
  // Fetch the appropriate list based on type
  const { data: followers, isLoading: followersLoading } = useFollowers(
    type === 'followers' ? pubkey : undefined
  );
  const { data: following, isLoading: followingLoading } = useFollowing(
    type === 'following' ? pubkey : undefined
  );

  const userList = type === 'followers' ? followers : following;
  const isLoading = type === 'followers' ? followersLoading : followingLoading;

  const title = type === 'followers' 
    ? `Followers (${userList?.length || 0})` 
    : `Following (${userList?.length || 0})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          ) : userList && userList.length > 0 ? (
            <div className="space-y-1">
              {userList.map((userPubkey) => (
                <UserListItem
                  key={userPubkey}
                  pubkey={userPubkey}
                  currentUserPubkey={user?.pubkey}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
