import { PageShell } from '@/components/page-shell';
import { SendForm } from '@/components/send-form';

export default function SendPage() {
  return (
    <PageShell
      title="Send a Payment"
      description="Send crypto to anyone — even recipients with no wallet. They claim from a secure link."
    >
      <SendForm />
    </PageShell>
  );
}
