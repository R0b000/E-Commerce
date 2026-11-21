import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

export interface AppModalProps extends AntModalProps {
  children?: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  children,
  title,
  open,
  onCancel,
  onOk,
  confirmLoading = false,
  okText = 'Confirm',
  cancelText = 'Cancel',
  width = 650,
  className = '',
  style,
  ...props
}) => {
  return (
    <AntModal
      title={<span className="text-base font-bold text-slate-900">{title}</span>}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      okText={okText}
      cancelText={cancelText}
      width={width}
      style={{ top: '2.5rem', ...style }}
      className={`app-modal-top10 ${className}`}
      okButtonProps={{ className: 'bg-[#0096C7] hover:bg-[#007AA3] font-medium' }}
      cancelButtonProps={{ className: 'border-slate-300 text-slate-700' }}
      destroyOnClose
      {...props}
    >
      <div className="text-slate-800">{children}</div>
    </AntModal>
  );
};

export default AppModal;
