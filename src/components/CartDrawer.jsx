import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, ShieldCheck, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processCheckoutOrder } from '../data/adminStore';
import YouPiPaymentModal from './YouPiPaymentModal';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  user = null,
  onAdd,
  onRemove,
  onClearCart
}) {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activePaymentOrderId, setActivePaymentOrderId] = useState('');

  const items = Object.values(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + (item.product.originalPrice || item.product.price) * item.quantity, 0);
  const totalSavings = originalSubtotal - subtotal;
  
  // 10-Minute Zero Charges: All delivery and handling charges removed to 0
  const freeDeliveryThreshold = 0;
  const isFreeDelivery = true;
  const deliveryFee = 0;
  const handlingFee = 0;
  const grandTotal = subtotal;

  const handleOpenPayment = () => {
    if (items.length === 0 || isProcessing) return;
    const stableId = `ORD-${Date.now().toString().slice(-6)}`;
    setActivePaymentOrderId(stableId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    setShowPaymentModal(false);
    setIsProcessing(true);
    try {
      const result = await processCheckoutOrder(
        cartItems, 
        user, 
        paymentData.paymentMethod || 'Kirana Pay (UPI)', 
        paymentData
      );

      setCompletedOrder({
        orderId: result.order?.id || activePaymentOrderId,
        amount: grandTotal,
        itemsCount: items.length,
        utr: paymentData.utr
      });
      setOrderPlaced(true);
      onClearCart();
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissSuccess = () => {
    setOrderPlaced(false);
    setCompletedOrder(null);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={onClose}
              className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
                showPaymentModal ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            />

            <div className={`fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 transition-all duration-300 ${
              showPaymentModal ? 'opacity-0 pointer-events-none scale-95 translate-x-10' : 'opacity-100 scale-100 translate-x-0'
            }`}>
              {/* Drawer Panel */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-hero flex flex-col rounded-l-[28px] sm:rounded-l-[38px] border-l border-black/[0.06] overflow-hidden"
              >
              
              {/* Header */}
              <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
                    <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-[#1d1d1f] font-sans">
                      My Bag
                    </h2>
                    <span className="text-[12px] text-[#86868b] font-normal">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={onClose}
                  className="w-8 h-8 text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </motion.button>
              </div>

              {orderPlaced ? (
                /* Order Success */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fbfbfd]"
                >
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-9 h-9 stroke-[2]" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-[#1d1d1f] font-sans">
                    Order Placed Successfully!
                  </h3>
                  {/* Order ID & UTR badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {completedOrder?.orderId && (
                      <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ID: {completedOrder.orderId}
                      </span>
                    )}
                    {completedOrder?.utr && (
                      <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        UTR: {completedOrder.utr}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#86868b] mt-3 max-w-xs leading-relaxed">
                    Your order of <strong className="text-[#1d1d1f]">₹{completedOrder?.amount || grandTotal}</strong> is confirmed via <strong className="text-emerald-700">Kirana Pay</strong> and will arrive in <strong className="text-[#1d1d1f]">15 minutes</strong>.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDismissSuccess}
                    className="mt-6 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-full transition-colors cursor-pointer shadow-sm"
                  >
                    Continue Shopping
                  </motion.button>
                </motion.div>
              ) : items.length === 0 ? (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-18 h-18 rounded-full bg-[#f5f5f7] text-[#86868b] flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] font-sans">
                    Your bag is empty
                  </h3>
                  <p className="text-sm text-[#86868b] mt-1 max-w-xs leading-relaxed">
                    Explore curated pantry staples and fresh farm harvest.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={onClose}
                    className="mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-full transition-colors duration-200 shadow-sm cursor-pointer"
                  >
                    Start Shopping
                  </motion.button>
                </div>
              ) : (
                /* Cart Content */
                <>
                  {/* Delivery Progress */}
                  <div className="bg-[#f5f5f7]/60 p-4 border-b border-black/[0.04] text-xs">
                    {isFreeDelivery ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>You unlocked <strong>Complimentary Express Delivery</strong></span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-[#1d1d1f] font-medium mb-2">
                          <span className="text-[#86868b]">Add ₹{freeDeliveryThreshold - subtotal} for free delivery</span>
                          <span className="font-semibold">₹{subtotal} / ₹{freeDeliveryThreshold}</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 no-scrollbar">
                    <AnimatePresence initial={false}>
                      {items.map(({ product, quantity }) => (
                        <motion.div 
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="flex items-center justify-between gap-3 p-3.5 bg-[#f5f5f7]/80 rounded-[20px] border border-black/[0.03]"
                        >
                          <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 border border-black/[0.05] bg-[#f5f5f7] shadow-xs">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[#1d1d1f] truncate">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-[#86868b]">
                              {product.size}
                            </p>
                            <span className="text-sm font-semibold text-[#1d1d1f] font-sans">
                              ₹{product.price * quantity}
                            </span>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center rounded-full bg-emerald-800 text-white font-medium text-xs shadow-xs overflow-hidden shrink-0">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.88 }}
                              onClick={() => onRemove(product)}
                              className="px-2 py-1.5 hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </motion.button>
                            <span className="px-1.5 text-center text-[11px] font-semibold min-w-[16px]">
                              {quantity}
                            </span>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.88 }}
                              onClick={() => onAdd(product)}
                              className="px-2 py-1.5 hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Bill & Checkout */}
                  <div 
                    className="p-4 sm:p-5 border-t border-black/[0.05] bg-white space-y-3.5"
                    style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
                  >
                    <div className="space-y-1.5 text-xs text-[#86868b]">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium text-[#1d1d1f]">₹{subtotal}</span>
                      </div>
                      {totalSavings > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Savings</span>
                          <span>-₹{totalSavings}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Handling Charge</span>
                        <span className="font-semibold text-emerald-600">FREE (₹0)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Charge</span>
                        <span className="font-semibold text-emerald-600">FREE (₹0)</span>
                      </div>
                      <div className="pt-2 border-t border-black/[0.05] flex justify-between text-sm font-semibold text-[#1d1d1f]">
                        <span>Total</span>
                        <span className="text-base font-semibold">₹{grandTotal}</span>
                      </div>
                    </div>

                    {/* 10-Min Zero Charges Banner */}
                    <div className="py-2 px-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-center text-[11px] font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      <span>10-Minute Zero Charges Active • Extra Fees ₹0</span>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: isProcessing ? 1 : 1.01 }}
                      whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={handleOpenPayment}
                      disabled={isProcessing}
                      className="w-full py-4 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-full shadow-lg shadow-emerald-900/20 transition-colors duration-200 flex items-center justify-between text-sm cursor-pointer"
                    >
                      <div className="flex flex-col text-left leading-tight">
                        <span className="text-[11px] font-medium text-emerald-200 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-300 fill-emerald-300" />
                          Kirana Pay • Direct UPI
                        </span>
                        <span className="text-base font-semibold">₹{grandTotal}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Processing Order...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay with Kirana UPI</span>
                            <ArrowRight className="w-4 h-4 stroke-[2]" />
                          </>
                        )}
                      </div>
                    </motion.button>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-[#86868b] font-normal">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>0% Platform Fee • Powered by Kirana Direct UPI</span>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>

    {/* YouPI-PG UPI Payment Modal - Portaled and decoupled from drawer */}
    <YouPiPaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      amount={grandTotal}
      orderId={activePaymentOrderId}
      customerInfo={user || {}}
      onPaymentSuccess={handlePaymentSuccess}
    />
  </>
  );
}
