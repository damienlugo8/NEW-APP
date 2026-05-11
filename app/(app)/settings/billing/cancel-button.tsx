"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelSubscriptionAction } from "../actions";

export function CancelButton({ disabled }: { disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled || pending}
      onClick={() => start(() => { void cancelSubscriptionAction(); })}
    >
      {pending ? "Canceling…" : "Cancel subscription"}
    </Button>
  );
}
