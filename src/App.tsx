import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AnnoncesPage from './pages/annonces/AnnoncesPage';
import MessagesPage from './pages/messages/MessagesPage';
import UtilisateursPage from './pages/utilisateurs/UtilisateursPage';
import ProfilPage from './pages/configuration/ProfilPage';
import GestionProprietairePage from './pages/configuration/GestionProprietairePage';
import GestionProspectPage from './pages/configuration/GestionProspectPage';
import GestionLocatairePage from './pages/configuration/GestionLocatairePage';
import GestionAdminPage from './pages/configuration/GestionAdminPage';
import LoyersPage    from './pages/loyers/LoyersPage';
import FinancesPage  from './pages/finances/FinancesPage';
import FeedbacksPage from './pages/feedbacks/FeedbacksPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<DashboardPage />} />
            <Route path="annonces"     element={<AnnoncesPage />} />
            <Route path="messages"     element={<MessagesPage />} />
            <Route path="utilisateurs" element={<UtilisateursPage />} />
            <Route path="loyers"       element={<LoyersPage />} />
            <Route path="finances"     element={<FinancesPage />} />
            <Route path="feedbacks"    element={<FeedbacksPage />} />

            {/* Configuration */}
            <Route path="configuration">
              <Route index element={<Navigate to="profil" replace />} />
              <Route path="profil"          element={<ProfilPage />} />
              <Route path="proprietaires"   element={<GestionProprietairePage />} />
              <Route path="prospects"       element={<GestionProspectPage />} />
              <Route path="locataires"      element={<GestionLocatairePage />} />
              <Route path="administrateurs" element={<GestionAdminPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
