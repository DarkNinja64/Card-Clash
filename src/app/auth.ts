'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

// Student sign in with username validity
export async function studentLogIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

    if (profileError || !profile) return { error: 'No account matching this info was found.'};
    if (profile.role !== 'student') {
      await supabase.auth.signOut();
      return { error: 'Not a valid student account.'};
    }

  redirect('/student_home');
}

// Student sign up
export async function studentSignUp(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Sign up failed — no user returned.' };

  // Use admin client so RLS on the profiles table never blocks the insert
  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: data.user.id, role: 'student' });

  if (profileError) return { error: profileError.message };

  return { message: 'Account created successfully! Login to start.' };
}


// Teacher sign in
export async function teacherLogIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) return { error: 'No account matching this info was found.' };

  if (profile.role !== 'teacher') {
    await supabase.auth.signOut();
    return { error: 'Not a valid teacher account.' };
  }


  redirect('/teacher_home');
}

// Teacher sign up
export async function teacherSignUp(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Sign up failed — no user returned.' };

  // Use admin client so RLS on the profiles table never blocks the insert
  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: data.user.id, role: 'teacher' });

  if (profileError) return { error: profileError.message };

  return { message: 'Account created successfully! Login to start.' };
}



export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
