import React from 'react';
import Card from './Card';
import Button from '../Button/Button';
import './ProductCard.css';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  currentUser 
}) => {
  const getProductInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const isAdmin = currentUser?.isAdmin;

  return (
    <Card className="product-card">
      <div className="product-card__content" onClick={() => onViewDetails?.(product)}>
        <div className="product-card__initial">
          {getProductInitial(product.name)}
        </div>
        
        <div className="product-card__info">
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__price">{product.price} zł</p>
          <p className="product-card__stock">Dostępne: {product.stock}</p>
        </div>
      </div>
      
      <div className="product-card__actions">
        {onAddToCart && product.stock > 0 && (
          <Button 
            variant="primary" 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="product-card__action-btn"
          >
            Dodaj do koszyka
          </Button>
        )}
        
        {product.stock === 0 && (
          <span className="product-card__out-of-stock">Brak w magazynie</span>
        )}
        
        {isAdmin && (
          <div className="product-card__admin-actions">
            {onEdit && (
              <Button 
                variant="secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="product-card__admin-btn"
              >
                Edytuj
              </Button>
            )}
            
            {onDelete && (
              <Button 
                variant="danger" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                className="product-card__admin-btn"
              >
                Usuń
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard; 