
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User, signOut, updateProfile, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { syncUserToMongoDB, fetchUserEnrollments, fetchUserStatsAPI } from '../services/api';

export interface EnrolledCourse {
  id: string; 
  title: string;
  progress: number;
}

export interface UserProfileExtended {
  college?: string;
  hscBatch?: string;
  department?: string;
  target?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userAvatar: string;
  enrolledCourses: EnrolledCourse[];
  extendedProfile: UserProfileExtended | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, photoURL: string, additionalData?: UserProfileExtended) => Promise<void>;
  enrollInCourse: (course: EnrolledCourse) => void;
  isEnrolled: (contentId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string>('default');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [extendedProfile, setExtendedProfile] = useState<UserProfileExtended | null>(null);

  useEffect(() => {
    // Explicitly set persistence to local storage
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Failed to set auth persistence:", error);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        if (user.photoURL) {
          setUserAvatar(user.photoURL);
        }

        // 1. Fetch Enrollments & Stats (to get profile info)
        try {
           const courses = await fetchUserEnrollments(user.uid);
           setEnrolledCourses(courses);
           
           // Fetch stats to get extended profile data stored in MongoDB
           const stats = await fetchUserStatsAPI(user.uid);
           if (stats && stats.user) {
               setExtendedProfile({
                   college: stats.user.college,
                   hscBatch: stats.user.hscBatch,
                   department: stats.user.department,
                   target: stats.user.target
               });
           }
           
           // Initial Sync (Just to ensure basics are there)
           syncUserToMongoDB(user);

        } catch (err) {
           console.error("Error loading user data", err);
        }
        setLoading(false);

      } else {
        setEnrolledCourses([]);
        setExtendedProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const logout = () => signOut(auth);

  const updateUserProfile = async (name: string, photoURL: string, additionalData?: UserProfileExtended) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photoURL
      });
      setCurrentUser({ ...auth.currentUser, displayName: name, photoURL: photoURL });
      setUserAvatar(photoURL);
      
      if (additionalData) {
          setExtendedProfile(additionalData);
      }

      // Sync update to MongoDB including extended fields
      syncUserToMongoDB({ 
          ...auth.currentUser, 
          displayName: name, 
          photoURL: photoURL,
          ...(additionalData || {})
      });
    }
  };

  const enrollInCourse = async (course: EnrolledCourse) => {
    setEnrolledCourses(prev => [...prev, course]);
  };

  const isEnrolled = (contentId: string) => {
    return enrolledCourses.some(c => c.id === contentId);
  };

  const value = { 
    currentUser, 
    loading, 
    logout, 
    userAvatar, 
    enrolledCourses,
    extendedProfile,
    updateUserProfile,
    enrollInCourse,
    isEnrolled
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
