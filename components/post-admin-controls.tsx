"use client";

import { PublishButton } from "@/app/(dashboard)/dashboard/posts/PublishButton";
import { DeleteButton } from "@/app/(main)/posts/[id]/DeleteButton";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "./tailwind/ui/button";
import { ContextMenuContent, ContextMenuItem } from "./tailwind/ui/context-menu";

interface PostAdminControlsProps {
	postAuthorId: string;
	postId: string;
	isPublic: boolean;
}

export default function PostAdminControls({ postAuthorId, postId, isPublic }: PostAdminControlsProps) {
	const { profile } = useUserProfile();
	const canManagePost =
		profile?.id === postAuthorId || profile?.role === "admin" || process.env.NEXT_ALLOW_BAD_UI === "true";

	if (!canManagePost) {
		return null;
	}

	return (
		<ContextMenuContent>
			<ContextMenuItem>
				<Button variant="ghost" asChild>
					<a href={`/dashboard/posts/${postId}/edit`}>Edit Post</a>
				</Button>
			</ContextMenuItem>
			<ContextMenuItem>
				<PublishButton postId={postId} isPublic={isPublic} />
			</ContextMenuItem>
			<ContextMenuItem>
				<DeleteButton id={postId} />
			</ContextMenuItem>
		</ContextMenuContent>
	);
}
