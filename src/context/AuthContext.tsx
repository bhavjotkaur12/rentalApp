import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/FirebaseConfig';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'tenant' | 'landlord' | null;
}

interface AuthContextType {
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;  // Add this line
}

const AuthContext = createContext<AuthContextType>({
  userData: null,
  loading: true,
  signOut: async () => {},  // Add this line
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Move signOut function outside of useEffect
  const signOut = async () => {
    try {
      // First set loading to true to prevent any data fetches
      setLoading(true);
      // Then sign out
      await firebaseSignOut(auth);
      // Clear user data
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userDocData = userDoc.data();

          if (userDoc.exists()) {
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: userDocData?.displayName || user.displayName,
              role: userDocData?.role || null,
            });
            console.log('User data set:', {
              uid: user.uid,
              email: user.email,
              displayName: userDocData?.displayName,
              role: userDocData?.role,
            });
          } else {
            console.log('No user document found in Firestore');
            setUserData(null);
          }
        } else {
          console.log('No user authenticated');
          setUserData(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};