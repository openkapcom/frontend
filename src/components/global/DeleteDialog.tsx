import { ConfirmDialog } from '@/components/global/ConfirmDialog';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title = 'Delete',
  description = 'This action cannot be undone. Are you sure you want to proceed?',
  onConfirm,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
}
