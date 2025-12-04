import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaymentRequest } from '../types';
import { 
  submitPaymentToAPI, 
  fetchPaymentsFromAPI, 
  updatePaymentStatusAPI, 
  deletePaymentAPI, 
  sendNotificationAPI,
  fetchAdminStatsAPI 
} from '../services/api';

interface AdminStats {
  totalRevenue: number;
  totalEnrollments: number;
  pendingRequests: number;
  activeUsers: number;
  totalQuestions: number;
  totalExams: number; 
}

interface AdminContextType {
  paymentRequests: PaymentRequest[];
  stats: AdminStats;
  submitPaymentRequest: (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp'>) => Promise<void>;
  approvePayment: (id: string) => Promise<void>;
  rejectPayment: (id: string) => Promise<void>;
  deletePaymentRequest: (id: string) => Promise<void>;
  sendNotification: (title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS') => Promise<void>;
  isAdmin: boolean;
  refreshRequests: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalEnrollments: 0,
    pendingRequests: 0,
    activeUsers: 0,
    totalQuestions: 0,
    totalExams: 0
  });
  
  const isAdmin = true; // In a real app, verify via API/Token

  const refreshRequests = async () => {
    try {
      const [requests, fetchedStats] = await Promise.all([
          fetchPaymentsFromAPI(),
          fetchAdminStatsAPI()
      ]);
      
      setPaymentRequests(requests);
      
      if (fetchedStats) {
          setStats({
              totalRevenue: fetchedStats.totalRevenue,
              totalEnrollments: fetchedStats.approvedEnrollments,
              pendingRequests: fetchedStats.pendingPayments,
              activeUsers: fetchedStats.totalUsers,
              totalQuestions: fetchedStats.totalQuestions,
              totalExams: fetchedStats.totalExams
          });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  useEffect(() => {
    refreshRequests();
  }, []);

  const submitPaymentRequest = async (requestData: Omit<PaymentRequest, 'id' | 'status' | 'timestamp'>) => {
    try {
      await submitPaymentToAPI(requestData);
      await refreshRequests(); 
    } catch (e) {
      console.error("Error submitting payment:", e);
      throw e;
    }
  };

  const approvePayment = async (id: string) => {
    try {
      await updatePaymentStatusAPI(id, 'APPROVED');
      await refreshRequests();
    } catch (e) {
      console.error("Error approving:", e);
      alert("Failed to approve payment.");
    }
  };

  const rejectPayment = async (id: string) => {
    try {
      await updatePaymentStatusAPI(id, 'REJECTED');
      await refreshRequests();
    } catch (e) {
      console.error("Error rejecting:", e);
    }
  };

  const deletePaymentRequest = async (id: string) => {
    try {
      await deletePaymentAPI(id);
      await refreshRequests();
    } catch (e) {
      console.error("Error deleting:", e);
    }
  };

  const sendNotification = async (title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS') => {
    try {
      await sendNotificationAPI({ title, message, type });
    } catch (e) {
      console.error("Error sending notification:", e);
      throw e;
    }
  };

  return (
    <AdminContext.Provider value={{ 
      paymentRequests, 
      stats,
      submitPaymentRequest, 
      approvePayment, 
      rejectPayment, 
      deletePaymentRequest,
      sendNotification,
      isAdmin, 
      refreshRequests 
    }}>
      {children}
    </AdminContext.Provider>
  );
};