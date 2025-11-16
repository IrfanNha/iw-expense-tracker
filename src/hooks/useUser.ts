import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export function useUpdateName() {
  const queryClient = useQueryClient();
  const { data: session, update } = useSession();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "name", ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update name");
      }
      const result = await res.json();
      // Update session
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: result.user.name,
          },
        });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useUpdatePin() {
  return useMutation({
    mutationFn: async (data: { currentPin: string; newPin: string }) => {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "pin", ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update PIN");
      }
      return res.json();
    },
  });
}

