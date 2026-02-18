import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-xl border border-[#D4CFC6] bg-white p-0 shadow-lg backdrop:bg-black/20 backdrop:backdrop-blur-sm max-w-sm w-full"
    >
      <div className="px-6 pt-5 pb-4">
        <h3 className="text-base font-semibold text-[#1a1a1a]">{title}</h3>
        <p className="mt-2 text-sm text-[#8b8b8b]">{description}</p>
      </div>
      <div className="flex justify-end gap-2 px-6 pb-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#fafafa] border border-[#e0e0e0] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
