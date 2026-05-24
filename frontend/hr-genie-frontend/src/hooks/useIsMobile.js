import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 1024) => {
  // Initialize state with undefined so server-side rendering doesn't mismatch
  // but since this is a CRA/Vite app, we can just use window directly
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
