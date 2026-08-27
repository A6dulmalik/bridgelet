import { PageShell } from '@/components/page-shell';
import { SendPageClient } from '@/components/send-page-client';

export default function SendPage() {
  return (
    <PageShell
      title="Create a new ephemeral account"
      description="Ephemeral accounts are temporary accounts that can be used to send and receive crypto. They are a great way to try out the network without having to create a full account."
    >
      <SendPageClient />
    </PageShell>
  );
}
