import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'default', 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const buttonClass = `button button--${variant} ${disabled ? 'button--disabled' : ''} ${className}`.trim();

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 