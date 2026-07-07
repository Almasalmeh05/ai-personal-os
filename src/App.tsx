import { Card, CardBody, CardHeader, Button, Badge } from '@/components/ui';

export default function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <Card>
        <CardHeader title="AI Personal OS" subtitle="Merged and buildable foundation" />
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Badge variant="success">System Ready</Badge>
            <span>Core branches are integrated.</span>
          </div>
          <Button>Launch Workflow</Button>
        </CardBody>
      </Card>
    </main>
  );
}
