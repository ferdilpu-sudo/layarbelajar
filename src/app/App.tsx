import { NavLink, Route, Routes } from 'react-router';
import { BRAND_NAME } from '../shared/brand';
import { CatalogPage } from '../features/catalog/ui/CatalogPage';
import { ContentDetailPage } from '../features/catalog/ui/ContentDetailPage';
import { ComponentFixturePage } from '../features/design-preview/ui/ComponentFixturePage';
import { LoginPlaceholder } from '../features/identity/ui/LoginPlaceholder';
import { LoginPage } from '../features/identity/ui/LoginPage';
import { AccountHomePage } from '../features/identity/ui/AccountHomePage';
import { ChangePasswordPage } from '../features/identity/ui/ChangePasswordPage';
import { AdminAccountsPage } from '../features/identity/ui/AdminAccountsPage';
import { ErrorBoundary } from './ErrorBoundary';
import { NotFoundPage } from './NotFoundPage';

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <NavLink className="wordmark" to="/" aria-label="LayarBelajar, beranda">
            <span className="wordmark-mark" aria-hidden="true">
              ✦
            </span>
            {BRAND_NAME}
          </NavLink>
          <nav className="header-nav" aria-label="Navigasi utama">
            <NavLink end to="/">
              Katalog
            </NavLink>
            <NavLink to="/gabung">Gabung sesi</NavLink>
            <NavLink to="/login">Masuk</NavLink>
          </nav>
        </div>
      </header>
      <main id="main-content">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/konten/:slug" element={<ContentDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/akun" element={<AccountHomePage />} />
            <Route path="/ganti-password" element={<ChangePasswordPage />} />
            <Route path="/admin/akun" element={<AdminAccountsPage />} />
            <Route path="/gabung" element={<LoginPlaceholder join />} />
            {import.meta.env.DEV ? <Route path="/__ui" element={<ComponentFixturePage />} /> : null}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <footer className="site-footer">
        <div className="container">
          {BRAND_NAME} · Katalog contoh tahap M-001 — belum terhubung ke layanan sekolah.
        </div>
      </footer>
    </>
  );
}
