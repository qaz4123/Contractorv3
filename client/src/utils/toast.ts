/**
 * Toast Notification Utility
 * Centralized toast notifications for consistent UX
 */

import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};

// Business-specific notifications
export const notifyLeadCreated = (leadAddress: string) => {
  showSuccess(`Lead created: ${leadAddress}`);
};

export const notifyQuoteGenerated = () => {
  showSuccess(`Quote generated successfully`);
};

export const notifyInvoiceSent = (invoiceNumber: string) => {
  showSuccess(`Invoice ${invoiceNumber} sent to client`);
};

export const notifyProjectCreated = (projectName: string) => {
  showSuccess(`Project "${projectName}" created`);
};

export const notifyPaymentReceived = (amount: number) => {
  showSuccess(`Payment received: $${amount.toFixed(2)}`);
};

export const notifyAILimitReached = () => {
  showWarning('AI analysis limit reached. Upgrade your plan for unlimited analyses.');
};

export const notifyUsageCost = (cost: number) => {
  showInfo(`Today's usage cost: $${cost.toFixed(2)}`);
};
