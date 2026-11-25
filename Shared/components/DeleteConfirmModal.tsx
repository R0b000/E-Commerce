import React from 'react';
import { ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppModal } from './AppModal';

export interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  itemName?: string;
  itemType?: string;
  description?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  title = 'Delete Confirmation',
  itemName,
  itemType = 'item',
  description,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AppModal
      open={open}
      title={
        <div className="flex items-center gap-2.5 text-rose-600">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0">
            <ExclamationCircleOutlined className="text-base text-rose-600" />
          </div>
          <span className="text-base font-bold text-slate-900">{title}</span>
        </div>
      }
      onCancel={onCancel}
      footer={
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <DeleteOutlined />
            <span>{loading ? 'Deleting...' : `Yes, Delete ${itemType}`}</span>
          </button>
        </div>
      }
      width={480}
    >
      <div className="py-2 space-y-3 text-xs text-slate-600 font-['Poppins','Inter',sans-serif]">
        <p className="leading-relaxed">
          Are you sure you want to permanently delete {itemName ? <strong className="text-slate-900 font-bold">&ldquo;{itemName}&rdquo;</strong> : `this ${itemType}`}?
        </p>
        {description && <div className="text-slate-500">{description}</div>}
        <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-[11px] text-rose-700 leading-relaxed font-medium">
          ⚠️ <strong>Permanent Action:</strong> This operation cannot be reversed. All linked records and data associated with this {itemType} will be permanently removed.
        </div>
      </div>
    </AppModal>
  );
};

export default DeleteConfirmModal;
