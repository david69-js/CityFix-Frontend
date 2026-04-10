export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Simple "Feb 3" or "Jan 27" format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  // If it's the current year, just Month Day
  if (date.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }
  
  // Otherwise include year
  return `${month} ${day}, ${date.getFullYear()}`;
};
