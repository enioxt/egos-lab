import { redirect } from 'next/navigation';

// Redirect to /central/qualidade - jobs are now part of Central
export default function JobsRedirect() {
    redirect('/central/qualidade');
}
