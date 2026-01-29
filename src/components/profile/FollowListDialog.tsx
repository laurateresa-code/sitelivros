import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { FollowUser } from "@/hooks/useFollows";
import { User } from "lucide-react";

interface FollowListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: FollowUser[];
}

export function FollowListDialog({ isOpen, onClose, title, users }: FollowListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Link to={`/profile/${user.username}`} onClick={onClose}>
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/profile/${user.username}`}
                      onClick={onClose}
                      className="font-medium hover:underline block truncate"
                    >
                      {user.display_name || user.username}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
