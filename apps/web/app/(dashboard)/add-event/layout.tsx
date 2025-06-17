import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <main className="w-full absolute left-0">{children}</main>;
}
