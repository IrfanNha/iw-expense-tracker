"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useUpdateName, useUpdatePin } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateNameSchema, updatePinSchema } from "@/lib/validators";
import { User, Lock, Eye, EyeOff } from "lucide-react";

const nameFormSchema = updateNameSchema;
const pinFormSchema = updatePinSchema;

type NameFormData = z.infer<typeof nameFormSchema>;
type PinFormData = z.infer<typeof pinFormSchema>;

export default function SettingsPage() {
  const { data: session } = useSession();
  const updateName = useUpdateName();
  const updatePin = useUpdatePin();
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  });

  const pinForm = useForm<PinFormData>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
    },
  });

  const onNameSubmit = async (data: NameFormData) => {
    try {
      await updateName.mutateAsync(data);
      alert("Name updated successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to update name");
    }
  };

  const onPinSubmit = async (data: PinFormData) => {
    try {
      await updatePin.mutateAsync(data);
      alert("PIN updated successfully!");
      pinForm.reset();
    } catch (error: any) {
      alert(error.message || "Failed to update PIN");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Name</CardTitle>
              <CardDescription>
                Change your display name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...nameForm.register("name")}
                    placeholder="Enter your name"
                  />
                  {nameForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {nameForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => nameForm.reset({ name: session?.user?.name || "" })}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateName.isPending}>
                    {updateName.isPending ? "Updating..." : "Update Name"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update PIN</CardTitle>
              <CardDescription>
                Change your login PIN. Make sure to remember your new PIN.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPin">Current PIN</Label>
                  <div className="relative">
                    <Input
                      id="currentPin"
                      type={showCurrentPin ? "text" : "password"}
                      {...pinForm.register("currentPin")}
                      placeholder="Enter current PIN"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                    >
                      {showCurrentPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {pinForm.formState.errors.currentPin && (
                    <p className="text-sm text-destructive">
                      {pinForm.formState.errors.currentPin.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPin">New PIN</Label>
                  <div className="relative">
                    <Input
                      id="newPin"
                      type={showNewPin ? "text" : "password"}
                      {...pinForm.register("newPin")}
                      placeholder="Enter new PIN (6-10 digits)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPin(!showNewPin)}
                    >
                      {showNewPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {pinForm.formState.errors.newPin && (
                    <p className="text-sm text-destructive">
                      {pinForm.formState.errors.newPin.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pinForm.reset()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePin.isPending}>
                    {updatePin.isPending ? "Updating..." : "Update PIN"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

