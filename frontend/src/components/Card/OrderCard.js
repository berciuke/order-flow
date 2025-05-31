import React from 'react';
import Card from './Card';
import Button from '../Button/Button';
import './OrderCard.css';

const OrderCard = ({ order, onViewDetails, onStatusChange, currentUser }) => {
  const isAdmin = currentUser?.isAdmin;
  
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      case 'refunded':
        return 'status-refunded';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak daty';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const calculateTotal = () => {
    if (!order.items || !Array.isArray(order.items)) return '0.00';
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <Card className="order-card">
      <div className="order-card__header">
        <h3 className="order-card__title">Zamówienie #{order.id}</h3>
        <span className={`order-card__status ${getStatusClass(order.status)}`}>
          {order.status}
        </span>
      </div>
      
      <div className="order-card__info">
        <p className="order-card__date">
          <strong>Data:</strong> {formatDate(order.createdAt)}
        </p>
        <p className="order-card__total">
          <strong>Łączna kwota:</strong> {calculateTotal()} zł
        </p>
        <p className="order-card__user">
          <strong>Użytkownik:</strong> {order.user?.email || 'Brak danych'}
        </p>
      </div>
      
      {order.items && order.items.length > 0 && (
        <div className="order-card__items">
          <h4>Produkty:</h4>
          <ul className="order-card__items-list">
            {order.items.map((item, index) => (
              <li key={index} className="order-card__item">
                {item.product?.name || 'Nieznany produkt'} - 
                Ilość: {item.quantity}, 
                Cena: {item.price} zł
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="order-card__actions">
        {onViewDetails && (
          <Button 
            variant="primary" 
            onClick={() => onViewDetails(order.id)}
            className="order-card__action-btn"
          >
            Zobacz szczegóły
          </Button>
        )}
        
        {isAdmin && onStatusChange && (
          <Button 
            variant="secondary" 
            onClick={() => onStatusChange(order)}
            className="order-card__action-btn"
          >
            Zmień status
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OrderCard; 