
import React from 'react';
import { NotificationCenter } from './NotificationCenter';

const ToastPatcher = () => {
  return (
    <div className="fixed top-5 right-5 z-50 flex gap-2">
      <NotificationCenter />
    </div>
  );
};

export default ToastPatcher;
