import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, branchService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    branchService.getAll().then(data => setBranches(data));
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Helper for demonstration to switch branches seamlessly while maintaining user session
  const switchBranch = (newBranchId) => {
    if (!user) return;
    const branch = branches.find(b => b.id === Number(newBranchId));
    if (branch) {
      const updated = {
        ...user,
        branch_id: branch.id,
        branch_name: branch.name
      };
      setUser(updated);
      localStorage.setItem('pms_auth_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchBranch, branches, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
