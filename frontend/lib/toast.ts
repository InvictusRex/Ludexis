import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

export { toast };

export function toastError(
  error: unknown,
  fallback = "Request failed",
): void {
  toast.error(getErrorMessage(error, fallback));
}

export function toastSuccess(message: string): void {
  toast.success(message);
}

export function toastInfo(message: string): void {
  toast.info(message);
}
