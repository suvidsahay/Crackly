import React, { createContext, useState } from 'react';

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);

  return (
    <InterviewContext.Provider value={{ selectedInterviewId, setSelectedInterviewId }}>
      {children}
    </InterviewContext.Provider>
  );
};