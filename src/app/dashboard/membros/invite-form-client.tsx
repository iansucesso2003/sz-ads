"use client";

import { useState } from "react";
import { InviteForm } from "@/components/members/invite-form";
import { MembersTable } from "@/components/members/members-table";

interface Props {
  orgId: string;
  currentUserId: string;
}

export default function MembrosClient({ orgId, currentUserId }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <InviteForm orgId={orgId} onInvited={() => setRefreshKey((k) => k + 1)} />
      <MembersTable orgId={orgId} currentUserId={currentUserId} refreshKey={refreshKey} />
    </div>
  );
}
