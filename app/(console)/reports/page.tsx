import { redirect } from 'next/navigation';

// Reports is an alias for moderation with all statuses visible
export default function ReportsPage() {
  redirect('/moderation?status=all');
}
