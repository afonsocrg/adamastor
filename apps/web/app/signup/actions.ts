'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const data = { email, password }

  const { data: signupData, error } = await supabase.auth.signUp(data)
  console.log("Signup result", { signupData, error })


  if (error) {
    console.log("Error during signup", { email, error })
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/signup-success')
}