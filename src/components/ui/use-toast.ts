import { toast as toastFunction } from "./toast"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export const toast = (props: ToastProps) => {
  return toastFunction(props)
}

export function useToast() {
  return {
    toast
  }
}
