import React from 'react';
import './Card.css';

const Card = ({ children, className = '', onClick, ...props }) => {
  const cardClass = `card ${className}${onClick ? ' card--clickable' : ''}`.trim();

  return (
    <div className={cardClass} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card; 