// src/components/common/ConfirmDialog.tsx
import React from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="bb-modal bb-modal--confirm">
      <div className="bb-modal__dialog bb-modal__dialog--small">
        <h4 className="bb-modal__title">
          {title}
        </h4>

        <div className="bb-modal__body">
          {message}
        </div>

        <div className="bb-modal__footer">
          <button
            type="button"
            className="bb-button bb-button--small"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={
              danger
                ? "bb-button bb-button--small bb-button--danger"
                : "bb-button bb-button--small"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}