import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MockDataProvider } from "./context/MockDataContext";
import { Header } from "./components/Header";
import { MyPage } from "./pages/MyPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { LeaderPage } from "./pages/LeaderPage";
import { LeaderGroupDetailPage } from "./pages/LeaderGroupDetailPage";
import { LeaderGatheringDetailPage } from "./pages/LeaderGatheringDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminGroupDetailPage } from "./pages/AdminGroupDetailPage";
import { AdminPersonDetailPage } from "./pages/AdminPersonDetailPage";
import { AdminGatheringDetailPage } from "./pages/AdminGatheringDetailPage";
import { AdminTaskDetailPage } from "./pages/AdminTaskDetailPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { ModulePlaceholderPage } from "./pages/ModulePlaceholderPage";
import { HusfellesskapPage } from "./pages/HusfellesskapPage";

export default function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
          <Header />

          <main className="flex-1 pb-12">
            <Routes>
              <Route path="/" element={<MyPage />} />
              <Route path="/leder" element={<LeaderPage />} />
              <Route path="/leder/gruppe/:groupId" element={<LeaderGroupDetailPage />} />
              <Route path="/leder/samling/:gatheringId" element={<LeaderGatheringDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/gruppe/:groupId" element={<AdminGroupDetailPage />} />
              <Route path="/admin/person/:personId" element={<AdminPersonDetailPage />} />
              <Route path="/admin/samling/:gatheringId" element={<AdminGatheringDetailPage />} />
              <Route path="/admin/oppgave/:taskId" element={<AdminTaskDetailPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route
                path="/kalender"
                element={<ModulePlaceholderPage module="kalender" />}
              />
              <Route
                path="/meldinger"
                element={<ModulePlaceholderPage module="meldinger" />}
              />
              <Route path="/oppgave/:taskId" element={<TaskDetailPage />} />
              <Route path="/husfellesskap" element={<HusfellesskapPage />} />
              <Route path="/husfellesskap/:groupId" element={<HusfellesskapPage />} />
              {/* Fallback to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="py-6 border-t border-slate-200/60 bg-white/70 text-center text-xs text-slate-500">
            <div className="max-w-md mx-auto px-4 space-y-1">
              <p className="font-semibold text-slate-700">Menighetsplan 2.0 – Sprint 4.2 Gruppelederflate</p>
              <p className="text-[11px] text-slate-400">
                Testmiljø for Min side, Gruppeleder, Nestleder, Admin og Samlingsplanlegging
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </MockDataProvider>
  );
}

