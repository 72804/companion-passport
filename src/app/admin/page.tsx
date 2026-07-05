import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <Card>
        <CardTitle>Admin</CardTitle>
        <CardDescription className="mt-2 mb-6">
          Password-protected admin tools for external tester validation.
        </CardDescription>
        <div className="flex flex-col gap-2">
          <Link href="/admin/waitlist">
            <Button className="w-full">Waitlist submissions</Button>
          </Link>
          <Link href="/admin/metrics">
            <Button variant="secondary" className="w-full">
              Product metrics
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
