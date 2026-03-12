'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Log in / sign up only made for email and password currently
export async function logIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect('/student_home');    
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  return { message: 'Check your email to confirm your account!' };
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/student_login');
}