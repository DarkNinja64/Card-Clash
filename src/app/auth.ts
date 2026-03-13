'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Student sign in with username validity 
export async function studentLogIn(username: string, email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', data.user.id)
    .single();

    if (profileError || !profile) return { error: 'No account matching this info was found.'};
    if (profile.username !== username) {
      await supabase.auth.signOut();
      return { error: 'Username does not match account.'};
    }

    if (profile.role !== 'student') {
      await supabase.auth.signOut();
      return { error: 'Not a valid student account.'};
    }

  redirect('/student_home');    
}

// Student sign up
export async function studentSignUp(username: string, email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  const {error: profileError }= await supabase
    .from('profiles')
    .insert({id: data.user?.id, username, role: 'student' });

    if (profileError) return { error: profileError.message};

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


  redirect('/student_home');    
}

// Teacher sign up
export async function teacherSignUp(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user?.id, role: 'teacher'});

    if (profileError) return { error: profileError.message};

  return { message: 'Account created successfully! Login to start.' }; 
}



export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}