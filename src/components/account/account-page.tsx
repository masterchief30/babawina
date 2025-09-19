"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { formatDistance } from "@/lib/utils"
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Trophy, 
  Target,
  LogOut,
  Trash2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Profile {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
}

interface Entry {
  id: string
  x: number
  y: number
  distance: number | null
  created_at: string
  competitions: {
    title: string
    prize_short: string
    status: string
    ends_at: string
  }
}

interface AccountPageProps {
  user: User
  profile: Profile | null
  entries: Entry[]
}

export function AccountPage({ user, profile, entries }: AccountPageProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)

    try {
      // In a real app, you'd call a server action to properly delete the account
      // This would need to handle cascade deletes and cleanup
      const { error } = await supabase.auth.admin.deleteUser(user.id)

      if (error) throw error

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      })

      window.location.href = "/"
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getEntryStatus = (entry: Entry) => {
    const competition = entry.competitions
    const now = new Date()
    const endDate = new Date(competition.ends_at)

    if (competition.status === "judged") {
      return entry.distance !== null 
        ? `Distance: ${formatDistance(entry.distance)}`
        : "Results pending"
    }
    
    if (competition.status === "closed") {
      return "Judging in progress"
    }
    
    if (endDate > now) {
      return "Active"
    }
    
    return "Ended"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            BabaWina
          </Link>
          
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Account</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Profile</h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div>
                    <Label>Member Since</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Button type="submit" disabled={isUpdating} className="w-full">
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t space-y-3">
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                  
                  <Button 
                    onClick={() => setShowDeleteDialog(true)} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>

            {/* Entries Section */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">My Entries</h2>

                {entries.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven&apos;t participated in any competitions yet.
                    </p>
                    <Link href="/">
                      <Button variant="accent">
                        Play Your First Game
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                              {entry.competitions.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Prize: {entry.competitions.prize_short}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Submitted: {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                              <span>
                                Position: ({Math.round(entry.x)}, {Math.round(entry.y)})
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              entry.competitions.status === "judged" && entry.distance !== null
                                ? "text-accent"
                                : "text-muted-foreground"
                            }`}>
                              {getEntryStatus(entry)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.competitions.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              {entries.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold text-accent">
                      {entries.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Entries
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold text-accent">
                      {entries.filter(e => e.competitions.status === "judged").length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Completed
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              All your entries and data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
