"use client";

import { useRef } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { ProfileForm } from "@/components/profile-form";
import type { Profile } from "@/lib/profile";
import styles from "./profile-dialog.module.css";

/** The profile form as a modal, so it never stretches the page it's opened from. */
export function ProfileDialog({
  open,
  onOpenChange,
  now,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
  initial?: Profile | null;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogPortal>
        <DialogPrimitive.Backdrop
          className={`${styles.backdrop} fixed inset-0 z-50 bg-black/80 supports-backdrop-filter:backdrop-blur-sm`}
        />
        <DialogPrimitive.Popup
          ref={popupRef}
          // Straight to the first field (date of birth), not the close button that precedes it.
          initialFocus={() => popupRef.current?.querySelector<HTMLElement>("[id$='-birth']") ?? true}
          className={`${styles.popup} fixed top-1/2 left-1/2 z-50 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 outline-none`}
        >
          <ProfileForm now={now} initial={initial} onDone={() => onOpenChange(false)} />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
