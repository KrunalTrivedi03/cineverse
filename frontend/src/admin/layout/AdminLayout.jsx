import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import Dialog from "../../components/Dialog";

export default function AdminLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-shell bg-gray-50">
      <a href="#admin-content" className="now-skip">Skip to content</a>
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="admin-mobile-bar flex items-center justify-between gap-3 lg:hidden">
        <span className="font-bold">NOW Admin</span>
        <button type="button" className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm font-semibold" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
          <Menu size={18} /> Menu
        </button>
      </div>
      {menuOpen && (
        <Dialog variant="admin" label="Admin navigation" onDismiss={closeMenu}>
          <button type="button" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-lg bg-gray-100" aria-label="Close navigation" onClick={closeMenu}>
            <X size={18} />
          </button>
          <AdminSidebar onNavigate={closeMenu} />
        </Dialog>
      )}
      <main id="admin-content" tabIndex={-1} className="admin-content">
        {children}
      </main>
    </div>
  );
}
