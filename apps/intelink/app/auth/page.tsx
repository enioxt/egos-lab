/**
 * Legacy Auth Page - Redirects to /login
 * 
 * This page exists only for backwards compatibility.
 * The actual auth page is now at /login (Auth v2.0)
 */

import { redirect } from 'next/navigation';

export default function LegacyAuthPage() {
    redirect('/login');
}
