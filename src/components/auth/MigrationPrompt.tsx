"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

interface MigrationPromptProps {
  onMove: () => void;
  onKeepLocal: () => void;
  onClearLocal: () => void;
  loading?: boolean;
}

export function MigrationPrompt({
  onMove,
  onKeepLocal,
  onClearLocal,
  loading,
}: MigrationPromptProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full border-violet-500/30" glow>
        <CardTitle>Move demo data to your account?</CardTitle>
        <CardDescription className="mt-2 mb-6">
          We found companion data saved on this device. You can move it to your
          cloud account, keep using local demo mode, or clear local data.
        </CardDescription>
        <div className="flex flex-col gap-2">
          <Button onClick={onMove} disabled={loading}>
            {loading ? "Moving..." : "Move to account"}
          </Button>
          <Button variant="secondary" onClick={onKeepLocal} disabled={loading}>
            Keep local only
          </Button>
          <Button variant="ghost" onClick={onClearLocal} disabled={loading}>
            Clear local data
          </Button>
        </div>
      </Card>
    </div>
  );
}
