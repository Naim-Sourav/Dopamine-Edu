
export enum AppView {
  HOME = 'HOME',
  CONCEPT = 'CONCEPT',
  QUIZ = 'QUIZ',
  ADMISSION = 'ADMISSION',
  TRACKER = 'TRACKER',
  BATTLE = 'BATTLE',
  COURSE = 'COURSE',
  EXAM_PACK = 'EXAM_PACK',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN',
  LEADERBOARD = 'LEADERBOARD'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: SearchSource[];
  imageUrl?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
  subject?: string; // Added for analyzing preset results
  chapter?: string;
  topic?: string;
  difficulty?: string;
}

export interface QuizConfig {
  subject: string;
  chapter: string;
  topics: string[];
  questionCount?: number; // Optional override for presets
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface AdmissionResult {
  text: string;
  sources: SearchSource[];
}

export interface StudySession {
  id: string;
  subject: Subject;
  topic: string;
  durationMinutes: number;
  timestamp: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export enum Subject {
  PHYSICS = 'Physics (পদার্থবিজ্ঞান)',
  CHEMISTRY = 'Chemistry (রসায়ন)',
  MATH = 'Higher Math (উচ্চতর গণিত)',
  BIOLOGY = 'Biology (জীববিজ্ঞান)',
  ICT = 'ICT (তথ্য ও যোগাযোগ প্রযুক্তি)',
  ENGLISH = 'English',
  GK = 'General Knowledge (সাধারণ জ্ঞান)'
}

export enum ExamStandard {
  HSC = 'HSC Academic (বোর্ড স্ট্যান্ডার্ড)',
  MEDICAL = 'Medical Admission (মেডিকেল)',
  ENGINEERING = 'Engineering (বুয়েট/ইঞ্জিনিয়ারিং)',
  VARSITY = 'Varsity A Unit (বিশ্ববিদ্যালয় ক ইউনিট)'
}

export enum DifficultyLevel {
  EASY = 'Warm-up (সহজ)',
  MEDIUM = 'Standard (স্ট্যান্ডার্ড)',
  HARD = 'Nightmare (কঠিন)'
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  trxId: string;
  senderNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: number;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  read?: boolean; // Local state
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL: string;
  points: number;
  rank?: number;
}

export interface ExamPack {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  totalExams: number;
  features: string[];
  theme: 'blue' | 'purple' | 'emerald' | 'orange' | 'red';
  tag?: string;
}
