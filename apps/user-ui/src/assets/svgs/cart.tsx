import { ShoppingCart, LucideProps } from 'lucide-react';
import React from 'react';

const Cart = ({ size = 28, color = "red", ...props }: LucideProps) => {
  return (
    <ShoppingCart size={size} color={color} {...props} />
  );
};

export default Cart;