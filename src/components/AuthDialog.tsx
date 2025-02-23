
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rnzucysbinhnwyozduel.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenVjeXNiaW5obnd5b3pkdWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzQxNjIsImV4cCI6MjA1NTc1MDE2Mn0.qBfilqDAdpRInNm84elhp9Z-TvBDHhJejsD1CkRxtIw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ isOpen, onOpenChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Check your email to verify your account",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Successfully signed in",
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create an account" : "Sign in to your account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAuth} className="space-y-4 mt-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
