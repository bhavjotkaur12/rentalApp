import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User
  } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { auth, db } from './FirebaseConfig';
  
  export interface UserData {
    uid: string;
    email: string;
    role: 'landlord' | 'tenant';
    displayName: string;
  }
  
  export function userAuthentication() {
    const signUp = async (
      email: string, 
      password: string, 
      role: 'landlord' | 'tenant',
      displayName: string
    ): Promise<UserData> => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName });
        
        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role,
          displayName
        });
  
        return {
          uid: user.uid,
          email: user.email!,
          role,
          displayName
        };
      } catch (error) {
        throw error;
      }
    };
  
    const signIn = async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
      } catch (error) {
        throw error;
      }
    };
  
    const logout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        throw error;
      }
    };
  
    return {
      signUp,
      signIn,
      logout
    };
  }