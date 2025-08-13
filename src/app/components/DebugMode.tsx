"use client";

import { useEffect } from 'react';

const DebugMode = () => {
  useEffect(() => {
    // Re-enable right-click for debugging
    const enableRightClick = (e: MouseEvent) => {
      e.stopPropagation();
      return true;
    };

    // Re-enable text selection
    const enableSelection = (e: Event) => {
      e.stopPropagation();
      return true;
    };

    // Re-enable keyboard shortcuts
    const enableKeyboard = (e: KeyboardEvent) => {
      e.stopPropagation();
      return true;
    };

    // Add event listeners with capture=true to override the global ones
    document.addEventListener('contextmenu', enableRightClick, { capture: true });
    document.addEventListener('selectstart', enableSelection, { capture: true });
    document.addEventListener('keydown', enableKeyboard, { capture: true });

    // Also remove the no-right-click class temporarily
    document.body.classList.remove('no-right-click');
    document.body.classList.add('debug-mode');

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', enableRightClick, { capture: true });
      document.removeEventListener('selectstart', enableSelection, { capture: true });
      document.removeEventListener('keydown', enableKeyboard, { capture: true });
      
      // Restore right-click protection when leaving the page
      document.body.classList.add('no-right-click');
      document.body.classList.remove('debug-mode');
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-2 text-xs text-yellow-800">
      🐛 Debug Mode: Right-click enabled
    </div>
  );
};

export default DebugMode;
