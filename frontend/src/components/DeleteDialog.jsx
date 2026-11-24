import { Trash2 } from "lucide-react";
import Dialog from "./Dialog";

export default function DeleteDialog({ title, children, onCancel, onDelete, busy = false }) {
  return (
    <Dialog label={title} onDismiss={() => { if (!busy) onCancel(); }}>
      <div className="p-5 sm:p-7">
        <span className="mb-4 grid size-11 place-items-center rounded-xl bg-red-50 text-red-700">
          <Trash2 size={20} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="mt-2 break-words text-sm leading-relaxed text-gray-500">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={busy} onClick={onDelete} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
