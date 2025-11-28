import { useAuth } from '../context/AuthContext';

export const useUser = () => {
  const { currentUser } = useAuth();
  
  return {
    user: currentUser,
    isAuthenticated: !!currentUser,
    uid: currentUser?.uid,
    email: currentUser?.email,
    displayName: currentUser?.displayName,
    photoURL: currentUser?.photoURL
  };
};

export default useUser;
