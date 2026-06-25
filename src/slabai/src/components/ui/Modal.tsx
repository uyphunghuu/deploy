"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="modal-panel">
        <header className="modal-header">
          <h2>{title}</h2>
          <Button aria-label="Đóng" iconOnly onClick={onClose} type="button" variant="ghost">
            <X size={18} />
          </Button>
        </header>
        {children}
      </div>
    </div>
  );
}
