Exploring the codebase to understand the project structure and locate the order placement flow.


[4 tools called]


Reviewing the Checkout page to understand the current implementation:


[2 tools called]


Creating a Razorpay-style payment gateway UI component and integrating it into the checkout flow. Adding a payment method selection step before order placement.


[2 tools called]import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Tag } from 'lucide-react';
import { cartApi } from '../api/cart';
import { orderApi } from '../api/orders';
import { discountApi } from '../api/discounts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaymentGateway from '../components/PaymentGateway';

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const { data: listedDiscounts = [] } = useQuery({
    queryKey: ['listed-discounts'],
    queryFn: discountApi.getListedDiscounts,
  });

  const checkoutMutation = useMutation({
    mutationFn: (code?: string) => orderApi.checkout(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
      navigate('/dashboard/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Checkout failed');
    },
  });

  const validateDiscountMutation = useMutation({
    mutationFn: ({ code }: { code: string }) => discountApi.validateDiscountCode(code, subtotal),
    onSuccess: (data, variables) => {
      setAppliedDiscount({ code: variables.code, amount: data.discountAmount });
      setDiscountCode(variables.code);
      toast.success(`Discount ${variables.code} applied!`);
    },
    onError: (error: any) => {
      setAppliedDiscount(null);
      toast.error(error.response?.data?.message || 'Invalid discount code');
    },
  });

  const handleCheckout = () => {
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = () => {
    checkoutMutation.mutate(appliedDiscount?.code || undefined);
  };

  const handleApplyDiscount = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (!formatted) {
      toast.error('Please enter a discount code');
      return;
    }
    validateDiscountMutation.mutate({ code: formatted });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const discountAmount = appliedDiscount?.amount || 0;
  const total = Math.max(subtotal - discountAmount, 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Order Items
          </h2>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={`http://localhost:3001${item.product.imageUrl}`}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-pink-500" />
            Discount Code
          </h2>
          {!appliedDiscount ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="Enter discount code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleApplyDiscount(discountCode)}
                disabled={validateDiscountMutation.isLoading}
                className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {validateDiscountMutation.isLoading ? 'Applying...' : 'Apply'}
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700">
                  Code {appliedDiscount.code} applied (Saved ${appliedDiscount.amount.toFixed(2)})
                </span>
              </div>
              <button
                onClick={() => {
                  setAppliedDiscount(null);
                  setDiscountCode('');
                }}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {listedDiscounts.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Available Discounts</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {listedDiscounts.map((discount) => (
                  <div
                    key={discount.id}
                    className={`border rounded-lg p-3 flex flex-col space-y-2 ${
                      appliedDiscount?.code === discount.code
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{discount.name || discount.code}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {discount.description || 'Limited time offer'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleApplyDiscount(discount.code)}
                        disabled={validateDiscountMutation.isLoading || appliedDiscount?.code === discount.code}
                        className={`text-sm font-semibold px-3 py-1 rounded transition-colors ${
                          appliedDiscount?.code === discount.code
                            ? 'text-green-700 bg-green-100 cursor-not-allowed'
                            : 'text-pink-600 hover:text-pink-700 hover:bg-pink-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {appliedDiscount?.code === discount.code ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">
                        {discount.type === 'percentage'
                          ? `${discount.value}% off`
                          : `$${Number(discount.value).toFixed(2)} off`}
                      </span>
                      {discount.expiresAt && (
                        <span className="text-gray-500">
                          Expires {new Date(discount.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedDiscount.code})</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between text-2xl font-bold text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckout}
            disabled={checkoutMutation.isLoading}
            className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {checkoutMutation.isLoading ? 'Processing...' : 'Proceed to Payment'}
          </motion.button>
        </div>
      </motion.div>

      {/* Payment Gateway Modal */}
      <PaymentGateway
        isOpen={showPaymentGateway}
        onClose={() => setShowPaymentGateway(false)}
        amount={total}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Checkout;

