
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface LowRatingConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  rating: number;
}

const LowRatingConfirmDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  rating 
}: LowRatingConfirmDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Confirm Your Rating
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You've given this product a {rating}-star rating. We want to ensure 
              you're confident about your review before submitting.
            </p>
            <p className="text-sm text-slate-600">
              Please double-check:
            </p>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>Your rating accurately reflects your experience</li>
              <li>Your written review explains the reasons for this rating</li>
              <li>You've considered both positive and negative aspects</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Let me reconsider
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Yes, I'm sure about my {rating}-star rating
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LowRatingConfirmDialog;