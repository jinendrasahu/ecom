import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, Wallet, Building2, Lock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'upi' | 'wallet' | 'netbanking';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: <CreditCard className="h-6 w-6" />,
    description: 'Visa, Mastercard, RuPay, Amex',
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: <Smartphone className="h-6 w-6" />,
    description: 'Google Pay, PhonePe, Paytm, BHIM',
  },
  {
    id: 'wallet',
    name: 'Wallets',
    icon: <Wallet className="h-6 w-6" />,
    description: 'Paytm, PhonePe, Amazon Pay',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: <Building2 className="h-6 w-6" />,
    description: 'All major banks',
  },
];

const PaymentGateway = ({ isOpen, onClose, amount, onSuccess }: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [upiId, setUpiId] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const wallets = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'];
  const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'];

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate based on selected method
    if (selectedMethod === 'card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        toast.error('Please fill all card details');
        return;
      }
      if (cardDetails.number.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number');
        return;
      }
    } else if (selectedMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID');
        return;
      }
    } else if (selectedMethod === 'wallet' && !selectedWallet) {
      toast.error('Please select a wallet');
      return;
    } else if (selectedMethod === 'netbanking' && !selectedBank) {
      toast.error('Please select a bank');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      // Randomly succeed or fail (90% success rate for demo)
      const success = Math.random() > 0.1;
      
      setIsProcessing(false);
      
      if (success) {
        toast.success('Payment successful!');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    }, 2000);
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
    setUpiId('');
    setSelectedWallet('');
    setSelectedBank('');
    setIsProcessing(false);
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
              <p className="text-sm text-gray-500 mt-1">Powered by Razorpay</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Amount Display */}
          <div className="px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Amount to pay</span>
              <span className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-6">
            {!selectedMethod ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(option.id)}
                      className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-pink-500">{option.icon}</div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{option.name}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                      <div className="text-pink-500">→</div>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                  <span className="mr-2">←</span> Back
                </button>

                {/* Card Payment Form */}
                {selectedMethod === 'card' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) })}
                          placeholder="123"
                          maxLength={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {selectedMethod === 'upi' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">UPI Payment</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@paytm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Popular UPI Apps:</strong> Google Pay, PhonePe, Paytm, BHIM
                      </p>
                    </div>
                  </div>
                )}

                {/* Wallet Payment Form */}
                {selectedMethod === 'wallet' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Wallet</h3>
                    
                    <div className="space-y-2">
                      {wallets.map((wallet) => (
                        <button
                          key={wallet}
                          onClick={() => setSelectedWallet(wallet)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedWallet === wallet
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{wallet}</span>
                            {selectedWallet === wallet && (
                              <CheckCircle className="h-5 w-5 text-pink-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Banking Form */}
                {selectedMethod === 'netbanking' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Bank</h3>
                    
                    <div className="space-y-2">
                      {banks.map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedBank === bank
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{bank}</span>
                            {selectedBank === bank && (
                              <CheckCircle className="h-5 w-5 text-pink-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-pink-500 text-white py-4 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>Pay ${amount.toFixed(2)}</span>
                    </>
                  )}
                </motion.button>

                {/* Security Note */}
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Lock className="h-4 w-4" />
                  <span>Your payment is secured with 256-bit SSL encryption</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentGateway;

