"use client";

import { signup } from './actions'
import { useEffect, useState } from 'react';

export default function SignupPage() {

  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const url = new URL(window.location.href);
    const emailFromUrl = url.searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [setEmail]);

  return (
    <div className="flex flex-col gap-2 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <form className="flex flex-col gap-2">
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required disabled={!!email} value={email ?? undefined}/>
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <button formAction={signup} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md">Create Account</button>
      </form>
    </div>
  )
}