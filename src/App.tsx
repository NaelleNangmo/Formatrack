import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Enregistrement from './pages/Enregistrement';
import Clients from './pages/Clients';
import Cours from './pages/Cours';
import Presences from './pages/Presences';
import Finance from './pages/Finance';
import AbsencesRetards from './pages/AbsencesRetards';
import Utilisateurs from './pages/Utilisateurs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/enregistrement"
          element={
            <Layout>
              <Enregistrement />
            </Layout>
          }
        />
        <Route
          path="/clients"
          element={
            <Layout>
              <Clients />
            </Layout>
          }
        />
        <Route
          path="/cours"
          element={
            <Layout>
              <Cours />
            </Layout>
          }
        />
        <Route
          path="/presences"
          element={
            <Layout>
              <Presences />
            </Layout>
          }
        />
        <Route
          path="/finance"
          element={
            <Layout>
              <Finance />
            </Layout>
          }
        />
        <Route
          path="/absences"
          element={
            <Layout>
              <AbsencesRetards />
            </Layout>
          }
        />
        <Route
          path="/utilisateurs"
          element={
            <Layout>
              <Utilisateurs />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;