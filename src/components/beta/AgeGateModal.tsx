"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AGE_GATE_KEY } from "@/lib/beta/checklist";

export function AgeGateModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const confirmed = localStorage.getItem(AGE_GATE_KEY);
    if (!confirmed) setVisible(true);
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_GATE_KEY, "true");
    setVisible(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full border-violet-500/30" glow>
        <CardTitle>Adults 18+ only</CardTitle>
        <CardDescription className="mt-3 mb-6 leading-relaxed">
          Companion Passport is intended for adults 18+. This beta does not support
          minors, explicit sexual content, or crisis support. If you need crisis
          help, please contact local emergency services or a qualified professional.
        </CardDescription>
        <div className="flex flex-col gap-2">
          <Button onClick={handleConfirm}>I am 18+ and understand</Button>
          <Button variant="ghost" onClick={handleExit}>
            Exit
          </Button>
        </div>
      </Card>
    </div>
  );
}
