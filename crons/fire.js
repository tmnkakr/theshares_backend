// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDv9yiSi7iM62wLqDHBTMsY9ALO3P7CWY4",
  authDomain: "theshares.firebaseapp.com",
  projectId: "theshares",
  storageBucket: "theshares.appspot.com",
  messagingSenderId: "508644475744",
  appId: "1:508644475744:web:5b7e8c918e776bfe919405",
  measurementId: "G-W1H3KYBZED"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);