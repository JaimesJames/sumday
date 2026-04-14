import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        <p>Dayly keeps timestamps in UTC and renders them in local time on the client.</p>
        <p>
          V2 preparation: API key management, request logs, and scope permissions will be added
          here.
        </p>
      </CardContent>
    </Card>
  );
}
