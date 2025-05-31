import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = ({ message, type, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); 
  };

  const getNotificationIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div 
      className={`notification notification--${type} ${isVisible ? 'notification--visible' : ''} ${isExiting ? 'notification--exiting' : ''}`}
    >
      <div className="notification__icon">
        {getNotificationIcon()}
      </div>
      <div className="notification__message">
        {message}
      </div>
      <button 
        className="notification__close"
        onClick={handleClose}
        aria-label="Zamknij powiadomienie"
      >
        ×
      </button>
    </div>
  );
};

export default Notification; 