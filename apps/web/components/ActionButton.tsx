"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/tailwind/ui/button";
import { Loader2 } from "lucide-react";

interface ActionButtonProps extends ButtonProps {
  label: string | React.ReactNode;
  loadingLabel?: string | React.ReactNode;
  onClick: () => void;
}
export function ActionButton({
  label,
  loadingLabel,
  onClick,
  disabled,
  ...props
}: ActionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  return (
    <Button onClick={handleClick} disabled={disabled || loading} {...props}>
      {loading && loadingLabel ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          {loadingLabel}
        </div>
      ) : (
        label
      )}
    </Button>
  );
}
