import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminRoute, SuperAdminRoute } from './components/RoleRoute';
import AdminLayout from './layout/AdminLayout';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AnnoncesPage       from './pages/annonces/AnnoncesPage';
import AnnonceDetailPage  from './pages/annonces/AnnonceDetailPage';
import AnnonceEditPage    from './pages/annonces/AnnonceEditPage';
import MessagesPage from './pages/messages/MessagesPage';
import UtilisateursPage from './pages/utilisateurs/UtilisateursPage';
import ProfilPage from './pages/configuration/ProfilPage';
import GestionProprietairePage from './pages/configuration/GestionProprietairePage';
import GestionProspectPage from './pages/configuration/GestionProspectPage';
import GestionLocatairePage from './pages/configuration/GestionLocatairePage';
import GestionAdminPage from './pages/configuration/GestionAdminPage';
import GestionCommercialPage from './pages/configuration/GestionCommercialPage';
import LoyersPage    from './pages/loyers/LoyersPage';
import FinancesPage  from './pages/finances/FinancesPage';
import FeedbacksPage from './pages/feedbacks/FeedbacksPage';
import GestionLiaisonsPage from './pages/gestion/GestionLiaisonsPage';
import RetraitsPage        from './pages/retraits/RetraitsPage';
import MesAnnoncesPage    from './pages/commercial/MesAnnoncesPage';
import MesVisitesPage     from './pages/commercial/MesVisitesPage';
import PublierBienPage    from './pages/commercial/PublierBienPage';

function DefaultRedirect() {
  const { user } = useAuth();
  if ((user?.role_principal ?? user?.role) === 'commercial') return <Navigate to="/annonces" replace />;
  return <Navigate to="/dashboard" replace />;
}

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
            <Route index element={<DefaultRedirect />} />
            <Route path="dashboard"    element={<AdminRoute><DashboardPage /></AdminRoute>} />
            <Route path="annonces"           element={<AnnoncesPage />} />
            <Route path="annonces/:id"      element={<AnnonceDetailPage />} />
            <Route path="annonces/:id/modifier" element={<AnnonceEditPage />} />
            <Route path="mes-annonces" element={<MesAnnoncesPage />} />
            <Route path="mes-visites"  element={<MesVisitesPage />} />
            <Route path="publier-bien" element={<PublierBienPage />} />
            <Route path="messages"     element={<MessagesPage />} />
            <Route path="utilisateurs" element={<AdminRoute><UtilisateursPage /></AdminRoute>} />
            <Route path="loyers"       element={<AdminRoute><LoyersPage /></AdminRoute>} />
            <Route path="finances"     element={<AdminRoute><FinancesPage /></AdminRoute>} />
            <Route path="feedbacks"    element={<AdminRoute><FeedbacksPage /></AdminRoute>} />
            <Route path="liaisons"     element={<AdminRoute><GestionLiaisonsPage /></AdminRoute>} />
            <Route path="retraits"     element={<SuperAdminRoute><RetraitsPage /></SuperAdminRoute>} />

            {/* Configuration */}
            <Route path="configuration">
              <Route index element={<Navigate to="profil" replace />} />
              <Route path="profil"          element={<ProfilPage />} />
              <Route path="commerciaux"     element={<AdminRoute><GestionCommercialPage /></AdminRoute>} />
              <Route path="proprietaires"   element={<AdminRoute><GestionProprietairePage /></AdminRoute>} />
              <Route path="prospects"       element={<AdminRoute><GestionProspectPage /></AdminRoute>} />
              <Route path="locataires"      element={<AdminRoute><GestionLocatairePage /></AdminRoute>} />
              <Route path="administrateurs" element={<SuperAdminRoute><GestionAdminPage /></SuperAdminRoute>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
