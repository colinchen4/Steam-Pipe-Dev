import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../services/api';

interface Order {
  _id: string;
  items: {
    assetId: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export const OrderStatus = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (user?._id) {
          const data = await orderApi.getUserOrders(user._id);
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="order-status-container">
      <h2>Your Orders</h2>
      {orders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.items.length} items</td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td>{order.status}</td>
                <td>{order.paymentMethod}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};
