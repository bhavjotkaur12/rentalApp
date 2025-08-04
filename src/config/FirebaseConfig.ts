import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBGMp-6WglwwlM1uhhboN8RaRiYrqPzmHE",  
  authDomain: "asg4-e2423.firebaseapp.com",
  projectId: "asg4-e2423",  
  storageBucket: "asg4-e2423.firebasestorage.app", 
  messagingSenderId: "1047445309634",  
  appId: "1:1047445309634:ios:a9ce28e4bf49263aebd35b", 
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;