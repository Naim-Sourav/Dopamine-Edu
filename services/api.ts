
import { PaymentRequest, Notification, LeaderboardUser, ExamPack } from "../types";

const API_BASE = 'https://mongodb-hb6b.onrender.com/api';

const handleResponse = async (response: Response, errorMsg: string) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.details || `${errorMsg} (${response.status})`);
  }
  return await response.json();
};

export const syncUserToMongoDB = async (user: any) => {
  try {
    const response = await fetch(`${API_BASE}/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        // Optional fields if provided in user object (from context)
        college: user.college,
        hscBatch: user.hscBatch,
        department: user.department,
        target: user.target
      })
    });
    if (!response.ok) return null;
    return await response.json().catch(() => null);
  } catch (error) {
    return null;
  }
};

export const fetchUserEnrollments = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/enrollments`);
    if (!response.ok) throw new Error('Fetch failed');
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const saveExamResultAPI = async (userId: string, resultData: any) => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/exam-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData)
    });
    return await handleResponse(response, 'Failed to save exam result');
  } catch (error) {
    return null;
  }
};

export const fetchUserStatsAPI = async (userId: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/stats`);
  return handleResponse(response, 'Failed to fetch user stats');
};

export const fetchUserMistakesAPI = async (userId: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/mistakes`);
  return handleResponse(response, 'Failed to fetch mistakes');
};

export const deleteUserMistakeAPI = async (userId: string, mistakeId: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/mistakes/${mistakeId}`, {
    method: 'DELETE'
  });
  return handleResponse(response, 'Failed to delete mistake');
};

export const fetchLeaderboardAPI = async (): Promise<LeaderboardUser[]> => {
  const response = await fetch(`${API_BASE}/leaderboard`);
  return handleResponse(response, 'Failed to fetch leaderboard');
};

export const toggleSaveQuestionAPI = async (userId: string, questionId: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/saved-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId })
  });
  return handleResponse(response, 'Failed to toggle save');
};

export const fetchSavedQuestionsAPI = async (userId: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/saved-questions`);
  return handleResponse(response, 'Failed to fetch saved questions');
};

export const deleteSavedQuestionAPI = async (userId: string, id: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/saved-questions/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response, 'Failed to delete saved question');
};

export const submitPaymentToAPI = async (data: any) => {
  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(response, 'Submission failed');
};

export const fetchPaymentsFromAPI = async (): Promise<PaymentRequest[]> => {
  try {
    const response = await fetch(`${API_BASE}/admin/payments`);
    if (!response.ok) throw new Error('Fetch failed');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  } catch (error) {
    return [];
  }
};

export const fetchAdminStatsAPI = async () => {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`);
    if (!response.ok) throw new Error('Fetch failed');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updatePaymentStatusAPI = async (id: string, status: 'APPROVED' | 'REJECTED') => {
  const response = await fetch(`${API_BASE}/admin/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return handleResponse(response, 'Update failed');
};

export const deletePaymentAPI = async (id: string) => {
  const response = await fetch(`${API_BASE}/admin/payments/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response, 'Delete failed');
};

export const saveQuestionsToBankAPI = async (questions: any[]) => {
  try {
    const response = await fetch(`${API_BASE}/admin/questions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions })
    });
    return await handleResponse(response, 'Failed to save questions');
  } catch (error: any) {
    throw error;
  }
};

export const fetchQuestionsFromBankAPI = async (page: number, limit: number, subject?: string, chapter?: string) => {
  let url = `${API_BASE}/admin/questions?page=${page}&limit=${limit}`;
  if (subject) url += `&subject=${encodeURIComponent(subject)}`;
  if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
  const response = await fetch(url);
  return handleResponse(response, 'Failed to fetch questions');
};

export const deleteQuestionFromBankAPI = async (id: string) => {
  const response = await fetch(`${API_BASE}/admin/questions/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response, 'Failed to delete question');
};

export const generateQuizFromDB = async (config: { subject: string, chapter: string, topics: string[], count: number }) => {
  const response = await fetch(`${API_BASE}/quiz/generate-from-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return handleResponse(response, 'Failed to fetch quiz from DB');
};

export const fetchSyllabusStatsAPI = async () => {
  const response = await fetch(`${API_BASE}/quiz/syllabus-stats`);
  return handleResponse(response, 'Failed to fetch syllabus stats');
};

export const sendNotificationAPI = async (data: any) => {
  const response = await fetch(`${API_BASE}/admin/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(response, 'Notification failed');
};

export const fetchNotificationsAPI = async (): Promise<Notification[]> => {
  try {
    const response = await fetch(`${API_BASE}/notifications`);
    if (!response.ok) throw new Error('Fetch failed');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  } catch (error) {
    return [];
  }
};

export const fetchExamPacksAPI = async (): Promise<ExamPack[]> => {
  const response = await fetch(`${API_BASE}/exam-packs`);
  return handleResponse(response, 'Failed to fetch exam packs');
};

// --- BATTLE API UPDATED ---

export const createBattleRoom = async (userId: string, userName: string, avatar: string, college: string, config: any) => {
  const response = await fetch(`${API_BASE}/battles/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName, avatar, college, config })
  });
  return handleResponse(response, 'Create room failed');
};

export const joinBattleRoom = async (roomId: string, userId: string, userName: string, avatar: string, college: string) => {
  const response = await fetch(`${API_BASE}/battles/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, userId, userName, avatar, college })
  });
  return handleResponse(response, 'Join room failed');
};

export const startBattle = async (roomId: string, userId: string) => {
  const response = await fetch(`${API_BASE}/battles/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, userId })
  });
  return handleResponse(response, 'Start battle failed');
};

export const getBattleState = async (roomId: string) => {
  const response = await fetch(`${API_BASE}/battles/${roomId}`);
  return handleResponse(response, 'Fetch battle failed');
};

export const submitBattleAnswer = async (roomId: string, userId: string, questionIndex: number, selectedOption: number, timeTaken: number) => {
  const response = await fetch(`${API_BASE}/battles/${roomId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionIndex, selectedOption, timeTaken })
  });
  return handleResponse(response, 'Submit answer failed');
};
