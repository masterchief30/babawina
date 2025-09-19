"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PartyPopper } from "lucide-react"

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type AuthFormData = z.infer<typeof authSchema>

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  fromSoccerBall?: boolean
}

export function AuthModal({ isOpen, onClose, onSuccess, fromSoccerBall = false }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  })

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true)
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        
        if (error) throw error
        
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        })
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        })
        
        if (error) throw error
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        })
      }
      
      reset()
      onClose()
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Let's get you in the game</DialogTitle>
          <DialogDescription className="text-gray-600">
            {isLogin 
              ? "Sign in to your account to start playing" 
              : "Create your account to start playing"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              isLogin 
                ? "border-b-2 border-green-500 text-green-600 bg-green-50" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              !isLogin 
                ? "border-b-2 border-green-500 text-green-600 bg-green-50" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            variant="accent"
          >
            {isLoading 
              ? "Please wait..." 
              : isLogin 
                ? "Continue" 
                : "Create my account"
            }
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          18+ only. Play responsibly.
        </div>
      </DialogContent>
    </Dialog>
  )
}
