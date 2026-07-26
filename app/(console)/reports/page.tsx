import { redirect } from 'next/navigation';

// Reports redirects to the Issues management page
export default function ReportsPage() {
  redirect('/issues');
}
