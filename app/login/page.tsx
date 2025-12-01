import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-2 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Log In</h1>
      <form className="flex flex-col gap-2">
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <button formAction={login} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md">Log In</button>
      </form>
    </div>
  )
}