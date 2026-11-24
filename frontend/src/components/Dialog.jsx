import { useLayoutEffect, useRef } from "react";

export default function Dialog({ children, label, onDismiss, variant = "modal", maxWidth, dismissOnBackdrop = true }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog.querySelector("[data-dialog-autofocus]")?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`now-dialog now-dialog--${variant}`}
      aria-label={label}
      style={maxWidth ? { maxWidth } : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onDismiss();
      }}
    >
      <div className="now-dialog-content">{children}</div>
    </dialog>
  );
}
