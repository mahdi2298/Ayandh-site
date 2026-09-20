import React, { useState, useEffect } from 'react';
import { Header } from './components/public/Header';
import { ProjectsView } from './components/public/ProjectsView';
import { ServicesView } from './components/public/ServicesView';
import { AboutView } from './components/public/AboutView';
import { SupportView } from './components/public/SupportView';
import { DedicatedBookingView } from './components/public/DedicatedBookingView';
import { BookingModal } from './components/public/BookingModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminAppointments } from './components/admin/AdminAppointments';
import { AdminCalendar } from './components/admin/AdminCalendar';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminServices } from './components/admin/AdminServices';
import { AdminNotifications } from './components/admin/AdminNotifications';
import { AdminSettings } from './components/admin/AdminSettings';
import { ManualBookingModal } from './components/admin/ManualBookingModal';
import { api } from './services/api';
import { AdminUser, Appointment } from './types';
import { ShieldCheck, CheckCircle2, Calendar, Phone, Sparkles } from 'lucide-react';

export function App() {
  // Public tabs: 'projects' | 'services' | 'about' | 'support' | 'booking'
  const [currentPublicView, setCurrentPublicView] = useState<'projects' | 'services' | 'about' | 'support' | 'booking'>('projects');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined);

  // Success Confirmation banner / popup after public booking
  const [lastBookedAppointment, setLastBookedAppointment] = useState<Appointment | null>(null);

  // Admin routing state
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');
  const [appointmentsStatusFilter, setAppointmentsStatusFilter] = useState('all');
  const [manualBookingModalOpen, setManualBookingModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check URL path or hash on initial load
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/admin') || hash === '#admin') {
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);

    // Check existing stored admin session
    const stored = api.getCurrentUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // Get pending count for badge
    refreshPendingCount();

    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const refreshPendingCount = () => {
    api.getAppointments({ status: 'Pending' })
      .then((res) => setPendingCount(res.length))
      .catch(() => {});
  };

  const navigateToAdmin = () => {
    setIsAdminRoute(true);
    window.history.pushState({}, '', '#admin');
  };

  const navigateToPublic = () => {
    setIsAdminRoute(false);
    window.history.pushState({}, '', window.location.pathname.replace('/admin', '') || '/');
  };

  const handleOpenBookingModal = (serviceTitle?: string) => {
    setPreselectedService(serviceTitle);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = (apt: Appointment) => {
    setLastBookedAppointment(apt);
    refreshPendingCount();
  };

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    refreshPendingCount();
  };

  const handleAdminLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleNavigateFromDashboardToAppointments = (filterStatus?: string) => {
    if (filterStatus) {
      setAppointmentsStatusFilter(filterStatus);
    } else {
      setAppointmentsStatusFilter('all');
    }
    setAdminActiveTab('appointments');
  };

  // ================= ADMIN VIEW =================
  if (isAdminRoute) {
    if (!currentUser) {
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToPublic={navigateToPublic}
        />
      );
    }

    return (
      <AdminLayout
        currentUser={currentUser}
        activeTab={adminActiveTab}
        onSelectTab={(tab) => {
          setAdminActiveTab(tab);
          if (tab === 'appointments') {
            setAppointmentsStatusFilter('all');
          }
        }}
        onLogout={handleAdminLogout}
        onGoToPublicSite={navigateToPublic}
        pendingAppointmentsCount={pendingCount}
      >
        {adminActiveTab === 'dashboard' && (
          <AdminDashboard
            onNavigateToAppointments={handleNavigateFromDashboardToAppointments}
            onOpenManualBooking={() => setManualBookingModalOpen(true)}
          />
        )}

        {adminActiveTab === 'appointments' && (
          <AdminAppointments
            initialStatusFilter={appointmentsStatusFilter}
            onOpenManualBooking={() => setManualBookingModalOpen(true)}
          />
        )}

        {adminActiveTab === 'calendar' && <AdminCalendar />}

        {adminActiveTab === 'customers' && <AdminCustomers />}

        {adminActiveTab === 'services' && <AdminServices />}

        {adminActiveTab === 'notifications' && (
          <AdminNotifications
            onSelectAppointment={(id) => {
              setAdminActiveTab('appointments');
            }}
          />
        )}

        {adminActiveTab === 'settings' && <AdminSettings />}

        {/* Manual Booking Modal in Admin */}
        <ManualBookingModal
          isOpen={manualBookingModalOpen}
          onClose={() => setManualBookingModalOpen(false)}
          onSuccess={(apt) => {
            refreshPendingCount();
            alert(`نوبت با شناسه ${apt.id} برای ${apt.customerName} با موفقیت در سیستم ثبت گردید.`);
          }}
        />
      </AdminLayout>
    );
  }

  // ================= PUBLIC WEBSITE VIEW =================
  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#19211c] font-sans antialiased flex flex-col justify-between selection:bg-[#d0eacb] selection:text-[#15422e]">
      {/* Top Header */}
      <Header
        currentTab={currentPublicView}
        onSelectTab={(v: string) => setCurrentPublicView(v as any)}
        onOpenBooking={() => handleOpenBookingModal()}
        onGoToAdmin={navigateToAdmin}
        unreadAdminNotifs={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 md:py-10">
        {currentPublicView === 'projects' && (
          <ProjectsView onOpenBookingWithService={(serviceName) => handleOpenBookingModal(serviceName)} />
        )}

        {currentPublicView === 'services' && (
          <ServicesView onOpenBookingWithService={(serviceName) => handleOpenBookingModal(serviceName)} />
        )}

        {currentPublicView === 'about' && (
          <AboutView onOpenBooking={() => handleOpenBookingModal()} />
        )}

        {currentPublicView === 'support' && (
          <SupportView onOpenBooking={() => handleOpenBookingModal()} />
        )}

        {currentPublicView === 'booking' && (
          <DedicatedBookingView onSuccess={handleBookingSuccess} />
        )}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#e2dec9] bg-[#fbf9f4] py-8 px-4 sm:px-8 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#15422e] text-sm">استودیو معماری و نوآوری آینده</span>
            <span className="text-stone-400">|</span>
            <span>سامانه رسمی نوبت‌دهی و جلسات مشاوره</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPublicView('booking')}
              className="text-[#15422e] hover:underline font-bold"
            >
              فرم رزرواسیون آنلاین
            </button>
            <span className="text-stone-300">•</span>
            <button
              type="button"
              onClick={() => setCurrentPublicView('support')}
              className="hover:underline"
            >
              راهنمای پذیرش
            </button>
            <span className="text-stone-300">•</span>
            <button
              type="button"
              onClick={navigateToAdmin}
              className="flex items-center gap-1 text-[#15422e] font-bold hover:underline cursor-pointer bg-[#eef7ec] px-3 py-1 rounded-lg border border-[#d0eacb]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ورود به پیشخوان مدیریت (Admin)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Booking Modal (Popup from header or buttons) */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialService={preselectedService}
        onAppointmentCreated={handleBookingSuccess}
      />

      {/* Global Booking Success Banner / Card */}
      {lastBookedAppointment && (
        <div className="fixed bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-50 bg-[#15422e] text-white p-5 rounded-2xl shadow-2xl border border-[#d0eacb] animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2e5a44] text-[#d0eacb] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-sm text-white">نوبت شما با موفقیت ثبت شد!</h4>
                <p className="text-stone-300 leading-relaxed">
                  کد رهگیری: <span className="font-mono font-bold text-[#d0eacb]">{lastBookedAppointment.id}</span>
                </p>
                <p className="text-[11px] text-stone-300">
                  برای تاریخ {lastBookedAppointment.date} ساعت {lastBookedAppointment.time} در سامانه مرکزی درج گردید.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastBookedAppointment(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
