import React from 'react';
import './InputField.css';

const InputField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  placeholder,
  disabled = false,
  required = false,
  className = '',
  ...props 
}) => {
  const inputId = `input-${name}`;
  const hasError = Boolean(error);

  return (
    <div className={`input-field ${hasError ? 'input-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-field__label">
          {label}
          {required && <span className="input-field__required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-field__input ${hasError ? 'input-field__input--error' : ''}`}
        {...props}
      />
      
      {hasError && (
        <span className="input-field__error">{error}</span>
      )}
    </div>
  );
};

export default InputField; 