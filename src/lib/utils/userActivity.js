// Utility functions for user activity tracking

export const isUserActive = (lastLogin, thresholdMinutes = 5) => {
  if (!lastLogin) return false;
  
  const lastLoginTime = new Date(lastLogin);
  const now = new Date();
  const diffInMinutes = (now - lastLoginTime) / (1000 * 60);
  
  return diffInMinutes <= thresholdMinutes;
};

export const getActiveUsers = (users, thresholdMinutes = 5) => {
  return users.filter(user => isUserActive(user.lastLogin, thresholdMinutes));
};

export const formatLastSeen = (lastLogin) => {
  if (!lastLogin) return 'Never';
  
  const lastLoginTime = new Date(lastLogin);
  const now = new Date();
  const diffInMinutes = Math.floor((now - lastLoginTime) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

export const getUserStats = (users) => {
  const totalUsers = users.length;
  const activeUsers = getActiveUsers(users);
  const students = users.filter(user => user.role === 'student');
  const admins = users.filter(user => user.role === 'admin');
  const superAdmins = users.filter(user => user.role === 'codebud_super_admin');
  
  return {
    total: totalUsers,
    active: activeUsers.length,
    students: students.length,
    admins: admins.length,
    superAdmins: superAdmins.length,
    activeStudents: getActiveUsers(students).length,
    activeAdmins: getActiveUsers(admins).length
  };
};
