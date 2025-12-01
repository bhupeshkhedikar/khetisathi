// InstallPWAButton.jsx
import React, { useEffect, useState } from 'react';

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Stop Chrome from showing its default install banner
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    // After prompt, Chrome blocks re-use of this event
    setDeferredPrompt(null);
    setShowButton(false);

    console.log('User choice: ', choiceResult.outcome);
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
    >
      KhetiSathi App Install करा
    </button>
  );
};

export default InstallPWAButton;
